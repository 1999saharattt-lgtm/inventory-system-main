-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Material" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "latestPrice" REAL NOT NULL DEFAULT 0,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "minimumStock" INTEGER NOT NULL DEFAULT 0,
    "remark" TEXT,
    "vendorId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Material_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Material" ("balance", "category", "code", "createdAt", "id", "latestPrice", "minimumStock", "name", "remark", "unit", "updatedAt") SELECT "balance", "category", "code", "createdAt", "id", "latestPrice", "minimumStock", "name", "remark", "unit", "updatedAt" FROM "Material";
DROP TABLE "Material";
ALTER TABLE "new_Material" RENAME TO "Material";
CREATE UNIQUE INDEX "Material_code_key" ON "Material"("code");
CREATE TABLE "new_Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "materialId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "documentNo" TEXT NOT NULL,
    "receiveQty" INTEGER NOT NULL DEFAULT 0,
    "issueQty" INTEGER NOT NULL DEFAULT 0,
    "balance" INTEGER NOT NULL,
    "unitPrice" REAL,
    "vendor" TEXT,
    "department" TEXT,
    "remark" TEXT,
    CONSTRAINT "Transaction_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("balance", "date", "department", "documentNo", "id", "issueQty", "materialId", "receiveQty", "remark", "type", "unitPrice", "vendor") SELECT "balance", "date", "department", "documentNo", "id", "issueQty", "materialId", "receiveQty", "remark", "type", "unitPrice", "vendor" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
