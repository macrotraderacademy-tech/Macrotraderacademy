import Link from "next/link";
import { notFound } from "next/navigation";
import { enrollAction } from "@/app/actions";
import Progress from "@/components/progress";
import { getCurrentUser } from "@/lib/auth";
import {
  courseProgress,
  getCourse,
  isEnrolled,
  listLessons,
} from "@/lib/queries";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, course] = await Promise.all([getCurrentUser(), getCourse(id)]);

  if (!course) notFound();

  const isOwner = user?.role === "TEACHER" && course.teacherId === user.id;
  if (!course.published && !isOwner) notFound();

  const enrolled = user?.role === "STUDENT" ? await isEnrolled(id, user.id) : false;
  const lessons = await listLessons(id, user?.id ?? null);
  const progress =
    enrolled && user ? await courseProgress(id, user.id) : { completed: 0, total: lessons.length };
  const nextLesson = lessons.find((lesson) => !lesson.completed);
  const canRead = isOwner || enrolled;

  return (
    <>
      <div className="crumbs">
        <Link href="/catalog">Catalogue</Link>
        <span>/</span>
        <span>{course.title}</span>
      </div>

      <div className="page-head">
        <div>
          <div className="meta" style={{ marginBottom: 10 }}>
            <span className="badge">{course.level}</span>
            {!course.published && <span className="badge badge-warn">Brouillon</span>}
            {enrolled && <span className="badge badge-ok">Inscrit</span>}
          </div>
          <h1>{course.title}</h1>
          <p>{course.summary}</p>
          <div className="meta" style={{ marginTop: 12 }}>
            <span>Par {course.teacherName}</span>
            <span>
              {course.lessonCount} leçon{course.lessonCount > 1 ? "s" : ""}
            </span>
            <span>
              {course.studentCount} étudiant{course.studentCount > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="stack">
          <section className="panel">
            <h2>À propos de ce cours</h2>
            <p className="panel-hint">Ce que vous allez apprendre</p>
            <div className="prose">
              {course.description || "L'enseignant n'a pas encore ajouté de description."}
            </div>
          </section>

          <section className="panel">
            <h2>Programme</h2>
            <p className="panel-hint">
              {lessons.length} leçon{lessons.length > 1 ? "s" : ""}
              {!canRead && " — inscrivez-vous pour accéder au contenu"}
            </p>

            {lessons.length === 0 ? (
              <div className="empty">
                Aucune leçon pour l&apos;instant. L&apos;enseignant prépare le
                contenu.
              </div>
            ) : (
              <ul className="list">
                {lessons.map((lesson, index) => {
                  const body = (
                    <>
                      <span
                        className={`list-index${lesson.completed ? " list-index-done" : ""}`}
                      >
                        {lesson.completed ? "✓" : index + 1}
                      </span>
                      <span className="list-item-main">
                        <span className="list-item-title">{lesson.title}</span>
                        <span className="list-item-sub">
                          {lesson.completed ? "Terminée" : "À suivre"}
                        </span>
                      </span>
                    </>
                  );

                  return (
                    <li key={lesson.id}>
                      {canRead ? (
                        <Link href={`/lessons/${lesson.id}`} className="list-item">
                          {body}
                        </Link>
                      ) : (
                        <div className="list-item" style={{ opacity: 0.65 }}>
                          {body}
                          <span className="badge">Verrouillé</span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="stack">
          <section className="panel">
            {isOwner ? (
              <>
                <h2>Gestion du cours</h2>
                <p className="panel-hint">
                  Vous êtes l&apos;enseignant de ce cours.
                </p>
                <Link
                  href={`/teacher/courses/${course.id}`}
                  className="btn btn-primary btn-block"
                >
                  Modifier le cours
                </Link>
              </>
            ) : enrolled && user ? (
              <>
                <h2>Votre progression</h2>
                <p className="panel-hint">Reprenez là où vous vous êtes arrêté.</p>
                <Progress completed={progress.completed} total={progress.total} />
                {nextLesson ? (
                  <Link
                    href={`/lessons/${nextLesson.id}`}
                    className="btn btn-primary btn-block"
                    style={{ marginTop: 18 }}
                  >
                    Continuer : {nextLesson.title}
                  </Link>
                ) : (
                  <div className="alert alert-ok" style={{ marginTop: 18, marginBottom: 0 }}>
                    Bravo, vous avez terminé ce cours.
                  </div>
                )}
              </>
            ) : user?.role === "TEACHER" ? (
              <>
                <h2>Accès enseignant</h2>
                <p className="panel-hint">
                  Seuls les étudiants peuvent s&apos;inscrire à un cours.
                </p>
              </>
            ) : user ? (
              <>
                <h2>S&apos;inscrire à ce cours</h2>
                <p className="panel-hint">
                  Accédez à toutes les leçons et suivez votre progression.
                </p>
                <form action={enrollAction}>
                  <input type="hidden" name="courseId" value={course.id} />
                  <button type="submit" className="btn btn-primary btn-block">
                    S&apos;inscrire
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2>Connectez-vous pour vous inscrire</h2>
                <p className="panel-hint">
                  Créez un compte étudiant gratuit pour accéder au contenu.
                </p>
                <Link href="/register" className="btn btn-primary btn-block">
                  Créer un compte
                </Link>
                <p className="auth-switch">
                  Déjà inscrit ? <Link href="/login">Se connecter</Link>
                </p>
              </>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
