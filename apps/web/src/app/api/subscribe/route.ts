import { NextResponse } from "next/server";

import { rejectWrite } from "@/lib/api-guard";
import { subscribe, SubscribeInput } from "@/lib/subscribe";

const NO_STORE = { "cache-control": "no-store" };

// 이메일 한 칸 { email, locale, source, news, platform } → { ok } (저장만 하고 보내지 않는다, lib/subscribe.ts)
export async function POST(request: Request) {
  const blocked = rejectWrite(request, { json: true });
  if (blocked) return blocked;
  const parsed = SubscribeInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400, headers: NO_STORE });
  const { status, ...body } = await subscribe(parsed.data, request.headers);
  return NextResponse.json(body, { status, headers: NO_STORE });
}
