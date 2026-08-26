-- AlterEnum
ALTER TYPE "AssetStatus" ADD VALUE 'DAMAGED';

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "disposalDate" TIMESTAMP(3),
ADD COLUMN     "disposalLocation" TEXT;
