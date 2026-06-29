---
name: release
description: Promote the current master (staging) to production — applies DB migrations to the prod Neon DB, then deploys the code to the production branch, with confirmation gates and post-deploy verification. Use when the user wants to "release", "ship to prod", "deploy to production", or "go live".
user-invocable: true
---

# Release to Production

Promote what's on `master` (staging) to **production**. Background and the full model are in
[docs/deployment.md](../../../docs/deployment.md). master = staging (dev DB); the `production`
branch = prod (prod DB). Builds do NOT run migrations, so migrations are applied here first.

Run these steps in order. **Stop and report** at any failed check — never force past one.

## Step 1 — Preflight

Run and show the user:
```bash
vercel switch gold-geek >/dev/null
git fetch origin --quiet
git status --short                      # working tree must be clean
git rev-parse --abbrev-ref HEAD         # expect: master
git log --oneline origin/production..origin/master   # what will ship (the release diff)
```
- If the working tree is dirty, or HEAD isn't `master`, or `origin/master` is behind local — stop and tell the user to sort it out.
- If `origin/production..origin/master` is empty, there's nothing to release — stop.
- Show the commit list so the user sees exactly what's about to go live.

## Step 2 — Confirm staging is good

Ask the user to confirm they've verified the change on **https://dev.goldgeek.com** (staging).
Do not proceed without a yes.

## Step 3 — Migrate the production database FIRST

```bash
npm run migrate:prod
```
This shows pending migrations, prompts for confirmation, and runs `prisma migrate deploy`
against the prod DB's non-pooling URL. Migrate BEFORE deploying code so the schema is ready.
- If there are no pending migrations, that's fine — continue.
- A checksum-drift warning on the two legacy migrations is expected and harmless (see docs).
- If a migration fails, STOP — do not deploy code against an un-migrated schema.

## Step 4 — Deploy the code to production

Fast-forward `production` to `master` and push (this is what triggers the prod deploy):
```bash
git push origin master:production
```
If it's not a fast-forward (production has commits master doesn't), stop and reconcile with
the user rather than force-pushing.

## Step 5 — Verify the production deploy

```bash
vercel ls --prod          # newest row should reach ● Ready, Environment = Production
```
Poll until the latest Production deployment is `Ready` (or report `Error` with the build log
via `vercel inspect <url> --logs`). Then sanity-check the live site:
```bash
curl -sS -o /dev/null -w "HTTP %{http_code}\n" https://goldgeek.com/
```

## Step 6 — Report

Summarize: commits shipped, migrations applied (or "none"), prod deploy status, and the live URL.

---

### Rollback (if a release goes bad)
Vercel keeps prior production deployments. Roll back instantly by promoting the previous good one:
```bash
vercel ls --prod                                  # find the last good deployment URL
vercel promote <previous-good-deployment-url>     # repoint prod traffic to it
```
Code rollback ≠ DB rollback — if the bad release included a destructive migration, a forward
fix-migration is safer than reverting. Flag this to the user; never `migrate reset` on prod.
