// robots.txt 를 지킨다 (docs/PRD.md 5장). 호스트마다 한 번 받아 실행하는 동안 기억한다.
// 규칙은 "User-agent: *" 묶음만 본다. 가장 긴 경로 규칙이 이기고, 길이가 같으면 Allow 가 이긴다.

interface Rule {
  allow: boolean;
  pattern: RegExp;
  length: number;
}

// Content-Signal 줄 (예: "search=yes,ai-train=no,use=reference" → { search: "yes", "ai-train": "no", use: "reference" })
export type ContentSignals = Record<string, string>;

interface Robots {
  rules: Rule[];
  signals: ContentSignals;
}

const DENY_ALL: Robots = { rules: [{ allow: false, pattern: /^/, length: 0 }], signals: {} };
const ALLOW_ALL: Robots = { rules: [], signals: {} };

const cache = new Map<string, Promise<Robots>>();

function toRegExp(path: string): RegExp {
  const escaped = path.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped.endsWith("\\$") ? `${escaped.slice(0, -2)}$` : escaped}`);
}

// "User-agent: *" 묶음 안의 [키, 값] 줄
function* starGroupLines(text: string): Generator<[string, string]> {
  let agents: string[] = [];
  let collecting = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const match = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!match) continue;
    const key = match[1]!.toLowerCase();
    const value = match[2]!.trim();
    if (key === "user-agent") {
      if (collecting) agents = [];
      collecting = false;
      agents.push(value);
      continue;
    }
    collecting = true;
    if (agents.includes("*")) yield [key, value];
  }
}

export function parseRobots(text: string): Rule[] {
  const rules: Rule[] = [];
  for (const [key, value] of starGroupLines(text)) {
    if ((key === "allow" || key === "disallow") && value) {
      rules.push({ allow: key === "allow", pattern: toRegExp(value), length: value.length });
    }
  }
  return rules;
}

export function isAllowed(rules: Rule[], pathWithQuery: string): boolean {
  let best: Rule | undefined;
  for (const rule of rules) {
    if (!rule.pattern.test(pathWithQuery)) continue;
    if (!best || rule.length > best.length || (rule.length === best.length && rule.allow)) best = rule;
  }
  return best?.allow ?? true;
}

// Content-Signal 줄. 여러 줄이면 합친다
export function parseContentSignals(text: string): ContentSignals {
  const signals: ContentSignals = {};
  for (const [key, value] of starGroupLines(text)) {
    if (key !== "content-signal") continue;
    for (const pair of value.split(",")) {
      const [name, setting] = pair.split("=").map((part) => part.trim().toLowerCase());
      if (name && setting) signals[name] = setting;
    }
  }
  return signals;
}

// 없으면(404·410) 전부 허용. 401·403·Cloudflare 확인 화면(cf-mitigated)·그 밖의 오류·접속 실패는 전부 금지로 본다
// (인스티즈처럼 robots.txt 까지 확인 화면을 띄우는 곳이 허용으로 새지 않게)
export async function robotsFromResponse(res: Response): Promise<Robots> {
  if (res.headers.has("cf-mitigated")) return DENY_ALL;
  if (res.status === 404 || res.status === 410) return ALLOW_ALL;
  if (!res.ok) return DENY_ALL;
  const text = await res.text();
  return { rules: parseRobots(text), signals: parseContentSignals(text) };
}

function robotsFor(origin: string, userAgent: string): Promise<Robots> {
  let robots = cache.get(origin);
  if (!robots) {
    robots = fetch(`${origin}/robots.txt`, {
      headers: { "user-agent": userAgent },
      signal: AbortSignal.timeout(10_000),
    })
      .then(robotsFromResponse)
      .catch(() => DENY_ALL);
    cache.set(origin, robots);
  }
  return robots;
}

export class RobotsDisallowedError extends Error {}

export async function assertRobotsAllowed(url: string, userAgent: string): Promise<void> {
  const { origin, pathname, search } = new URL(url);
  const { rules } = await robotsFor(origin, userAgent);
  if (!isAllowed(rules, `${pathname}${search}`)) {
    throw new RobotsDisallowedError(`robots.txt disallows ${url}`);
  }
}

// 사이트가 robots.txt 에 밝힌 콘텐츠 사용 조건. ai-input=no 면 원문을 AI 에 넘기지 않는다 (pipeline/sources.ts)
export async function contentSignals(origin: string, userAgent: string): Promise<ContentSignals> {
  return (await robotsFor(origin, userAgent)).signals;
}
