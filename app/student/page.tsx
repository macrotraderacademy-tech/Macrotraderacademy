import Link from "next/link";
import Progress from "@/components/progress";
import { requireStudent } from "@/lib/auth";
import { listMyCourses, listPublishedCourses } from "@/lib/queries";

export const metadata = { title: "Mes cours — Macrotrader Academy" };

export default async function StudentDashboard() {
  const user = await requireStudent();
  const [myCourses, catalog] = await Promise.all([
    listMyCourses(user.id),
    listPublishedCourses(),
  ]);

  const enrolledIds = new Set(myCourses.map((item) => item.course.id));
  const suggestions = catalog.filter((course) => !enrolledIds.has(course.id));
  const finished = myCourses.filter(
    (item) => item.course.lessonCount > 0 && item.completed === item.course.lessonCount,
  ).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Bonjour {user.fullName.split(" ")[0]}</h1>
          <p>
            {myCourses.length === 0
              ? "Vous n'êtes inscrit à aucun cours pour le moment."
              : `${myCourses.length} cours suivi${myCourses.length > 1 ? "s" : ""} · ${finished} terminé${finished > 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/catalog" className="btn btn-ghost">
          Explorer le catalogue
        </Link>
      </div>

      <div className="stack">
        <section>
          <div className="section-head">
            <h2>Mes cours</h2>
          </div>

          {myCourses.length === 0 ? (
            <div className="empty">
              Inscrivez-vous à un cours depuis le{" "}
              <Link href="/catalog" style={{ color: "var(--accent)" }}>
                catalogue
              </Link>{" "}
              pour commencer.
            </div>
          ) : (
            <div className="grid">
              {myCourses.map(({ course, completed }) => {
                const isDone = completed === course.lessonCount && course.lessonCount > 0;
                return (
                  <article key={course.id} className="card">
                    <div className="meta">
                      <span className="badge">{course.level}</span>
                      {isDone && <span className="badge badge-ok">Terminé</span>}
                    </div>
                    <h3>
                      <Link href={`/courses/${course.id}`}>{course.title}</Link>
                    </h3>
                    <Progress completed={completed} total={course.lessonCount} />
                    <div className="card-foot">
                      <Link href={`/courses/${course.id}`} className="btn btn-ghost btn-sm">
                        {completed === 0 ? "Commencer" : isDone ? "Revoir" : "Continuer"}
                      </Link>
                      <span className="list-item-sub">{course.teacherName}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {suggestions.length > 0 && (
          <section>
            <div className="section-head">
              <div>
                <h2>À découvrir</h2>
                <p>Cours publiés auxquels vous n&apos;êtes pas encore inscrit.</p>
              </div>
            </div>
            <div className="grid">
              {suggestions.slice(0, 3).map((course) => (
                <article key={course.id} className="card">
                  <span className="badge">{course.level}</span>
                  <h3>
                    <Link href={`/courses/${course.id}`}>{course.title}</Link>
                  </h3>
                  <p>{course.summary}</p>
                  <div className="card-foot">
                    <Link href={`/courses/${course.id}`} className="btn btn-ghost btn-sm">
                      Voir le cours
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
