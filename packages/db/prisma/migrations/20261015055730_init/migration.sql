-- CreateEnum
CREATE TYPE "RiskTier" AS ENUM ('GREEN', 'YELLOW', 'RED');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('KPOP', 'KDRAMA', 'KFOOD', 'TRAVEL', 'WORKING_HOLIDAY', 'JOBS', 'HOUSING', 'LIFE');

-- CreateEnum
CREATE TYPE "ArticleFormat" AS ENUM ('ISSUE', 'REACTION', 'QNA', 'GUIDE', 'LIST');

-- CreateEnum
CREATE TYPE "TopicStatus" AS ENUM ('NEW', 'QUEUED', 'WRITING', 'DONE', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SourceKind" AS ENUM ('OFFICIAL', 'NEWS', 'COMMUNITY');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('EMBED', 'AGENCY', 'PRESS', 'CARD', 'AI', 'STOCK', 'OWN');

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('VISIBLE', 'PENDING', 'HIDDEN');

-- CreateEnum
CREATE TYPE "SocialMode" AS ENUM ('API', 'PACK');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('QUEUED', 'POSTED', 'FAILED');

-- CreateEnum
CREATE TYPE "CostKind" AS ENUM ('LLM', 'IMAGE', 'TTS', 'API');

-- CreateTable
CREATE TABLE "Signal" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "lang" TEXT NOT NULL DEFAULT 'ko',
    "metrics" JSONB NOT NULL,
    "qualityScore" DOUBLE PRECISION,
    "qualityNote" TEXT,
    "checkedAt" TIMESTAMP(3),
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "topicId" TEXT,

    CONSTRAINT "Signal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskTier" "RiskTier" NOT NULL DEFAULT 'YELLOW',
    "status" "TopicStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "topicId" TEXT,
    "category" "Category" NOT NULL,
    "format" "ArticleFormat" NOT NULL,
    "riskTier" "RiskTier" NOT NULL,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "facts" JSONB,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Translation" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "faq" JSONB,
    "seoTitle" TEXT,
    "seoDesc" TEXT,
    "indexable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceRef" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "kind" "SourceKind" NOT NULL,

    CONSTRAINT "SourceRef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "credit" TEXT,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "idHash" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "CommentStatus" NOT NULL DEFAULT 'VISIBLE',
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "script" TEXT NOT NULL,
    "ttsUrl" TEXT,
    "videoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "articleId" TEXT,
    "videoId" TEXT,
    "platform" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "mode" "SocialMode" NOT NULL,
    "status" "PostStatus" NOT NULL DEFAULT 'QUEUED',
    "externalId" TEXT,
    "error" TEXT,
    "metrics" JSONB,
    "scheduledAt" TIMESTAMP(3),
    "postedAt" TIMESTAMP(3),

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostLog" (
    "id" TEXT NOT NULL,
    "kind" "CostKind" NOT NULL,
    "amountUsd" DECIMAL(10,4) NOT NULL,
    "ref" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Signal_lastSeenAt_idx" ON "Signal"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "Signal_source_externalId_key" ON "Signal"("source", "externalId");

-- CreateIndex
CREATE INDEX "Article_status_publishedAt_idx" ON "Article"("status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Translation_articleId_locale_key" ON "Translation"("articleId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Translation_locale_slug_key" ON "Translation"("locale", "slug");

-- CreateIndex
CREATE INDEX "Comment_articleId_createdAt_idx" ON "Comment"("articleId", "createdAt");

-- AddForeignKey
ALTER TABLE "Signal" ADD CONSTRAINT "Signal_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Translation" ADD CONSTRAINT "Translation_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceRef" ADD CONSTRAINT "SourceRef_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;
