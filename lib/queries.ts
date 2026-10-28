import { pool } from "@/lib/db";

export type Course = {
  id: string;
  title: string;
  summary: string;
  description: string;
  level: string;
  published: boolean;
  teacherId: string;
  teacherName: string;
  lessonCount: number;
  studentCount: number;
};

export type Lesson = {
  id: string;
  title: string;
  content: string;
  position: number;
  completed: boolean;
};

export type StudentOnCourse = {
  id: string;
  fullName: string;
  email: string;
  completedLessons: number;
  enrolledAt: string;
};

const courseColumns = `
  c.id, c.title, c.summary, c.description, c.level, c.published, c.teacher_id,
  u.full_name as teacher_name,
  (select count(*)::int from lessons l where l.course_id = c.id) as lesson_count,
  (select count(*)::int from enrollments e where e.course_id = c.id) as student_count
`;

function mapCourse(row: Record<string, unknown>): Course {
  return {
    id: String(row.id),
    title: String(row.title),
    summary: String(row.summary ?? ""),
    description: String(row.description ?? ""),
    level: String(row.level ?? ""),
    published: Boolean(row.published),
    teacherId: String(row.teacher_id),
    teacherName: String(row.teacher_name ?? ""),
    lessonCount: Number(row.lesson_count ?? 0),
    studentCount: Number(row.student_count ?? 0),
  };
}

export async function listPublishedCourses(): Promise<Course[]> {
  const { rows } = await pool.query(
    `select ${courseColumns}
     from courses c join users u on u.id = c.teacher_id
     where c.published = true
     order by c.created_at desc`,
  );
  return rows.map(mapCourse);
}

export async function listTeacherCourses(teacherId: string): Promise<Course[]> {
  const { rows } = await pool.query(
    `select ${courseColumns}
     from courses c join users u on u.id = c.teacher_id
     where c.teacher_id = $1
     order by c.created_at desc`,
    [teacherId],
  );
  return rows.map(mapCourse);
}

export async function getCourse(courseId: string): Promise<Course | null> {
  const { rows } = await pool.query(
    `select ${courseColumns}
     from courses c join users u on u.id = c.teacher_id
     where c.id = $1`,
    [courseId],
  );
  return rows.length ? mapCourse(rows[0]) : null;
}

export async function listLessons(
  courseId: string,
  userId: string | null,
): Promise<Lesson[]> {
  const { rows } = await pool.query(
    `select l.id, l.title, l.content, l.position,
            exists (
              select 1 from lesson_completions lc
              where lc.lesson_id = l.id and lc.user_id = $2::uuid
            ) as completed
     from lessons l
     where l.course_id = $1
     order by l.position asc, l.created_at asc`,
    [courseId, userId],
  );
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    position: Number(row.position),
    completed: Boolean(row.completed),
  }));
}

export async function isEnrolled(
  courseId: string,
  userId: string,
): Promise<boolean> {
  const { rows } = await pool.query(
    "select 1 from enrollments where course_id = $1 and user_id = $2",
    [courseId, userId],
  );
  return rows.length > 0;
}

/** Lessons completed / total lessons for one student on one course. */
export async function courseProgress(
  courseId: string,
  userId: string,
): Promise<{ completed: number; total: number }> {
  const { rows } = await pool.query(
    `select
       (select count(*)::int from lessons where course_id = $1) as total,
       (select count(*)::int
          from lesson_completions lc
          join lessons l on l.id = lc.lesson_id
         where l.course_id = $1 and lc.user_id = $2) as completed`,
    [courseId, userId],
  );
  return { completed: Number(rows[0].completed), total: Number(rows[0].total) };
}

export async function listMyCourses(userId: string) {
  const { rows } = await pool.query(
    `select ${courseColumns},
       (select count(*)::int
          from lesson_completions lc
          join lessons l on l.id = lc.lesson_id
         where l.course_id = c.id and lc.user_id = $1) as completed_count
     from courses c
     join users u on u.id = c.teacher_id
     join enrollments e on e.course_id = c.id and e.user_id = $1
     order by e.created_at desc`,
    [userId],
  );
  return rows.map((row) => ({
    course: mapCourse(row),
    completed: Number(row.completed_count ?? 0),
  }));
}

export async function listCourseStudents(
  courseId: string,
): Promise<StudentOnCourse[]> {
  const { rows } = await pool.query(
    `select s.id, s.full_name, s.email, e.created_at,
            (select count(*)::int
               from lesson_completions lc
               join lessons l on l.id = lc.lesson_id
              where l.course_id = $1 and lc.user_id = s.id) as completed_lessons
     from enrollments e
     join users s on s.id = e.user_id
     where e.course_id = $1
     order by e.created_at asc`,
    [courseId],
  );
  return rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    completedLessons: Number(row.completed_lessons ?? 0),
    enrolledAt: new Date(row.created_at).toISOString(),
  }));
}

export type LessonDetail = {
  id: string;
  title: string;
  content: string;
  position: number;
  courseId: string;
  courseTitle: string;
  courseTeacherId: string;
};

export async function getLesson(lessonId: string): Promise<LessonDetail | null> {
  const { rows } = await pool.query(
    `select l.id, l.title, l.content, l.position, l.course_id,
            c.title as course_title, c.teacher_id
     from lessons l
     join courses c on c.id = l.course_id
     where l.id = $1`,
    [lessonId],
  );
  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    position: Number(row.position),
    courseId: row.course_id,
    courseTitle: row.course_title,
    courseTeacherId: row.teacher_id,
  };
}
