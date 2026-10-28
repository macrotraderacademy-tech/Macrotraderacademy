import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { toggleLessonCompleteAction } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";
import { getLesson, isEnrolled, listLessons } from "@/lib/queries";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, lesson] = await Promise.all([getCurrentUser(), getLesson(id)]);

  if (!lesson) notFound();
  if (!user) redirect(`/courses/${lesson.courseId}`);

  const isOwner =
    user.role === "TEACHER" && lesson.courseTeacherId === user.id;
  const enrolled = user.role === "STUDENT" ? await isEnrolled(lesson.courseId, user.id) : false;

  // Students must be enrolled; other teachers keep read-only access.
  if (user.role === "STUDENT" && !enrolled) {
    redirect(`/courses/${lesson.courseId}`);
  }

  const lessons = await listLessons(lesson.courseId, user.id);
  const index = lessons.findIndex((item) => item.id === lesson.id);
  const previous = index > 0 ? lessons[index - 1] : null;
  const next = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null;
  const current = lessons[index];

  return (
    <>
      <div className="crumbs">
        <Link href="/catalog">Catalogue</Link>
        <span>/</span>
        <Link href={`/courses/${lesson.courseId}`}>{lesson.courseTitle}</Link>
        <span>/</span>
        <span>Leçon {index + 1}</span>
      </div>

      <div className="page-head">
        <div>
          <div className="meta" style={{ marginBottom: 10 }}>
            <span className="badge">Leçon {index + 1} sur {lessons.length}</span>
            {current?.completed && <span className="badge badge-ok">Terminée</span>}
          </div>
          <h1 style={{ fontSize: 30 }}>{lesson.title}</h1>
        </div>
      </div>

      <div className="two-col">
        <section className="panel">
          <div className="prose">{lesson.content || "Cette leçon n'a pas encore de contenu."}</div>

          <div className="lesson-nav">
            {user.role === "STUDENT" && (
              <form action={toggleLessonCompleteAction}>
                <input type="hidden" name="lessonId" value={lesson.id} />
                <input type="hidden" name="courseId" value={lesson.courseId} />
                <button
                  type="submit"
                  className={current?.completed ? "btn btn-ghost" : "btn btn-primary"}
                >
                  {current?.completed
                    ? "Marquer comme non terminée"
                    : "Marquer comme terminée"}
                </button>
              </form>
            )}
            {previous && (
              <Link href={`/lessons/${previous.id}`} className="btn btn-ghost">
                ← Précédent
              </Link>
            )}
            {next && (
              <Link href={`/lessons/${next.id}`} className="btn btn-ghost">
                Suivant →
              </Link>
            )}
          </div>
        </section>

        <aside className="panel">
          <h2>Sommaire du cours</h2>
          <p className="panel-hint">{lesson.courseTitle}</p>

          <ul className="list">
            {lessons.map((item, position) => (
              <li key={item.id}>
                <Link
                  href={`/lessons/${item.id}`}
                  className="list-item"
                  style={
                    item.id === lesson.id
                      ? { borderColor: "rgba(240,180,41,0.55)", background: "var(--surface-2)" }
                      : undefined
                  }
                >
                  <span
                    className={`list-index${item.completed ? " list-index-done" : ""}`}
                  >
                    {item.completed ? "✓" : position + 1}
                  </span>
                  <span className="list-item-main">
                    <span className="list-item-title">{item.title}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href={`/courses/${lesson.courseId}`}
            className="btn btn-ghost btn-block"
            style={{ marginTop: 18 }}
          >
            Retour au cours
          </Link>

          {isOwner && (
            <Link
              href={`/teacher/courses/${lesson.courseId}`}
              className="btn btn-ghost btn-block"
              style={{ marginTop: 10 }}
            >
              Modifier ce cours
            </Link>
          )}
        </aside>
      </div>
    </>
  );
}
