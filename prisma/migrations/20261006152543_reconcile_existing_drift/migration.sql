-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."AssetCategory" ADD VALUE 'AIR_CONDITIONER';
ALTER TYPE "public"."AssetCategory" ADD VALUE 'NO_SYSTEM';

-- DropIndex
DROP INDEX "public"."Asset_governmentAssetNo_key";

-- DropIndex
DROP INDEX "public"."Asset_officeAssetNo_key";

-- AlterTable
ALTER TABLE "public"."Asset" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "responsibleName" TEXT,
ADD COLUMN     "unit" TEXT;

-- AlterTable
ALTER TABLE "public"."IssueItem" ADD COLUMN     "remark" TEXT;

-- CreateIndex
CREATE INDEX "Asset_governmentAssetNo_idx" ON "public"."Asset"("governmentAssetNo" ASC);

-- CreateIndex
CREATE INDEX "Asset_officeAssetNo_idx" ON "public"."Asset"("officeAssetNo" ASC);
