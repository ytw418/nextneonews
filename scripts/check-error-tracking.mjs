// 운영 에러 추적이 살아 있는지 끝까지 확인한다: 운영 페이지에서 하이드레이션 에러(React #418)를 하나 일으키고,
// PostHog 에 도착해 스택이 원래 파일로 풀렸는지(소스맵 업로드) 본다. 배포·설정을 바꾼 뒤 한 번 돌린다.
//   node scripts/check-error-tracking.mjs [주소]      기본 https://unnienote.app/en
// PostHog 키는 키체인 unnienote-posthog(아침 브리핑과 같은 키). 자세한 구조: docs/predeploy/verify-error-tracking.md
import { execFileSync } from "node:child_process";

import { chromium, devices } from "playwright";

const URL_ = process.argv[2] ?? "https://unnienote.app/en";
const API = "https://us.posthog.com/api/projects/670566";
const KEY = execFileSync("security", ["find-generic-password", "-s", "unnienote-posthog", "-w"], { encoding: "utf8" }).trim();
const MARK = "[error-tracking-check]";

async function ph(path, body, method = "POST") {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PostHog ${path} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

// 1. 에러 일으키기. PostHog 가 헤드리스를 봇으로 버리지 않게 webdriver·userAgentData 를 덮는다
const started = new Date(Date.now() - 5000).toISOString();
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 15"], locale: "en-US" });
await ctx.addInitScript((mark) => {
  Object.defineProperty(navigator, "webdriver", { get: () => false });
  Object.defineProperty(navigator, "userAgentData", { get: () => undefined });
  document.addEventListener("DOMContentLoaded", () => {
    const h = document.querySelector("h1, h2");
    if (h) h.textContent += ` ${mark}`; // 서버 HTML 과 달라져 React 가 #418 을 낸다
  });
}, MARK);
const page = await ctx.newPage();
let sent = 0;
page.on("response", (r) => {
  if (r.url().includes("/relay/e/") && r.ok()) sent++;
});
await page.goto(URL_, { waitUntil: "load" });
await page.waitForTimeout(9000);
await browser.close();
console.log(`1. ${URL_} 에서 에러 발생, PostHog 전송 ${sent}건`);
if (!sent) process.exit(1);

// 2. 도착·소스맵 확인 (수집까지 1~2분)
const sql = `SELECT properties.$exception_issue_id,
  JSONExtractBool(toString(properties.$exception_list), 1, 'stacktrace', 'frames', -1, 'resolved'),
  JSONExtractString(toString(properties.$exception_list), 1, 'stacktrace', 'frames', -1, 'source'),
  JSONExtractString(toString(properties.$exception_list), 1, 'stacktrace', 'frames', -1, 'resolve_failure')
  FROM events WHERE event = '$exception' AND timestamp > toDateTime('${started.slice(0, 19).replace("T", " ")}')
  AND properties.$current_url LIKE '${new URL(URL_).origin}%' ORDER BY timestamp DESC LIMIT 1`;
let row;
for (let i = 0; i < 12 && !row; i++) {
  await new Promise((r) => setTimeout(r, 15000));
  row = (await ph("/query/", { query: { kind: "HogQLQuery", query: sql }, refresh: "force_blocking" })).results?.[0];
}
if (!row) {
  console.log("2. 3분 안에 PostHog 에 안 들어옴 — 브라우저 리스너·relay 를 볼 것");
  process.exit(1);
}
const [issue, resolved, source, failure] = row;
console.log(`2. 도착함. 스택 ${resolved ? `풀림 (${source})` : `안 풀림: ${failure || source}`}`);

// 3. 확인용 이슈 정리. 키체인 키는 읽기 전용이라(error_tracking:write 없음) 안 되면 주소만 알린다
try {
  await ph(`/error_tracking/issues/${issue}/`, { status: "resolved" }, "PATCH");
  console.log(`3. 확인용 이슈 ${issue} 해결 처리`);
} catch {
  console.log(`3. 확인용 이슈는 직접 해결 처리: https://us.posthog.com/project/670566/error_tracking/${issue}`);
}
process.exit(resolved ? 0 : 1);
