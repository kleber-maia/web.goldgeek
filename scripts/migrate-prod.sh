#!/usr/bin/env bash
# Apply pending Prisma migrations to the PRODUCTION Neon database.
#
# Forward-only (`migrate deploy`) against the NON-POOLING endpoint — the Neon
# pooler (pgbouncer) breaks DDL/advisory locks. Never runs `migrate reset`.
#
# Usage:  npm run migrate:prod
# Requires: Vercel CLI logged in, scope gold-geek (script switches it).
set -euo pipefail

cd "$(dirname "$0")/.."

echo "→ Switching to gold-geek scope…"
vercel switch gold-geek >/dev/null

TMP=".vercel/.env.prod.$$"
trap 'rm -f "$TMP"' EXIT

echo "→ Pulling production env…"
vercel env pull --environment=production "$TMP" --yes >/dev/null

# Prefer the non-pooling URL for migrations; fall back to DATABASE_URL.
URL="$(grep -m1 '^DATABASE_URL_UNPOOLED=' "$TMP" | cut -d= -f2- | sed 's/^"//; s/"$//')"
[ -z "$URL" ] && URL="$(grep -m1 '^POSTGRES_URL_NON_POOLING=' "$TMP" | cut -d= -f2- | sed 's/^"//; s/"$//')"
[ -z "$URL" ] && { echo "✗ No non-pooling prod DB URL found"; exit 1; }

HOST="$(echo "$URL" | sed -E 's#.*@([^/:?]+).*#\1#')"
echo "→ Target prod DB: $HOST"
echo "→ Pending migrations:"
DATABASE_URL="$URL" npx prisma migrate status || true

read -r -p "Apply these to PRODUCTION? [y/N] " ans
[ "$ans" = "y" ] || [ "$ans" = "Y" ] || { echo "Aborted."; exit 1; }

DATABASE_URL="$URL" npx prisma migrate deploy
echo "✓ Production migrations applied."
