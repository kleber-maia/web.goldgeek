ALTER TABLE "Kit" ADD COLUMN "requestId" TEXT;
CREATE UNIQUE INDEX "Kit_requestId_key" ON "Kit"("requestId");
