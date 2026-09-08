# Authentication and session security

Customer and administrator identities are separate, even when they share an email address.
A successful magic-link verification issues a random 256-bit opaque `gg-session` cookie.
Only its SHA-256 hash is stored in `AuthSession`; identity and account type come from
the associated customer or administrator record, never from cookie claims.

Sessions expire after seven days, enforced by the server. Cookies are HttpOnly,
SameSite=Lax, scoped to `/`, and Secure in production. Signing in rotates and revokes
the previous browser session. Logging out revokes the stored session before deleting
the cookie. Replaying a logged-out cookie does not restore access. Legacy JSON and
raw customer-ID cookies are rejected. Database errors never grant access.

## Rollout

Apply `20260908000000_add_auth_sessions` before deploying session code, following
[the deployment runbook](deployment.md). Existing users must sign in again using a
new magic link. The additive migration does not change customer or administrator
records. Production migration and deployment are separate release actions.

## Regression checks

Run `npm test` with PostgreSQL binaries (`initdb`, `pg_ctl`) on PATH. The runner
creates a fresh loopback-only database, applies all migrations, runs the tests, and
stops the database. It never uses the project environment's database URL. Temporary
clusters remain in the operating system's temporary directory for diagnosis.
Use `npm test -- tests/session.test.ts` to run only session checks.

The integration tests cover both account types, same-email separation, opaque
storage, rotation, logout replay, malformed/legacy/tampered tokens, exact expiration,
and database ownership constraints. Internal-browser checks additionally exercise
the genuine verification endpoint, role-protected pages, and logout.
