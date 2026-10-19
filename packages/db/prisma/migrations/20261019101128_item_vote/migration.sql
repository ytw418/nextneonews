-- CreateTable
CREATE TABLE "ItemVote" (
    "kind" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "choice" TEXT NOT NULL,
    "facet" TEXT,
    "voterHash" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemVote_pkey" PRIMARY KEY ("kind","itemId","voterHash")
);

-- CreateIndex
CREATE INDEX "ItemVote_kind_itemId_choice_idx" ON "ItemVote"("kind", "itemId", "choice");

-- CreateIndex
CREATE INDEX "ItemVote_ipHash_createdAt_idx" ON "ItemVote"("ipHash", "createdAt");
