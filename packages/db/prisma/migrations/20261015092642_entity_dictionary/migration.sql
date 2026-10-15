-- CreateTable
CREATE TABLE "Entity" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ko" TEXT,
    "en" TEXT,
    "ja" TEXT,
    "zhHant" TEXT,
    "sitelinks" INTEGER NOT NULL,
    "image" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Entity_ko_idx" ON "Entity"("ko");

-- CreateIndex
CREATE INDEX "Entity_en_idx" ON "Entity"("en");
