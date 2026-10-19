import { NextResponse } from "next/server";

// 쓰기 API(투표·반응·응원·댓글·신고·조회 수) 공통 문지기. DB 에 닿기 전에 거른다:
// 다른 사이트가 방문자 브라우저를 시켜 보내는 요청(CSRF)과, 모양이 틀린 id(널 문자 %00 → Postgres 500)

const NO_STORE = { "cache-control": "no-store" };

// DB 레코드 id: cuid(글·댓글·투표, 25자)와 위키데이터 Q-id(인물). 점·슬래시·널 문자 같은 건 DB 로 보내지 않는다
const RECORD_ID = /^[A-Za-z0-9_-]{1,40}$/;

export function isRecordId(value: unknown): value is string {
  return typeof value === "string" && RECORD_ID.test(value);
}

// 다른 출처에서 온 브라우저 요청인가. 브라우저가 붙이는 Sec-Fetch-Site 가 있으면 same-origin 만 통과시키고,
// 없으면(옛 브라우저) Origin 호스트를 요청 Host 와 비교한다 — SITE_URL 이 아니라 Host 와 견줘서 미리보기·로컬 주소도 통과한다.
// 둘 다 없으면(curl 같은 비브라우저) 통과: 이런 요청은 Origin 을 마음대로 넣을 수 있어 여기서는 못 막는다 (봇 거르기·횟수 제한이 맡는다)
export function isCrossSite(headers: Headers): boolean {
  const site = headers.get("sec-fetch-site");
  if (site) return site !== "same-origin";
  const origin = headers.get("origin");
  if (!origin) return false;
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  try {
    return new URL(origin).host !== host;
  } catch {
    return true; // Origin: null (샌드박스 iframe·파일에서 보낸 요청)
  }
}

// JSON 본문을 읽는 API 는 application/json 만 받는다. text/plain·폼은 브라우저가 사전 요청 없이 다른 사이트에서도 보낼 수 있다
function isJsonRequest(headers: Headers): boolean {
  return (headers.get("content-type") ?? "").toLowerCase().startsWith("application/json");
}

// 쓰기 핸들러 첫 줄에서 부른다. 다른 출처면 403, JSON 을 읽는 API(json)인데 JSON 이 아니면 415, 통과면 null.
// 본문 없이 보내는 조회 수(sendBeacon)·신고는 json 을 끈다
export function rejectWrite(request: Request, { json }: { json: boolean }): NextResponse | null {
  if (isCrossSite(request.headers)) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: NO_STORE });
  if (json && !isJsonRequest(request.headers)) {
    return NextResponse.json({ error: "invalid" }, { status: 415, headers: NO_STORE });
  }
  return null;
}
