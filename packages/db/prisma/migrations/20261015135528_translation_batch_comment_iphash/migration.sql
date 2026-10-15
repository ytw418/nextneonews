-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "ipHash" TEXT;

-- CreateTable
CREATE TABLE "AiBatch" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collectedAt" TIMESTAMP(3),

    CONSTRAINT "AiBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiBatch_kind_status_idx" ON "AiBatch"("kind", "status");

-- CreateIndex
CREATE INDEX "Comment_ipHash_createdAt_idx" ON "Comment"("ipHash", "createdAt");
