-- CreateTable
CREATE TABLE "ArticleViewHour" (
    "articleId" TEXT NOT NULL,
    "hour" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ArticleViewHour_pkey" PRIMARY KEY ("articleId","hour")
);

-- CreateIndex
CREATE INDEX "ArticleViewHour_hour_idx" ON "ArticleViewHour"("hour");

-- AddForeignKey
ALTER TABLE "ArticleViewHour" ADD CONSTRAINT "ArticleViewHour_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Supabase Data API(anon·authenticated)로는 못 건드리게 한다. 웹·워커는 표 주인으로 붙는다
ALTER TABLE "ArticleViewHour" ENABLE ROW LEVEL SECURITY;
