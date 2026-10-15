-- CreateTable
CREATE TABLE "GeoCheck" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "engine" TEXT NOT NULL,
    "ourCited" BOOLEAN NOT NULL,
    "citedUrls" TEXT[],
    "citedDomains" TEXT[],
    "searchedDomains" TEXT[],
    "answerExcerpt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeoCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeoCheck_question_createdAt_idx" ON "GeoCheck"("question", "createdAt");
