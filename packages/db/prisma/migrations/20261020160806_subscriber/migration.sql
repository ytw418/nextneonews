-- CreateTable
CREATE TABLE "Subscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "wantsApp" BOOLEAN NOT NULL DEFAULT true,
    "wantsNews" BOOLEAN NOT NULL DEFAULT false,
    "platform" TEXT NOT NULL,
    "os" TEXT NOT NULL,
    "country" TEXT,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "unsubAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_email_key" ON "Subscriber"("email");

-- CreateIndex
CREATE INDEX "Subscriber_ipHash_updatedAt_idx" ON "Subscriber"("ipHash", "updatedAt");

-- 이메일 주소가 든 표: Supabase Data API(anon·authenticated 역할)로는 읽고 쓸 수 없게 한다.
-- 정책이 없으니 그 역할들은 행을 못 본다. 웹·워커는 표 주인(postgres)으로 붙어 RLS 를 거치지 않는다
ALTER TABLE "Subscriber" ENABLE ROW LEVEL SECURITY;
