import { isLocale, kstDay } from "@kmedia/core";
import { prisma } from "@kmedia/db";
import { NextResponse } from "next/server";

import { isRecordId, rejectWrite } from "@/lib/api-guard";
import { clientIp, ipHash } from "@/lib/comments";
import { cheerStanding } from "@/lib/rankings";
import { country, isBot, rateLimited, voterHash } from "@/lib/voter";

const NO_STORE = { "cache-control": "no-store" };
// 같은 사람(IP 해시)은 한 시간에 20번까지 (인물마다 하루 한 번은 voterHash 로 따로 막는다)
const RATE_MAX = 20;
const RATE_WINDOW_MS = 60 * 60_000;

// 로그인 없는 응원. 하루(KST)에 같은 기기가 같은 인물을 두 번 응원하면 409.
// 응원 수는 랭킹 점수에 섞지 않는다 — 화면에 '오늘 팬 응원'으로 따로 보인다
export async function POST(request: Request, { params }: RouteContext<"/api/cheer/[entityId]">) {
  const blocked = rejectWrite(request, { json: true });
  if (blocked) return blocked;
  const { entityId } = await params;
  const ua = request.headers.get("user-agent");
  if (isBot(ua)) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: NO_STORE });
  if (!isRecordId(entityId)) return NextResponse.json({ error: "notFound" }, { status: 404, headers: NO_STORE });

  const entity = await prisma.entity.findUnique({ where: { id: entityId }, select: { id: true } });
  if (!entity) return NextResponse.json({ error: "notFound" }, { status: 404, headers: NO_STORE });

  const input = (await request.json().catch(() => null)) as { locale?: unknown } | null;
  const locale = typeof input?.locale === "string" && isLocale(input.locale) ? input.locale : "en";
  const ip = clientIp(request.headers);
  const hash = ipHash(ip);
  if (await rateLimited("cheer", hash, RATE_MAX, RATE_WINDOW_MS)) {
    return NextResponse.json({ error: "tooFast" }, { status: 429, headers: NO_STORE });
  }

  const day = kstDay();
  // 기본키(entityId, day, voterHash)가 겹치면 넣지 않고 0 을 돌려준다 → 오늘 이미 응원함
  const { count } = await prisma.cheerVote.createMany({
    data: [
      {
        entityId,
        day,
        voterHash: voterHash(`cheer:${day}`, ip, ua ?? ""),
        ipHash: hash,
        locale,
        country: country(request.headers),
      },
    ],
    skipDuplicates: true,
  });
  const standing = await cheerStanding(entityId, day);
  return NextResponse.json(count === 0 ? { error: "already", ...standing } : standing, {
    status: count === 0 ? 409 : 200,
    headers: NO_STORE,
  });
}
