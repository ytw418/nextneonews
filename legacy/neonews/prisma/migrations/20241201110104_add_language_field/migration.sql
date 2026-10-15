/*
  Warnings:

  - You are about to drop the column `date` on the `News` table. All the data in the column will be lost.
  - You are about to drop the column `publishedAt` on the `News` table. All the data in the column will be lost.
  - You are about to drop the `_RelatedNews` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `category` on the `News` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `category` on the `Slide` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "News" DROP COLUMN "date",
DROP COLUMN "publishedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "category",
ADD COLUMN     "category" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Slide" DROP COLUMN "category",
ADD COLUMN     "category" TEXT NOT NULL;

-- DropTable
DROP TABLE "_RelatedNews";

-- DropEnum
DROP TYPE "Category";
