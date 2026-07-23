-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Issue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "documentNo" TEXT NOT NULL,
    "issueDate" DATETIME NOT NULL,
    "pdf" TEXT,
    "remark" TEXT,
    "departmentId" INTEGER NOT NULL,
    "officerId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Issue_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Issue_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Issue" ("createdAt", "departmentId", "documentNo", "id", "issueDate", "pdf", "remark") SELECT "createdAt", "departmentId", "documentNo", "id", "issueDate", "pdf", "remark" FROM "Issue";
DROP TABLE "Issue";
ALTER TABLE "new_Issue" RENAME TO "Issue";
CREATE UNIQUE INDEX "Issue_documentNo_key" ON "Issue"("documentNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
