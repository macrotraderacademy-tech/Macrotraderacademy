import Link from "next/link";
import { loginAction } from "@/app/actions";

const ERRORS: Record<string, string> = {
  credentials: "E-mail ou mot de passe incorrect.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="auth-card">
      <div className="panel">
        <h1 style={{ fontSize: 22 }}>Connexion</h1>
        <p className="panel-hint">
          Accédez à votre espace étudiant ou enseignant.
        </p>

        {error && <div className="alert">{ERRORS[error] ?? "Une erreur est survenue."}</div>}

        <form action={loginAction}>
          <div className="field">
            <label htmlFor="email">Adresse e-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              className="input"
              autoComplete="email"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            Se connecter
          </button>
        </form>

        <p className="auth-switch">
          Pas encore de compte ? <Link href="/register">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}
