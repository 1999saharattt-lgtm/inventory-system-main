CREATE TABLE "AssetOwnerHistory" (
    "id" SERIAL NOT NULL,
    "assetId" INTEGER NOT NULL,
    "previousOfficerId" INTEGER,
    "nextOfficerId" INTEGER,
    "previousName" TEXT,
    "nextName" TEXT,
    "changedById" INTEGER,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssetOwnerHistory_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AssetOwnerHistory_assetId_changedAt_idx" ON "AssetOwnerHistory"("assetId", "changedAt");
ALTER TABLE "AssetOwnerHistory" ADD CONSTRAINT "AssetOwnerHistory_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
