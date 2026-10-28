import Link from "next/link";
import { createCourseAction } from "@/app/actions";
import { requireTeacher } from "@/lib/auth";
import { listTeacherCourses } from "@/lib/queries";

export const metadata = { title: "Espace enseignant — Macrotrader Academy" };

export default async function TeacherDashboard() {
  const user = await requireTeacher();
  const courses = await listTeacherCourses(user.id);

  const published = courses.filter((course) => course.published).length;
  const students = courses.reduce((total, course) => total + course.studentCount, 0);
  const lessons = courses.reduce((total, course) => total + course.lessonCount, 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Espace enseignant</h1>
          <p>
            Créez vos cours, rédigez les leçons et publiez quand tout est prêt.
          </p>
        </div>
        <form action={createCourseAction}>
          <button type="submit" className="btn btn-primary">
            + Nouveau cours
          </button>
        </form>
      </div>

      <div className="grid" style={{ marginBottom: 32 }}>
        <article className="card">
          <div className="stat-value">{published}</div>
          <div className="stat-label">Cours publiés sur {courses.length}</div>
        </article>
        <article className="card">
          <div className="stat-value">{lessons}</div>
          <div className="stat-label">Leçons rédigées</div>
        </article>
        <article className="card">
          <div className="stat-value">{students}</div>
          <div className="stat-label">Inscriptions cumulées</div>
        </article>
      </div>

      <section>
        <div className="section-head">
          <h2>Mes cours</h2>
        </div>

        {courses.length === 0 ? (
          <div className="empty">
            Vous n&apos;avez pas encore de cours. Utilisez « Nouveau cours » pour
            créer le premier.
          </div>
        ) : (
          <ul className="list">
            {courses.map((course) => (
              <li key={course.id}>
                <Link
                  href={`/teacher/courses/${course.id}`}
                  className="list-item"
                >
                  <span className="list-item-main">
                    <span className="list-item-title">{course.title}</span>
                    <span className="list-item-sub">
                      {course.lessonCount} leçon{course.lessonCount > 1 ? "s" : ""} ·{" "}
                      {course.studentCount} inscrit{course.studentCount > 1 ? "s" : ""} ·{" "}
                      {course.level}
                    </span>
                  </span>
                  <span className={course.published ? "badge badge-ok" : "badge badge-warn"}>
                    {course.published ? "Publié" : "Brouillon"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
