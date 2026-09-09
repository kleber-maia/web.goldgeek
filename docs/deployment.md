# Deployment & Environments Runbook

Everything about how Gold Geek is hosted, where the databases live, how to deploy,
and how to migrate. If you don't remember how this works — start here.

> Set up 2026-06-29. Vercel team **gold-geek**, project **goldgeek**, GitHub `kleber-maia/web.goldgeek`.

---

## The two environments

| | **Staging** | **Production** |
|---|---|---|
| Git branch | `master` | `production` |
| URL | https://dev.goldgeek.com (also `goldgeek-git-master-gold-geek.vercel.app`) | https://goldgeek.com |
| Vercel env scope | Preview | Production |
| Database (Neon) | `goldgeek-dev` (`ep-sweet-mountain-…`) | `neon-lime-island` (`ep-autumn-mouse-…`) |
| FedEx | **sandbox** keys (`FEDEX_SANDBOX_MODE=true`) | **production** keys |

**Local development** uses the **dev** database too (your `.env` `DATABASE_URL` points at it).

Both databases are managed through the **Vercel Marketplace Neon integration**. The app
reads `DATABASE_URL` per-environment, so each environment automatically hits the right DB.

---

## How to deploy

### Deploy to STAGING
```bash
git push origin master
```
Auto-builds and serves at **dev.goldgeek.com**. Uses the dev DB + sandbox FedEx. Test here first.

### Deploy to PRODUCTION (deliberate — two steps)
```bash
npm run migrate:prod          # 1. apply DB migrations to prod (asks to confirm)
git push origin production    # 2. deploy the code
```
Or merge master → production. To deploy the current code manually: `vercel --prod`.

> ⚠️ **Never push to `master` expecting prod.** master = staging. Production only deploys
> from the `production` branch (or `vercel --prod`).

---

## Database migrations

Builds do **not** run migrations. Apply them yourself:

1. **Create a migration (and apply to dev/local):**
   ```bash
   npm run prisma:migrate        # prisma migrate dev --name <name>
   ```
   This writes the migration file and applies it to your local `.env` DB = the dev DB.
   So staging's database is migrated as a side effect of normal local work.

2. **Apply to production** (do this *before* `git push origin production`):
   ```bash
   npm run migrate:prod
   ```
   Shows pending migrations, asks to confirm, then `prisma migrate deploy` against the
   prod DB's non-pooling endpoint. Forward-only; never resets.

**Rules:**
- Migrations run against the **non-pooling** Neon URL (`DATABASE_URL_UNPOOLED`). The pooled
  URL breaks DDL. (`migrate:prod` handles this automatically.)
- **Never run `prisma migrate reset` against the prod DB.**
- Keep migrations transaction-safe & role-portable (see AGENTS.md → Migration rules) so a
  fresh DB builds cleanly. Two earlier migrations were fixed for this on 2026-06-29.
- Known cosmetic warning: prod's recorded checksums for those two migrations differ from the
  files. `migrate deploy` ignores it; `migrate status`/`migrate dev` print a warning.

---

## Rebuilding / inspecting from scratch

```bash
vercel switch gold-geek                       # CLI defaults to personal scope — always switch first
vercel ls                                     # recent deployments (Environment column shows Preview vs Production)
vercel env ls                                 # env vars and which scope each is in
vercel integration list                       # the two Neon DBs
```

### Reset the dev database (safe — it's disposable)
```bash
# point DATABASE_URL at the dev DB's *unpooled* URL, then:
npx prisma migrate reset      # ONLY ever on dev, NEVER prod
npm run prisma:seed
```

---

## DNS (GoDaddy)

`goldgeek.com` nameservers are GoDaddy (`ns51/ns52.domaincontrol.com`). Subdomains for Vercel
are CNAMEs to `cname.vercel-dns.com.` (with trailing dot, matching the existing `www` record).
`dev.goldgeek.com` is such a CNAME, bound on Vercel to the `master` branch.

To add another Vercel subdomain: add it on Vercel (bound to a branch), then add a matching
`CNAME … cname.vercel-dns.com.` at GoDaddy.

The **Production Branch** setting is dashboard-only in the UI, but settable via the undocumented
API `PATCH /v9/projects/{id}/branch` body `{"branch":"<name>"}` (the documented projects PATCH
rejects it).

---

## FedEx note

Production uses real FedEx keys, but **real labels won't transmit until FedEx's label
validation (Bar Code Analysis) approves them** — submit test labels per the FedEx Shipper
Validation guide. Approval is **per service type**, so re-submit if you change the configured
service in Admin → Settings. FedEx caps jewelry/precious-metals liability at **$1,000/package**.


## September 2026 dashboard security/workflow release

Before deploying this change, provision a persistent random `PAYMENT_DATA_KEY` containing exactly 64 hexadecimal characters in each environment. Keep an encrypted backup. Never commit it or rotate it without re-encrypting stored payment envelopes. `NEXT_PUBLIC_APP_URL` must be the canonical HTTPS origin in deployed environments; incoming Host/Origin headers are not trusted for sign-in links. `CRON_SECRET` is required for both cron endpoints, and FedEx webhook verification must have its signing secret configured.

Apply these additive migrations using the environment's unpooled URL before code deployment: `20260908000000_add_auth_sessions`, `20260908010000_auth_request_limits`, `20260908020000_workflow_delivery`, `20260908030000_kit_request_identity`, and `20260908040000_shipping_operations`. They have been applied to development only. Existing legacy sessions will require sign-in again.

Use `npx tsx scripts/encrypt-payment-data.ts` for the read-only legacy payout migration assessment, then the script's explicit apply mode after the destination key and backup are confirmed. The development dry run found zero plaintext records; it does not describe production. New writes are encrypted, and browser-facing DTOs are masked/minimized during the transition.

`/api/cron/notifications` drains bounded jobs for email, tracking subscription and carrier cancellation. Jobs have retries, leases and stable idempotency keys. `/api/cron/expire-offers` remains a six-hour sweep; request-time deadline enforcement is immediate. Both routes fail closed without the exact bearer secret and return 503 on failed processing. Verify deployed cron execution and inspect unsent outbox jobs after release. Never run a test queue drain using live credentials.

Unknown carrier creation results must be reconciled with FedEx before resetting a generation request. If a result is saved, retry to recover it. Staff can attach a missing original PDF to the same CREATED label using matching tracking/carrier details. A pending carrier cancellation blocks replacement until confirmation.

Run `npm ci`, `npm run prisma:generate`, `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build` and `npm audit` before promotion. Tests require local PostgreSQL binaries (`initdb`, `pg_ctl`, `createdb`) on PATH and create isolated loopback databases. Unix sockets are disabled for these test clusters so Linux runners do not need permission to write system socket directories. The GitHub workflow performs the same regression gates on pull requests and master/production pushes. No hosted CI run or production release was performed during the local audit.

For acceptance boundaries and the original 43 findings, see [Dashboard remediation report](dashboard-remediation-report.md).

FedEx webhook authentication accepts the documented base64 `fdx-signature` header over the exact request body, with legacy hex headers retained for compatibility. Set `FEDEX_WEBHOOK_SECRET` to the same security token configured in the FedEx Developer Portal; generating an unrelated value in Vercel does not configure FedEx. Without a matching token, automatic callbacks remain disabled (401) and staff can update shipment states manually. See [FedEx webhook authentication documentation](https://developer.fedex.com/api/en-us/support.html).
