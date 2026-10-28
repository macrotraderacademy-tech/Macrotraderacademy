import Link from "next/link";
import CourseCard from "@/components/course-card";
import { getCurrentUser } from "@/lib/auth";
import { pool } from "@/lib/db";
import { listPublishedCourses } from "@/lib/queries";

export default async function HomePage() {
  const [user, courses] = await Promise.all([
    getCurrentUser(),
    listPublishedCourses(),
  ]);

  const { rows } = await pool.query(
    `select
       (select count(*)::int from courses where published = true) as courses,
       (select count(*)::int from lessons) as lessons,
       (select count(*)::int from users where role = 'STUDENT') as students`,
  );
  const stats = rows[0];

  const dashboardHref = user?.role === "TEACHER" ? "/teacher" : "/student";

  return (
    <>
      <section className="hero">
        <span className="eyebrow">Centre de formation en ligne</span>
        <h1>
          Apprenez à lire la macroéconomie, <em>pas seulement les graphiques</em>.
        </h1>
        <p className="hero-lead">
          Macrotrader Academy forme les étudiants au raisonnement macro : cycles
          économiques, banques centrales, gestion du risque. Les enseignants
          publient leurs cours et suivent la progression de chaque étudiant.
        </p>

        <div className="hero-actions">
          {user ? (
            <>
              <Link href={dashboardHref} className="btn btn-primary">
                Ouvrir mon espace
              </Link>
              <Link href="/catalog" className="btn btn-ghost">
                Parcourir le catalogue
              </Link>
            </>
          ) : (
            <>
              <Link href="/register" className="btn btn-primary">
                Commencer maintenant
              </Link>
              <Link href="/catalog" className="btn btn-ghost">
                Voir les cours
              </Link>
            </>
          )}
        </div>

        <div className="hero-stats">
          <div>
            <div className="stat-value">{stats.courses}</div>
            <div className="stat-label">Cours publiés</div>
          </div>
          <div>
            <div className="stat-value">{stats.lessons}</div>
            <div className="stat-label">Leçons disponibles</div>
          </div>
          <div>
            <div className="stat-value">{stats.students}</div>
            <div className="stat-label">Étudiants inscrits</div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Deux interfaces, un seul objectif</h2>
            <p>Un parcours étudiant structuré, un espace enseignant complet.</p>
          </div>
        </div>

        <div className="grid">
          <article className="card">
            <span className="badge badge-warn">Étudiant</span>
            <h3>Progressez leçon par leçon</h3>
            <p>
              Inscrivez-vous aux cours publiés, lisez les leçons et cochez votre
              avancement. Votre progression est enregistrée et visible dans votre
              espace.
            </p>
          </article>
          <article className="card">
            <span className="badge badge-warn">Enseignant</span>
            <h3>Publiez et structurez vos cours</h3>
            <p>
              Créez un cours, rédigez ses leçons, choisissez le niveau et publiez
              quand vous êtes prêt. Rien n'est visible avant publication.
            </p>
          </article>
          <article className="card">
            <span className="badge badge-warn">Suivi</span>
            <h3>Voyez qui avance vraiment</h3>
            <p>
              Pour chaque cours, l&apos;enseignant retrouve la liste des étudiants
              inscrits et le nombre de leçons terminées par chacun.
            </p>
          </article>
        </div>
      </section>

      {courses.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <h2>Cours à la une</h2>
              <p>Les derniers parcours publiés par nos enseignants.</p>
            </div>
            <Link href="/catalog" className="link-muted">
              Tout le catalogue →
            </Link>
          </div>

          <div className="grid">
            {courses.slice(0, 3).map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                href={`/courses/${course.id}`}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
