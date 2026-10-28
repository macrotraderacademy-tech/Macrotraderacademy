import Link from "next/link";
import { registerAction } from "@/app/actions";

const ERRORS: Record<string, string> = {
  invalid:
    "Vérifiez vos informations : nom complet, e-mail valide et mot de passe d'au moins 8 caractères.",
  exists: "Un compte existe déjà avec cette adresse e-mail.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="auth-card">
      <div className="panel">
        <h1 style={{ fontSize: 22 }}>Créer un compte</h1>
        <p className="panel-hint">
          Choisissez votre profil : étudiant ou enseignant.
        </p>

        {error && <div className="alert">{ERRORS[error] ?? "Une erreur est survenue."}</div>}

        <form action={registerAction}>
          <div className="field">
            <label htmlFor="fullName">Nom complet</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              className="input"
              autoComplete="name"
              required
            />
          </div>
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
            <label htmlFor="password">Mot de passe (8 caractères minimum)</label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <div className="field">
            <label>Je suis…</label>
            <div className="role-picker">
              <label className="role-option">
                <input type="radio" name="role" value="STUDENT" defaultChecked />
                <span>
                  <strong>Étudiant</strong>
                  Je m&apos;inscris aux cours
                </span>
              </label>
              <label className="role-option">
                <input type="radio" name="role" value="TEACHER" />
                <span>
                  <strong>Enseignant</strong>
                  Je publie des cours
                </span>
              </label>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block">
            Créer mon compte
          </button>
        </form>

        <p className="auth-switch">
          Déjà inscrit ? <Link href="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
