-- CreateTable
CREATE TABLE "StockCardInspection" (
    "id" SERIAL NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "inspectionDate" TIMESTAMP(3) NOT NULL,
    "inspectorIds" JSONB NOT NULL,
    "inspectorNames" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockCardInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockCardInspectionRow" (
    "id" SERIAL NOT NULL,
    "inspectionId" INTEGER NOT NULL,
    "materialId" INTEGER NOT NULL,
    "accuracy" TEXT,
    "shortageQty" INTEGER,
    "excessQty" INTEGER,
    "baht" INTEGER,
    "satang" INTEGER,
    "damagedQty" INTEGER,
    "deterioratedQty" INTEGER,
    "unnecessaryQty" INTEGER,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockCardInspectionRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockCardInspection_fiscalYear_key" ON "StockCardInspection"("fiscalYear");

-- CreateIndex
CREATE INDEX "StockCardInspection_inspectionDate_idx" ON "StockCardInspection"("inspectionDate");

-- CreateIndex
CREATE INDEX "StockCardInspectionRow_inspectionId_idx" ON "StockCardInspectionRow"("inspectionId");

-- CreateIndex
CREATE INDEX "StockCardInspectionRow_materialId_idx" ON "StockCardInspectionRow"("materialId");

-- CreateIndex
CREATE INDEX "StockCardInspectionRow_accuracy_idx" ON "StockCardInspectionRow"("accuracy");

-- CreateIndex
CREATE UNIQUE INDEX "StockCardInspectionRow_inspectionId_materialId_key" ON "StockCardInspectionRow"("inspectionId", "materialId");

-- AddForeignKey
ALTER TABLE "StockCardInspectionRow" ADD CONSTRAINT "StockCardInspectionRow_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "StockCardInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCardInspectionRow" ADD CONSTRAINT "StockCardInspectionRow_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
