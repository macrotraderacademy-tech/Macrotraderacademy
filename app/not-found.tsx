import Link from "next/link";

export default function NotFound() {
  return (
    <div className="auth-card">
      <div className="panel">
        <h1 style={{ fontSize: 22 }}>Page introuvable</h1>
        <p className="panel-hint">
          Cette page n&apos;existe pas ou n&apos;est pas accessible avec votre
          compte.
        </p>
        <Link href="/catalog" className="btn btn-primary btn-block">
          Retour au catalogue
        </Link>
      </div>
    </div>
  );
}
