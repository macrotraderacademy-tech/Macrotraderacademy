import Link from "next/link";
import { logoutAction } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">M</span>
          <span>
            Macrotrader
            <br />
            <span className="brand-sub">Academy</span>
          </span>
        </Link>

        <nav className="nav">
          <Link href="/catalog">Catalogue</Link>

          {user?.role === "STUDENT" && <Link href="/student">Mes cours</Link>}
          {user?.role === "TEACHER" && <Link href="/teacher">Espace prof</Link>}

          {!user && (
            <>
              <Link href="/login">Connexion</Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                Créer un compte
              </Link>
            </>
          )}

          {user && (
            <div className="nav-user">
              <span className="avatar">{initials(user.fullName)}</span>
              <span className="nav-user-name">
                {user.fullName}
                <span>
                  {user.role === "TEACHER" ? "Enseignant" : "Étudiant"}
                </span>
              </span>
              <form action={logoutAction}>
                <button type="submit" className="btn btn-ghost btn-sm">
                  Déconnexion
                </button>
              </form>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
