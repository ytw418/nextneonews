-- AlterTable
ALTER TABLE "Entity" ADD COLUMN     "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[];
