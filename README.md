# Macrotraderacademy

Centre de formation en ligne avec des interfaces pour les étudiants et pour le
professeur.

## Fonctionnalités

- **Étudiants** : catalogue des cours publiés, inscription, lecture des leçons,
  suivi de progression enregistré (leçon par leçon).
- **Enseignants** : création de cours, rédaction et suppression de leçons,
  publication / dépublication, liste des étudiants inscrits avec leur
  progression.
- **Comptes** : inscription avec choix du rôle, connexion par e-mail + mot de
  passe, session httpOnly signée.

## Stack

Next.js 15 (App Router, Server Actions) · PostgreSQL 16 · Docker Compose.

## Démarrage

```bash
docker compose -f docker-compose.base44.yml up -d --build
```

L'application écoute sur <http://localhost:3000>. Le service `migrate` applique
le schéma et injecte des données de démonstration au premier lancement.

`SESSION_SECRET` (signature des sessions) est fourni par la plateforme dans
`/run/base44/app.env`. En local, définissez-le dans votre environnement.

### Comptes de démonstration

| Rôle       | E-mail                       | Mot de passe  |
| ---------- | ---------------------------- | ------------- |
| Enseignant | prof@macrotrader.academy     | `Teacher123!` |
| Étudiant   | etudiant@macrotrader.academy | `Student123!` |

## Structure

```
app/          pages + Server Actions (auth, cours, leçons)
components/   header, cartes de cours, barre de progression
lib/          accès base (pg), sessions (jose), requêtes
db/schema.sql schéma SQL
scripts/      migration + données de démonstration
```

Notes d'environnement pour le bac à sable Base44 : voir `AGENTS.md`.
