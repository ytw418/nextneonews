-- AlterTable
ALTER TABLE "Comment" ADD COLUMN "likeCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CommentLike" (
    "commentId" TEXT NOT NULL,
    "voterHash" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentLike_pkey" PRIMARY KEY ("commentId","voterHash")
);

-- CreateIndex
CREATE INDEX "CommentLike_ipHash_createdAt_idx" ON "CommentLike"("ipHash", "createdAt");

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Supabase Data API(anon·authenticated)로는 못 건드리게 한다. 웹·워커는 표 주인으로 붙는다
ALTER TABLE "CommentLike" ENABLE ROW LEVEL SECURITY;
