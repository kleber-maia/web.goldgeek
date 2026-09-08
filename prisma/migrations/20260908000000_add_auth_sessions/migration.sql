BEGIN;

CREATE TABLE "AuthSession" (
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT,
    "customerId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("tokenHash"),
    CONSTRAINT "AuthSession_one_owner" CHECK (
        ("userId" IS NOT NULL) <> ("customerId" IS NOT NULL)
    ),
    CONSTRAINT "AuthSession_token_hash_format" CHECK ("tokenHash" ~ '^[a-f0-9]{64}$'),
    CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AuthSession_customerId_fkey" FOREIGN KEY ("customerId")
        REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "AuthSession_userId_idx" ON "AuthSession"("userId");
CREATE INDEX "AuthSession_customerId_idx" ON "AuthSession"("customerId");
CREATE INDEX "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt");

-- Match the existing private-table policy: application access uses the table owner.
ALTER TABLE "AuthSession" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "AuthSession" FROM PUBLIC;

COMMIT;
