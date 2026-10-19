import { setTimeout as sleep } from "node:timers/promises";

import { log } from "../log";
import { assertAllowedHost } from "./policy";
import { assertRobotsAllowed } from "./robots";

// 정직한 봇 이름으로 요청한다. 브라우저처럼 보이는 위장 UA 는 쓰지 않는다 (docs/PRD.md 12장).
// 수집 정책·차단 요청 연락처는 /en/about#bot. 로컬(SITE_URL=localhost)에서 돌려도 공개 주소를 알린다
const BOT_SITE = process.env.SITE_URL?.startsWith("https://")
  ? process.env.SITE_URL.replace(/\/$/, "")
  : "https://hallyu-brief.vercel.app";
export const USER_AGENT = `UnnieNoteBot/1.0 (+${BOT_SITE}/en/about#bot)`;

// 막혔다는 뜻의 응답. 20초 뒤 한 번 더 보내고, 그래도 막히면 서울 릴레이로 간다
const BLOCKED_STATUSES = new Set([403, 429, 503]);
const RETRY_DELAY_MS = 20_000;
// 접속 국가로 막는 곳(더쿠는 해외 데이터센터 IP 에 403)만 릴레이를 탄다. 릴레이도 허용 목록 밖은 거절한다 (infra/collector-relay).
// 유료 주거용 프록시나 IP 를 바꿔 가며 접속하는 방식은 쓰지 않는다
const RELAY_HOSTS = ["theqoo.net"];

// 직접·재시도·릴레이가 모두 막혔다. 수집기는 실패가 아닌 '건너뜀'으로 기록한다
export class BlockedError extends Error {}

export interface FetchOptions {
  method?: "GET" | "POST";
  body?: URLSearchParams;
  accept?: string;
}

// 이번 실행에서 직접 요청이 두 번 막힌 릴레이 호스트. 다음 요청부터는 20초 기다리지 않고 바로 릴레이로 간다
const directBlocked = new Set<string>();

function direct(url: string, { method = "GET", body, accept }: FetchOptions): Promise<Response> {
  const headers: Record<string, string> = { "user-agent": USER_AGENT, "accept-language": "ko-KR,ko;q=0.9" };
  if (accept) headers.accept = accept;
  // 폼 POST 는 사이트 안의 AJAX 호출이다. 같은 사이트 referer 가 없으면 더쿠는 '보안정책상 허용되지 않습니다'를 돌려준다
  if (body) {
    headers["x-requested-with"] = "XMLHttpRequest";
    headers.referer = `${new URL(url).origin}/`;
  }
  return fetch(url, { method, headers, body, signal: AbortSignal.timeout(15_000) });
}

interface RelayResult {
  status: number;
  contentType?: string;
  body: string;
  region?: string;
}

// 서울(icn1) Vercel 함수가 같은 봇 UA 로 대신 요청한다. robots·약관 확인은 이미 이 프로세스에서 마쳤다
async function viaRelay(url: string, { method = "GET", body }: FetchOptions): Promise<string> {
  const base = process.env.COLLECTOR_RELAY_URL;
  if (!base) throw new BlockedError(`${method} ${url} blocked (no COLLECTOR_RELAY_URL)`);
  let data: RelayResult;
  try {
    const res = await fetch(new URL("/api/fetch", base), {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.COLLECTOR_TOKEN ?? ""}`, "content-type": "application/json" },
      body: JSON.stringify({ method, url, body: body?.toString() }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`relay -> ${res.status}`);
    data = (await res.json()) as RelayResult;
  } catch (error) {
    throw new BlockedError(`${method} ${url} blocked (${String(error)})`);
  }
  log.info("fetch: via relay", { url, status: data.status, region: data.region });
  if (BLOCKED_STATUSES.has(data.status)) throw new BlockedError(`${method} ${url} -> ${data.status} (relay ${data.region})`);
  if (data.status < 200 || data.status >= 300) throw new Error(`${method} ${url} -> ${data.status} (relay ${data.region})`);
  return data.body;
}

// 모든 수집 요청의 입구: 약관 금지 호스트 → robots.txt → 직접 → (막히면) 20초 뒤 재시도 → 서울 릴레이
export async function fetchText(url: string, options: FetchOptions = {}): Promise<string> {
  const method = options.method ?? "GET";
  assertAllowedHost(url);
  await assertRobotsAllowed(url, USER_AGENT);

  const host = new URL(url).hostname;
  const relayable = RELAY_HOSTS.includes(host);
  // THEQOO_FORCE_RELAY=1 이면 릴레이 경로만 시험한다
  if (relayable && (process.env.THEQOO_FORCE_RELAY === "1" || directBlocked.has(host))) return viaRelay(url, options);

  let res = await direct(url, options);
  if (BLOCKED_STATUSES.has(res.status)) {
    log.warn("fetch: blocked, retrying in 20s", { url, status: res.status });
    await sleep(RETRY_DELAY_MS);
    res = await direct(url, options);
  }
  if (BLOCKED_STATUSES.has(res.status)) {
    if (relayable) {
      directBlocked.add(host);
      return viaRelay(url, options);
    }
    throw new BlockedError(`${method} ${url} -> ${res.status}`);
  }
  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status}`);
  return res.text();
}

export function fetchHtml(url: string): Promise<string> {
  return fetchText(url);
}

export function parseCount(text: string | undefined): number | undefined {
  const digits = text?.replace(/[^0-9]/g, "");
  return digits ? Number(digits) : undefined;
}
