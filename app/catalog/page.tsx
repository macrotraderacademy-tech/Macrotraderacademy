import CourseCard from "@/components/course-card";
import { getCurrentUser } from "@/lib/auth";
import { pool } from "@/lib/db";
import { listPublishedCourses } from "@/lib/queries";

export const metadata = { title: "Catalogue — Macrotrader Academy" };

export default async function CatalogPage() {
  const user = await getCurrentUser();
  const courses = await listPublishedCourses();

  let enrolledIds = new Set<string>();
  if (user?.role === "STUDENT") {
    const { rows } = await pool.query(
      "select course_id from enrollments where user_id = $1",
      [user.id],
    );
    enrolledIds = new Set(rows.map((row) => String(row.course_id)));
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Catalogue des cours</h1>
          <p>
            {courses.length} cours publié{courses.length > 1 ? "s" : ""} par nos
            enseignants. Inscrivez-vous pour suivre les leçons et enregistrer
            votre progression.
          </p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="empty">
          Aucun cours n&apos;est publié pour le moment.
        </div>
      ) : (
        <div className="grid">
          {courses.map((course) => {
            const isEnrolled = enrolledIds.has(course.id);
            return (
              <CourseCard
                key={course.id}
                course={course}
                href={`/courses/${course.id}`}
                footer={
                  isEnrolled ? (
                    <span className="badge badge-ok">Inscrit</span>
                  ) : (
                    <span className="badge">{course.level}</span>
                  )
                }
              />
            );
          })}
        </div>
      )}
    </>
  );
}
