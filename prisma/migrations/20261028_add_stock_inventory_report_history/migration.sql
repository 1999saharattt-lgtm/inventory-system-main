CREATE TABLE "StockInventoryReportHistory" (
    "id" SERIAL NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "rows" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockInventoryReportHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StockInventoryReportHistory_fiscalYear_createdAt_idx"
ON "StockInventoryReportHistory"("fiscalYear", "createdAt");
