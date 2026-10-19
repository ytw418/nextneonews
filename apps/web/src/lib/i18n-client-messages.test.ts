import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { CLIENT_MESSAGES } from "../i18n/client-messages";

// 레이아웃은 클라이언트로 고른 메시지만 넘긴다(i18n/client-messages.ts). 'use client' 컴포넌트가 목록에 없는
// 네임스페이스·키를 쓰면 화면에 'Ns.key' 가 그대로 찍힌다 — 다른 작업이 클라이언트 컴포넌트를 더해도 여기서 잡는다.
// (vitest 는 lib 아래 테스트만 돈다: 루트 vitest.config.ts)
const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXTENSIONS = [".tsx", ".ts", "/index.tsx", "/index.ts"];

function resolveImport(from: string, spec: string): string | null {
  const base = spec.startsWith("@/")
    ? path.join(SRC, spec.slice(2))
    : spec.startsWith(".")
      ? path.resolve(path.dirname(from), spec)
      : null;
  if (!base) return null;
  if (existsSync(base) && statSync(base).isFile()) return base;
  return EXTENSIONS.map((ext) => base + ext).find((file) => existsSync(file)) ?? null;
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true })
    .map(String)
    .filter((f) => /\.tsx?$/.test(f) && !f.endsWith(".test.ts"))
    .map((f) => path.join(dir, f));
}

// 'use client' 파일과 그것이 (정적·동적으로) 불러오는 모듈 전부
function clientGraph(): Set<string> {
  const stack = sourceFiles(SRC).filter((f) => /^["']use client["']/.test(readFileSync(f, "utf8")));
  const seen = new Set<string>();
  while (stack.length > 0) {
    const file = stack.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const code = readFileSync(file, "utf8");
    for (const m of code.matchAll(/(?:import|export)\s+(?!type\b)[^'"]*?from\s+["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g)) {
      const next = resolveImport(file, m[1] ?? m[2]);
      if (next) stack.push(next);
    }
  }
  return seen;
}

// 'Ns' 또는 'Ns.key' 가 클라이언트 메시지에 들어 있는지
function allowed(ns: string, key?: string): boolean {
  const keys = CLIENT_MESSAGES[ns];
  if (!keys) return false;
  return keys === true || key === undefined || keys.includes(key);
}

describe("클라이언트 메시지 고르기", () => {
  it("클라이언트 컴포넌트가 쓰는 네임스페이스·최상위 키가 모두 들어 있다", () => {
    const missing: string[] = [];
    for (const file of clientGraph()) {
      const code = readFileSync(file, "utf8");
      const where = path.relative(SRC, file);
      // const t = useTranslations("Ns.sub") 또는 { Ns: useTranslations("Ns") }
      for (const m of code.matchAll(/(\w+)\s*[=:]\s*useTranslations\(\s*["']([^"']+)["']\s*\)/g)) {
        const [, name, scope] = m;
        const [ns, sub] = scope.split(".");
        if (sub !== undefined) {
          if (!allowed(ns, sub)) missing.push(`${where}: ${scope}`);
          continue;
        }
        if (!allowed(ns)) {
          missing.push(`${where}: ${ns}`);
          continue;
        }
        // t("key.sub"), t.rich(`key.${x}`) 의 첫 마디
        const call = new RegExp(String.raw`\b${name}(?:\.(?:rich|markup|raw|has))?\(\s*["'\x60]([A-Za-z0-9_]+)`, "g");
        for (const c of code.matchAll(call)) {
          if (!allowed(ns, c[1])) missing.push(`${where}: ${ns}.${c[1]}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});
