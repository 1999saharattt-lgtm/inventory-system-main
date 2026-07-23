/*
  Warnings:

  - You are about to drop the column `name` on the `Officer` table. All the data in the column will be lost.
  - Added the required column `firstName` to the `Officer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Officer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Officer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Officer` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Officer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Officer_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Officer" ("id", "position", "sectionId") SELECT "id", "position", "sectionId" FROM "Officer";
DROP TABLE "Officer";
ALTER TABLE "new_Officer" RENAME TO "Officer";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
