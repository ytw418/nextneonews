-- CreateEnum
CREATE TYPE "Category" AS ENUM ('KPOP', 'TECH', 'AUTO', 'FASHION', 'BEAUTY', 'FOOD', 'TRAVEL', 'ENTERTAINMENT', 'BUSINESS', 'SPORTS', 'OTHER');

-- CreateTable
CREATE TABLE "News" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "category" "Category" NOT NULL DEFAULT 'OTHER',
    "tags" TEXT[],
    "views" INTEGER NOT NULL DEFAULT 0,
    "author" TEXT,
    "source" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Slide" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "category" "Category" NOT NULL DEFAULT 'OTHER',
    "tags" TEXT[],

    CONSTRAINT "Slide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RelatedNews" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_RelatedNews_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_RelatedNews_B_index" ON "_RelatedNews"("B");
