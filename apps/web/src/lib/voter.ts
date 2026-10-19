import { createHmac } from "node:crypto";

import { prisma } from "@kmedia/db";

import { secret } from "./comments";

// 로그인 없는 투표·반응·응원·항목 평가 (PollVote·ReactionVote·CheerVote·ItemVote) 공통 도우미.
// IP 는 저장하지 않는다. 한 기기 한 표는 voterHash, 도배 제한은 comments.ts 의 ipHash 로 본다

// 같은 기기(IP + 브라우저)가 같은 대상(scope)에 내는 표를 하나로 묶는 해시. scope 예: 'poll:{id}', 'cheer:{KST 날짜}'
export function voterHash(scope: string, ip: string, ua: string): string {
  return createHmac("sha256", secret()).update(`v:${scope}:${ip}:${ua}`).digest("hex").slice(0, 24);
}

// Vercel 이 넣어 주는 접속 국가 (언어별 결과 비교용). 로컬에서는 null
export function country(headers: Headers): string | null {
  return headers.get("x-vercel-ip-country");
}

const BOT_UA = /bot|crawler|spider|curl|python/i;

// 검색 로봇·스크립트의 요청은 표로 세지 않는다 (UA 가 비어 있으면 브라우저가 아니다)
export function isBot(ua: string | null | undefined): boolean {
  return !ua || BOT_UA.test(ua);
}

export type VoteTable = "poll" | "reaction" | "cheer" | "item";

// 같은 사람(IP 해시)이 windowMs 안에 max 번 넘게 눌렀는지
export async function rateLimited(table: VoteTable, ipHash: string, max: number, windowMs: number): Promise<boolean> {
  const since = new Date(Date.now() - windowMs);
  const where = { ipHash, createdAt: { gte: since } };
  const count =
    table === "poll"
      ? await prisma.pollVote.count({ where })
      : table === "reaction"
        ? await prisma.reactionVote.count({ where })
        : table === "cheer"
          ? await prisma.cheerVote.count({ where })
          : // 항목 평가는 바꾸면 행을 덮어써서(createdAt 그대로) 새로 낸 표와 바꾼 표를 함께 updatedAt 으로 센다
            await prisma.itemVote.count({ where: { ipHash, updatedAt: { gte: since } } });
  return count >= max;
}
