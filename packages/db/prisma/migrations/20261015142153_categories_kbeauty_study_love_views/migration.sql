-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Category" ADD VALUE 'KBEAUTY';
ALTER TYPE "Category" ADD VALUE 'STUDY';
ALTER TYPE "Category" ADD VALUE 'LOVE';

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Article_status_views_idx" ON "Article"("status", "views");
