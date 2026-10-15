-- AlterTable
ALTER TABLE "Topic" ADD COLUMN     "angle" TEXT,
ADD COLUMN     "factUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
