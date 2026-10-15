// robots.txt 를 지킨다 (docs/PRD.md 5장). 호스트마다 한 번 받아 실행하는 동안 기억한다.
// 규칙은 "User-agent: *" 묶음만 본다. 가장 긴 경로 규칙이 이기고, 길이가 같으면 Allow 가 이긴다.

interface Rule {
  allow: boolean;
  pattern: RegExp;
  length: number;
}

const cache = new Map<string, Promise<Rule[]>>();

function toRegExp(path: string): RegExp {
  const escaped = path.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped.endsWith("\\$") ? `${escaped.slice(0, -2)}$` : escaped}`);
}

export function parseRobots(text: string): Rule[] {
  const rules: Rule[] = [];
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
    if (!agents.includes("*")) continue;
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

async function rulesFor(origin: string, userAgent: string): Promise<Rule[]> {
  const res = await fetch(`${origin}/robots.txt`, {
    headers: { "user-agent": userAgent },
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  // 없으면(404) 허용. 서버 오류·차단이면 조심해서 막는다
  if (!res) return [{ allow: false, pattern: /^/, length: 0 }];
  if (res.status >= 400 && res.status < 500) return [];
  if (!res.ok) return [{ allow: false, pattern: /^/, length: 0 }];
  return parseRobots(await res.text());
}

export class RobotsDisallowedError extends Error {}

export async function assertRobotsAllowed(url: string, userAgent: string): Promise<void> {
  const { origin, pathname, search } = new URL(url);
  let rules = cache.get(origin);
  if (!rules) {
    rules = rulesFor(origin, userAgent);
    cache.set(origin, rules);
  }
  if (!isAllowed(await rules, `${pathname}${search}`)) {
    throw new RobotsDisallowedError(`robots.txt disallows ${url}`);
  }
}
