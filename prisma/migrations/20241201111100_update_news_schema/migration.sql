/*
  Warnings:

  - The primary key for the `News` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `News` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `summary` on table `News` required. This step will fail if there are existing NULL values in that column.
  - Made the column `imageUrl` on table `News` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "News" DROP CONSTRAINT "News_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "summary" SET NOT NULL,
ALTER COLUMN "content" DROP NOT NULL,
ALTER COLUMN "imageUrl" SET NOT NULL,
ALTER COLUMN "category" DROP DEFAULT,
ADD CONSTRAINT "News_pkey" PRIMARY KEY ("id");
