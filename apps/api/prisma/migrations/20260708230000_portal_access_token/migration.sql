-- CreateTable
CREATE TABLE "portal_access_tokens" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "label" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "portal_access_tokens_tokenHash_key" ON "portal_access_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "portal_access_tokens_tenantId_idx" ON "portal_access_tokens"("tenantId");

-- CreateIndex
CREATE INDEX "portal_access_tokens_clientId_idx" ON "portal_access_tokens"("clientId");

-- CreateIndex
CREATE INDEX "portal_access_tokens_expiresAt_idx" ON "portal_access_tokens"("expiresAt");

-- AddForeignKey
ALTER TABLE "portal_access_tokens" ADD CONSTRAINT "portal_access_tokens_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_access_tokens" ADD CONSTRAINT "portal_access_tokens_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
