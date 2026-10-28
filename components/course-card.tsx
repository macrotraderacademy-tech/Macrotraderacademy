import Link from "next/link";
import type { Course } from "@/lib/queries";

export default function CourseCard({
  course,
  href,
  footer,
}: {
  course: Course;
  href: string;
  footer?: React.ReactNode;
}) {
  return (
    <article className="card">
      <div className="card-link">
        <div className="meta">
          <span className="badge">{course.level}</span>
          {!course.published && <span className="badge badge-warn">Brouillon</span>}
        </div>
        <h3>
          <Link href={href}>{course.title}</Link>
        </h3>
        <p>{course.summary || "Pas encore de résumé."}</p>
        <div className="meta">
          <span>
            {course.lessonCount} leçon{course.lessonCount > 1 ? "s" : ""}
          </span>
          <span>
            {course.studentCount} inscrit{course.studentCount > 1 ? "s" : ""}
          </span>
          <span>{course.teacherName}</span>
        </div>
      </div>
      <div className="card-foot">
        {footer ?? (
          <Link href={href} className="btn btn-ghost btn-sm">
            Voir le cours
          </Link>
        )}
      </div>
    </article>
  );
}
