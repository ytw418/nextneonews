import { timingSafeEqual } from "node:crypto";

// 서울(icn1) 수집 릴레이. 더쿠는 접속 국가로 막아서(해외 데이터센터 IP 403) GitHub Actions 에서 막히면 워커가 여기로 돌린다.
// 워커(apps/worker/src/collectors/http.ts)가 robots.txt·약관 확인을 마친 요청만 보낸다. 여기서는 허용 목록 밖을 거절한다.
// npm 워크스페이스 밖의 별도 Vercel 프로젝트다 (Hobby 는 프로젝트당 리전 하나). 의존성 없음. 배포 절차: docs/deploy.md

const SITE_URL = process.env.SITE_URL?.startsWith("https://")
  ? process.env.SITE_URL.replace(/\/$/, "")
  : "https://hallyu-brief.vercel.app";
// 워커와 같은 정직한 봇 UA
const USER_AGENT = `HallyuBriefBot/1.0 (+${SITE_URL}/en/about#bot)`;

const BOARD_LIST = /^https:\/\/theqoo\.net\/(hot|square|dyb|yn)(\?page=\d{1,3})?$/;
const COMMENT_ENDPOINT = "https://theqoo.net/index.php";
const COMMENT_KEYS = ["act", "cpage", "document_srl"];

// 허용: 게시판 목록 GET, 댓글 목록 POST(act=dispTheqooContentCommentListTheqoo) 만
function allowed(method, url, body) {
  if (method === "GET") return BOARD_LIST.test(url) && !body;
  if (method !== "POST" || url !== COMMENT_ENDPOINT || typeof body !== "string") return false;
  const params = new URLSearchParams(body);
  return (
    [...params.keys()].sort().join(",") === COMMENT_KEYS.join(",") &&
    params.get("act") === "dispTheqooContentCommentListTheqoo" &&
    /^\d+$/.test(params.get("document_srl") ?? "") &&
    /^\d{1,3}$/.test(params.get("cpage") ?? "")
  );
}

function authorized(request) {
  const token = process.env.COLLECTOR_TOKEN;
  if (!token) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${token}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

const noStore = { "cache-control": "no-store" };

export async function POST(request) {
  if (!authorized(request)) return Response.json({ error: "unauthorized" }, { status: 401, headers: noStore });

  let input;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "bad json" }, { status: 400, headers: noStore });
  }
  const { method, url, body } = input ?? {};
  if (!allowed(method, url, body)) return Response.json({ error: "not allowed" }, { status: 403, headers: noStore });

  const headers = { "user-agent": USER_AGENT, "accept-language": "ko-KR,ko;q=0.9" };
  // 댓글 목록은 사이트 안 AJAX 호출이라 같은 사이트 referer 가 있어야 한다
  if (method === "POST") {
    Object.assign(headers, { "x-requested-with": "XMLHttpRequest", referer: "https://theqoo.net/", accept: "application/json" });
  }

  try {
    const res = await fetch(url, { method, headers, body, signal: AbortSignal.timeout(12_000), cache: "no-store" });
    return Response.json(
      {
        status: res.status,
        contentType: res.headers.get("content-type"),
        body: await res.text(),
        region: process.env.VERCEL_REGION,
      },
      { headers: noStore },
    );
  } catch (error) {
    return Response.json({ error: String(error), region: process.env.VERCEL_REGION }, { status: 502, headers: noStore });
  }
}
