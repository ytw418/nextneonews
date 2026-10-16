-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "contentUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "netizen" JSONB,
ADD COLUMN     "reactions" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "Entity" ADD COLUMN     "imageMeta" JSONB,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "wikiTitles" JSONB;

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "height" INTEGER,
ADD COLUMN     "width" INTEGER;

-- AlterTable
ALTER TABLE "Translation" ADD COLUMN     "netizen" JSONB,
ADD COLUMN     "poll" JSONB;

-- CreateTable
CREATE TABLE "Poll" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "articleId" TEXT,
    "key" TEXT,
    "optionIds" TEXT[],
    "entityIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "labels" JSONB,
    "totals" JSONB NOT NULL DEFAULT '{}',
    "total" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'open',
    "closesAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Poll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollVote" (
    "pollId" TEXT NOT NULL,
    "option" TEXT NOT NULL,
    "voterHash" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PollVote_pkey" PRIMARY KEY ("pollId","voterHash")
);

-- CreateTable
CREATE TABLE "ReactionVote" (
    "articleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "voterHash" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReactionVote_pkey" PRIMARY KEY ("articleId","voterHash","type")
);

-- CreateTable
CREATE TABLE "CheerVote" (
    "entityId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "voterHash" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheerVote_pkey" PRIMARY KEY ("entityId","day","voterHash")
);

-- CreateTable
CREATE TABLE "EntityMetric" (
    "entityId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "source" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "extra" JSONB,

    CONSTRAINT "EntityMetric_pkey" PRIMARY KEY ("entityId","date","source")
);

-- CreateTable
CREATE TABLE "RankingSnapshot" (
    "id" TEXT NOT NULL,
    "chart" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "sources" JSONB NOT NULL,
    "method" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "correction" TEXT,

    CONSTRAINT "RankingSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Poll_articleId_key" ON "Poll"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "Poll_key_key" ON "Poll"("key");

-- CreateIndex
CREATE INDEX "PollVote_pollId_locale_option_idx" ON "PollVote"("pollId", "locale", "option");

-- CreateIndex
CREATE INDEX "PollVote_ipHash_createdAt_idx" ON "PollVote"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "ReactionVote_ipHash_createdAt_idx" ON "ReactionVote"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "CheerVote_day_entityId_idx" ON "CheerVote"("day", "entityId");

-- CreateIndex
CREATE INDEX "CheerVote_ipHash_createdAt_idx" ON "CheerVote"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "EntityMetric_source_date_idx" ON "EntityMetric"("source", "date");

-- CreateIndex
CREATE INDEX "RankingSnapshot_chart_scope_publishedAt_idx" ON "RankingSnapshot"("chart", "scope", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RankingSnapshot_chart_scope_period_key" ON "RankingSnapshot"("chart", "scope", "period");

-- CreateIndex
CREATE UNIQUE INDEX "Entity_slug_key" ON "Entity"("slug");

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollVote" ADD CONSTRAINT "PollVote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReactionVote" ADD CONSTRAINT "ReactionVote_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
