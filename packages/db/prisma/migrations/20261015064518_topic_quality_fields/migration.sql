-- AlterTable
ALTER TABLE "Topic" ADD COLUMN     "brief" TEXT,
ADD COLUMN     "category" "Category",
ADD COLUMN     "format" "ArticleFormat",
ADD COLUMN     "locales" TEXT[];
