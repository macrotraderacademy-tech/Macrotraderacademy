"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import {
  createSession,
  destroySession,
  getCurrentUser,
  requireTeacher,
  requireUser,
} from "@/lib/auth";

function text(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function registerAction(form: FormData) {
  const email = text(form, "email").toLowerCase();
  const fullName = text(form, "fullName");
  const password = String(form.get("password") ?? "");
  const role = text(form, "role") === "TEACHER" ? "TEACHER" : "STUDENT";

  if (!email.includes("@") || fullName.length < 2 || password.length < 8) {
    redirect("/register?error=invalid");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  let userId: string;
  try {
    const { rows } = await pool.query(
      `insert into users (email, password_hash, full_name, role)
       values ($1, $2, $3, $4) returning id`,
      [email, passwordHash, fullName, role],
    );
    userId = rows[0].id;
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "23505") redirect("/register?error=exists");
    throw error;
  }

  await createSession(userId);
  revalidatePath("/");
  redirect(role === "TEACHER" ? "/teacher" : "/student");
}

export async function loginAction(form: FormData) {
  const email = text(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");

  const { rows } = await pool.query(
    "select id, password_hash, role from users where email = $1",
    [email],
  );

  if (rows.length === 0) redirect("/login?error=credentials");

  const valid = await bcrypt.compare(password, rows[0].password_hash);
  if (!valid) redirect("/login?error=credentials");

  await createSession(rows[0].id);
  revalidatePath("/");
  redirect(rows[0].role === "TEACHER" ? "/teacher" : "/student");
}

export async function logoutAction() {
  await destroySession();
  revalidatePath("/");
  redirect("/");
}

/** Throws unless the signed-in teacher owns the course. */
async function assertCourseOwner(courseId: string) {
  const teacher = await requireTeacher();
  const { rows } = await pool.query(
    "select 1 from courses where id = $1 and teacher_id = $2",
    [courseId, teacher.id],
  );
  if (rows.length === 0) redirect("/teacher");
  return teacher;
}

export async function createCourseAction() {
  const teacher = await requireTeacher();
  const { rows } = await pool.query(
    `insert into courses (teacher_id, title, summary, description, level)
     values ($1, $2, '', '', 'Débutant') returning id`,
    [teacher.id, "Nouveau cours"],
  );
  revalidatePath("/teacher");
  redirect(`/teacher/courses/${rows[0].id}`);
}

export async function updateCourseAction(form: FormData) {
  const courseId = text(form, "courseId");
  await assertCourseOwner(courseId);

  const title = text(form, "title");
  const summary = text(form, "summary");
  const description = text(form, "description");
  const level = text(form, "level");

  if (title.length < 3) {
    redirect(`/teacher/courses/${courseId}?error=title`);
  }

  await pool.query(
    `update courses
        set title = $2, summary = $3, description = $4, level = $5
      where id = $1`,
    [courseId, title, summary, description, level || "Débutant"],
  );

  revalidatePath(`/teacher/courses/${courseId}`);
  revalidatePath("/catalog");
  redirect(`/teacher/courses/${courseId}?saved=1`);
}

export async function togglePublishAction(form: FormData) {
  const courseId = text(form, "courseId");
  await assertCourseOwner(courseId);

  await pool.query(
    "update courses set published = not published where id = $1",
    [courseId],
  );

  revalidatePath(`/teacher/courses/${courseId}`);
  revalidatePath("/catalog");
  redirect(`/teacher/courses/${courseId}`);
}

export async function addLessonAction(form: FormData) {
  const courseId = text(form, "courseId");
  await assertCourseOwner(courseId);

  const title = text(form, "title");
  const content = text(form, "content");
  if (title.length < 3) {
    redirect(`/teacher/courses/${courseId}?error=lesson`);
  }

  await pool.query(
    `insert into lessons (course_id, title, content, position)
     values ($1, $2, $3,
       coalesce((select max(position) + 1 from lessons where course_id = $1), 0))`,
    [courseId, title, content],
  );

  revalidatePath(`/teacher/courses/${courseId}`);
  revalidatePath("/catalog");
  redirect(`/teacher/courses/${courseId}?saved=1`);
}

export async function deleteLessonAction(form: FormData) {
  const courseId = text(form, "courseId");
  const lessonId = text(form, "lessonId");
  await assertCourseOwner(courseId);

  await pool.query("delete from lessons where id = $1 and course_id = $2", [
    lessonId,
    courseId,
  ]);

  revalidatePath(`/teacher/courses/${courseId}`);
  redirect(`/teacher/courses/${courseId}`);
}

export async function enrollAction(form: FormData) {
  const courseId = text(form, "courseId");
  const user = await requireUser();

  if (user.role !== "STUDENT") redirect(`/courses/${courseId}`);

  await pool.query(
    `insert into enrollments (course_id, user_id) values ($1, $2)
     on conflict (course_id, user_id) do nothing`,
    [courseId, user.id],
  );

  revalidatePath("/student");
  revalidatePath(`/courses/${courseId}`);
  redirect(`/courses/${courseId}`);
}

export async function toggleLessonCompleteAction(form: FormData) {
  const lessonId = text(form, "lessonId");
  const courseId = text(form, "courseId");
  const user = await requireUser();

  if (user.role !== "STUDENT") redirect(`/lessons/${lessonId}`);

  const enrollment = await pool.query(
    "select 1 from enrollments where course_id = $1 and user_id = $2",
    [courseId, user.id],
  );
  if (enrollment.rows.length === 0) redirect(`/courses/${courseId}`);

  const done = await pool.query(
    "select 1 from lesson_completions where lesson_id = $1 and user_id = $2",
    [lessonId, user.id],
  );

  if (done.rows.length > 0) {
    await pool.query(
      "delete from lesson_completions where lesson_id = $1 and user_id = $2",
      [lessonId, user.id],
    );
  } else {
    await pool.query(
      "insert into lesson_completions (lesson_id, user_id) values ($1, $2)",
      [lessonId, user.id],
    );
  }

  revalidatePath(`/lessons/${lessonId}`);
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/student");
  redirect(`/lessons/${lessonId}`);
}
