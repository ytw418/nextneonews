import { createHmac } from "node:crypto";

import { isLocale } from "@kmedia/core";
import { prisma } from "@kmedia/db";
import { z } from "zod";

import { clientIp, secret } from "./comments";
import { deviceOs } from "./install";
import { isDbUnavailable } from "./item-votes";
import { CONSENT_VERSION, normalizeEmail, SUBSCRIBE_SOURCES } from "./subscribe-rules";
import { country, isBot } from "./voter";

// 이메일 한 칸 저장. 보내지는 않는다 (확인 메일·주간 소식은 발송 서비스를 붙인 뒤, docs/decisions/app-2026-10-21.md).
// 이미 있는 주소면 아무것도 바꾸지 않는다 — 주소 주인 확인이 없어서, 남이 다시 내면 수신 거부·선택·첫 동의 기록이 덮인다.
// 선택 변경·수신 거부 해제는 확인 메일 링크로만 한다. 이미 있는 주소인지는 응답으로 알리지 않는다 (늘 같은 200)

const DAY_MS = 86_400_000;
const RATE_MAX = 5; // 같은 인터넷 연결에서 하루(KST)에 낼 수 있는 주소 수

// 도배 제한용 IP 해시. 댓글·투표·평가의 ipHash(lib/comments.ts)와 다른 키에 날짜까지 섞어
// 이메일을 시술·피부 타입 평가나 댓글과 이을 수 없게 한다 (처리방침 '연결하지 않아요', 시술 원칙). 하루 제한에는 그날 값만 있으면 된다
function subscribeHash(ip: string, now: Date): string {
  const day = new Date(now.getTime() + 9 * 3_600_000).toISOString().slice(0, 10);
  return createHmac("sha256", secret()).update(`sub:${day}:${ip}`).digest("hex").slice(0, 16);
}

export const SubscribeInput = z.object({
  email: z.string().max(320),
  locale: z.string().refine(isLocale),
  source: z.enum(SUBSCRIBE_SOURCES),
  news: z.boolean(),
  platform: z.enum(["web", "pwa", "app"]),
  website: z.string().max(200).optional(), // 사람 눈에 안 보이는 칸. 채워 오면 로봇이라 저장하지 않는다
});
export type SubscribeInput = z.infer<typeof SubscribeInput>;

export type SubscribeOutcome =
  | { status: 200; ok: true }
  | { status: 400 | 403 | 429 | 503; error: "invalid" | "bot" | "tooFast" | "unavailable" };

export async function subscribe(input: SubscribeInput, headers: Headers): Promise<SubscribeOutcome> {
  const email = normalizeEmail(input.email);
  if (!email) return { status: 400, error: "invalid" };
  const ua = headers.get("user-agent");
  if (isBot(ua)) return { status: 403, error: "bot" };
  if (input.website) return { status: 200, ok: true }; // 로봇에게는 된 것처럼

  const now = new Date();
  const hash = subscribeHash(clientIp(headers), now);
  try {
    const recent = await prisma.subscriber.count({ where: { ipHash: hash, createdAt: { gte: new Date(now.getTime() - DAY_MS) } } });
    if (recent >= RATE_MAX) return { status: 429, error: "tooFast" };
    const values = {
      locale: input.locale,
      source: input.source,
      wantsApp: true,
      wantsNews: input.news,
      platform: input.platform,
      os: deviceOs(ua ?? ""),
      country: country(headers),
      consentAt: now,
      consentVersion: CONSENT_VERSION,
      ipHash: hash,
    };
    await prisma.subscriber.upsert({ where: { email }, create: { email, ...values }, update: {} });
    return { status: 200, ok: true };
  } catch (err) {
    if (isDbUnavailable(err)) return { status: 503, error: "unavailable" };
    throw err;
  }
}
