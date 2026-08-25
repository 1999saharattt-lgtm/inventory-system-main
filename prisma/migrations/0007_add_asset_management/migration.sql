-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('DESK', 'CHAIR', 'CABINET', 'COMPUTER', 'MONITOR', 'PRINTER', 'TELEPHONE', 'SHELF', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('IN_USE', 'WAITING_DISPOSAL', 'DISPOSED');

-- CreateEnum
CREATE TYPE "AssetInspectionStatus" AS ENUM ('IN_USE', 'RETURNED', 'DAMAGED', 'MISSING', 'NOT_FOUND');

-- CreateEnum
CREATE TYPE "InspectionQuarter" AS ENUM ('Q1', 'Q2', 'Q3', 'Q4');

-- CreateTable
CREATE TABLE "Asset" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" "AssetCategory" NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "governmentAssetNo" TEXT,
    "officeAssetNo" TEXT,
    "departmentId" INTEGER NOT NULL,
    "sectionId" INTEGER,
    "officerId" INTEGER,
    "status" "AssetStatus" NOT NULL DEFAULT 'IN_USE',
    "purchaseDate" TIMESTAMP(3),
    "price" DOUBLE PRECISION,
    "location" TEXT,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetInspection" (
    "id" SERIAL NOT NULL,
    "assetId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" "InspectionQuarter" NOT NULL,
    "inspectionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "AssetInspectionStatus" NOT NULL,
    "condition" TEXT,
    "location" TEXT,
    "remark" TEXT,
    "inspectorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetInspection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_governmentAssetNo_key" ON "Asset"("governmentAssetNo");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_officeAssetNo_key" ON "Asset"("officeAssetNo");

-- CreateIndex
CREATE INDEX "Asset_departmentId_idx" ON "Asset"("departmentId");

-- CreateIndex
CREATE INDEX "Asset_sectionId_idx" ON "Asset"("sectionId");

-- CreateIndex
CREATE INDEX "Asset_officerId_idx" ON "Asset"("officerId");

-- CreateIndex
CREATE INDEX "Asset_category_idx" ON "Asset"("category");

-- CreateIndex
CREATE INDEX "Asset_status_idx" ON "Asset"("status");

-- CreateIndex
CREATE INDEX "AssetInspection_assetId_idx" ON "AssetInspection"("assetId");

-- CreateIndex
CREATE INDEX "AssetInspection_year_idx" ON "AssetInspection"("year");

-- CreateIndex
CREATE INDEX "AssetInspection_quarter_idx" ON "AssetInspection"("quarter");

-- CreateIndex
CREATE INDEX "AssetInspection_status_idx" ON "AssetInspection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AssetInspection_assetId_year_quarter_key" ON "AssetInspection"("assetId", "year", "quarter");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetInspection" ADD CONSTRAINT "AssetInspection_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

