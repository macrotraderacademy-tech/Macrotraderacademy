# Base44 sandbox notes

Non-obvious facts about running this repo in the Base44 preview sandbox. Product
documentation lives in `README.md`.

## Stack

- Next.js 15 (App Router) with **`next dev`** — the browser talks to one origin
  only: the Next server on port 3000 serves both pages and Server Actions, so
  there is no CORS or cross-origin cookie wiring.
- PostgreSQL 16 as a plain compose service.
- Auth is hand-rolled: `users` table + bcrypt hash + an HS256 JWT in an httpOnly
  cookie (`mta_session`). No external auth provider.

## Run

```bash
docker compose -f docker-compose.base44.yml up -d --build
```

Do **not** use a production `next build` image here: the compose stack exists so
source edits are picked up by the dev server.

## Gotchas

- **Dependencies live in the image**, not in a sandbox volume. After changing
  `package.json` / `package-lock.json`: `docker compose -f docker-compose.base44.yml build`
  then `up -d`. Editing app source needs no rebuild.
- **`SESSION_SECRET` is required to log in** and comes from the platform-managed
  `/run/base44/app.env` (last `env_file`, so the dashboard value wins). Never put
  it under compose `environment:` or the user's value would be permanently
  shadowed. Missing it throws `SESSION_SECRET is not set` on any auth action.
- **Database credentials are local infra**, written inline in the compose file
  (`mta` / `mta_dev_password`), not platform secrets.
- **Migrations + demo seed** run as the one-shot `migrate` service before `web`
  starts (`condition: service_completed_successfully`). It applies
  `db/schema.sql` (idempotent) and seeds only when `users` is empty.
- **Preview origin**: `next.config.ts` appends `allowedDevOrigins` only when
  `BASE44_PREVIEW_MODE === "1"`, using `3000-${BASE44_PUBLIC_HOST_SUFFIX}` (the
  Origin the browser sends) and `*.${BASE44_SANDBOX_HOST_DOMAIN}`. Without it
  Next blocks dev assets/HMR through the proxy. Unset → stock Next behaviour.
- **Server Actions need the same host list** (`experimental.serverActions.allowedOrigins`,
  same preview-only gating). Next compares the request `Origin` against the
  forwarded `host` and rejects every form submit with
  `Invalid Server Actions request` when they differ — which is exactly the
  proxy situation. Symptom: the login form throws a runtime error overlay and
  the URL stays on `/login`. If you add another proxied host, add it there too.
  Editing `next.config.ts` makes `next dev` restart itself (watch the logs).
- **File watching is polled** (`WATCHPACK_POLLING`, `CHOKIDAR_USEPOLLING`)
  because bind mounts on this VM do not deliver inotify events.
- Next writes `.next/` and `next-env.d.ts` into the bind mount; both are
  gitignored.

## Demo accounts

| Rôle       | E-mail                          | Mot de passe |
| ---------- | ------------------------------- | ------------ |
| Enseignant | prof@macrotrader.academy        | `Teacher123!` |
| Étudiant   | etudiant@macrotrader.academy    | `Student123!` |

## Verify

```bash
docker compose -f docker-compose.base44.yml ps          # db healthy, migrate exited 0, web healthy
curl -s http://localhost:3000/ | grep -o "Macrotrader"  # served page
docker compose -f docker-compose.base44.yml exec -T web npx tsc --noEmit
```

Then in the preview: log in as the student → open a course → mark a lesson
complete → the progress bar moves. Log in as the teacher → **Espace prof** →
open a course → add a lesson → **Publier**.

## Reset

```bash
docker compose -f docker-compose.base44.yml down -v   # drops the db volume
```
