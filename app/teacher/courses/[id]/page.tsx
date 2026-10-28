import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addLessonAction,
  deleteLessonAction,
  togglePublishAction,
  updateCourseAction,
} from "@/app/actions";
import { requireTeacher } from "@/lib/auth";
import {
  getCourse,
  listCourseStudents,
  listLessons,
} from "@/lib/queries";

const LEVELS = ["Débutant", "Intermédiaire", "Avancé"];

export default async function TeacherCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { error, saved } = await searchParams;

  const user = await requireTeacher();
  const course = await getCourse(id);
  if (!course || course.teacherId !== user.id) notFound();

  const [lessons, students] = await Promise.all([
    listLessons(id, user.id),
    listCourseStudents(id),
  ]);

  return (
    <>
      <div className="crumbs">
        <Link href="/teacher">Espace enseignant</Link>
        <span>/</span>
        <span>{course.title}</span>
      </div>

      <div className="page-head">
        <div>
          <div className="meta" style={{ marginBottom: 10 }}>
            <span className={course.published ? "badge badge-ok" : "badge badge-warn"}>
              {course.published ? "Publié" : "Brouillon"}
            </span>
            <span className="badge">
              {course.lessonCount} leçon{course.lessonCount > 1 ? "s" : ""}
            </span>
            <span className="badge">
              {course.studentCount} inscrit{course.studentCount > 1 ? "s" : ""}
            </span>
          </div>
          <h1>{course.title}</h1>
        </div>

        <div className="hero-actions" style={{ marginTop: 0 }}>
          <form action={togglePublishAction}>
            <input type="hidden" name="courseId" value={course.id} />
            <button
              type="submit"
              className={course.published ? "btn btn-ghost" : "btn btn-primary"}
            >
              {course.published ? "Dépublier" : "Publier le cours"}
            </button>
          </form>
          <Link href={`/courses/${course.id}`} className="btn btn-ghost">
            Voir la page publique
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert">
          {error === "title"
            ? "Le titre doit contenir au moins 3 caractères."
            : "La leçon doit avoir un titre d'au moins 3 caractères."}
        </div>
      )}
      {saved && <div className="alert alert-ok">Modifications enregistrées.</div>}

      <div className="two-col">
        <div className="stack">
          <section className="panel">
            <h2>Informations du cours</h2>
            <p className="panel-hint">
              Ces informations apparaissent sur la fiche du cours.
            </p>

            <form action={updateCourseAction}>
              <input type="hidden" name="courseId" value={course.id} />

              <div className="field">
                <label htmlFor="title">Titre</label>
                <input
                  id="title"
                  name="title"
                  className="input"
                  defaultValue={course.title}
                  required
                  minLength={3}
                />
              </div>

              <div className="form-row">
                <div className="field">
                  <label htmlFor="level">Niveau</label>
                  <select
                    id="level"
                    name="level"
                    className="select"
                    defaultValue={course.level}
                  >
                    {LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="summary">Résumé court</label>
                  <input
                    id="summary"
                    name="summary"
                    className="input"
                    defaultValue={course.summary}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  className="textarea"
                  defaultValue={course.description}
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Enregistrer
              </button>
            </form>
          </section>

          <section className="panel">
            <h2>Leçons</h2>
            <p className="panel-hint">
              {lessons.length} leçon{lessons.length > 1 ? "s" : ""} dans ce cours.
            </p>

            {lessons.length === 0 ? (
              <div className="empty">
                Aucune leçon. Ajoutez la première ci-dessous.
              </div>
            ) : (
              <ul className="list">
                {lessons.map((lesson, index) => (
                  <li key={lesson.id} className="list-item">
                    <span className="list-index">{index + 1}</span>
                    <span className="list-item-main">
                      <span className="list-item-title">{lesson.title}</span>
                      <span className="list-item-sub">
                        {lesson.content
                          ? `${lesson.content.slice(0, 90)}${lesson.content.length > 90 ? "…" : ""}`
                          : "Contenu vide"}
                      </span>
                    </span>
                    <Link href={`/lessons/${lesson.id}`} className="btn btn-ghost btn-sm">
                      Voir
                    </Link>
                    <form action={deleteLessonAction}>
                      <input type="hidden" name="courseId" value={course.id} />
                      <input type="hidden" name="lessonId" value={lesson.id} />
                      <button type="submit" className="btn btn-danger btn-sm">
                        Supprimer
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <h2>Ajouter une leçon</h2>
            <p className="panel-hint">
              La leçon est ajoutée à la fin du programme.
            </p>

            <form action={addLessonAction}>
              <input type="hidden" name="courseId" value={course.id} />

              <div className="field">
                <label htmlFor="lesson-title">Titre de la leçon</label>
                <input
                  id="lesson-title"
                  name="title"
                  className="input"
                  required
                  minLength={3}
                  placeholder="Ex. Lire une décision de banque centrale"
                />
              </div>

              <div className="field">
                <label htmlFor="lesson-content">Contenu</label>
                <textarea
                  id="lesson-content"
                  name="content"
                  className="textarea"
                  placeholder="Rédigez le contenu de la leçon…"
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Ajouter la leçon
              </button>
            </form>
          </section>
        </div>

        <aside className="stack">
          <section className="panel">
            <h2>Étudiants inscrits</h2>
            <p className="panel-hint">
              {students.length === 0
                ? "Personne n'est encore inscrit."
                : `${students.length} étudiant${students.length > 1 ? "s" : ""} · ${course.lessonCount} leçons au programme`}
            </p>

            {students.length > 0 && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Étudiant</th>
                    <th>Progression</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <div>{student.fullName}</div>
                        <div className="list-item-sub">{student.email}</div>
                      </td>
                      <td>
                        {student.completedLessons}/{course.lessonCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!course.published && (
              <div className="alert" style={{ marginTop: 18, marginBottom: 0 }}>
                Ce cours est en brouillon : il n&apos;apparaît pas dans le
                catalogue et les étudiants ne peuvent pas s&apos;inscrire.
              </div>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
