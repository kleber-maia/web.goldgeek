BEGIN;
CREATE TABLE "AuthRequestLimit" (
  "key" TEXT PRIMARY KEY,
  "count" INTEGER NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "AuthRequestLimit_expiresAt_idx" ON "AuthRequestLimit"("expiresAt");
ALTER TABLE "AuthRequestLimit" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "AuthRequestLimit" FROM PUBLIC;
COMMIT;
