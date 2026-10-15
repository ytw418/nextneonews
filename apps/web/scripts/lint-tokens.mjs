#!/usr/bin/env node
// 디자인 토큰 지킴이: 임의 글자 크기·줄 간격, 금지 스타일, 옛 색 이름이 다시 들어오지 않게 한다.
// 기본은 경고만 하고 통과(exit 0). --strict 면 하나라도 걸리면 실패(exit 1).
// 의존성 없음 (Node 22+).
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const srcDir = join(root, "src");
const strict = process.argv.includes("--strict");

// 클래스 하나를 통째로 잡는다: 앞뒤가 공백·따옴표·괄호일 때만. 'Surprise'·'arise'·'not-italic' 은 걸리지 않는다
const B = String.raw`(?<=^|[\s'"\x60{(])`;
const E = String.raw`(?=$|[\s'"\x60})])`;

const RULES = [
  ["임의 글자 크기 (text-t1…st13 토큰을 쓴다)", String.raw`text-\[\d+(\.\d+)?(px|rem)\]`],
  ["임의 줄 간격 (토큰 기본값 또는 leading-row)", String.raw`leading-\[[^\]]*\]`],
  ["금지 스타일·지운 효과", String.raw`(font-(extrabold|black|label|display)|italic|holo|rise|animate-shine)`],
  ["옛 색 이름 (ink-900/700/600/400 를 쓴다)", String.raw`(text-fg|text-muted|bg-fg|text-cherry-deep|bg-cherry-deep|text-ink)`],
  ["잉크 투명도 (ink 단계를 쓴다)", String.raw`text-ink(-\d+)?/\d+`],
].map(([label, pattern]) => ({ label, re: new RegExp(B + pattern + E, "g") }));

// 폰트 로더 옵션('italic')이 있는 레이아웃과, next/og 로 로고 이미지를 그리는 파일(인라인 style)은 검사하지 않는다
const SKIP_FILES = new Set([join("src", "app", "[locale]", "layout.tsx")]);

const files = readdirSync(srcDir, { recursive: true })
  .map(String)
  .filter((f) => f.endsWith(".tsx"))
  .map((f) => join(srcDir, f))
  .filter((f) => !SKIP_FILES.has(relative(root, f)));

let count = 0;
for (const file of files) {
  const text = readFileSync(file, "utf8");
  if (/from\s+["']next\/og["']/.test(text)) continue;
  text.split("\n").forEach((line, i) => {
    for (const { label, re } of RULES) {
      for (const m of line.matchAll(re)) {
        count += 1;
        console.log(`${relative(root, file)}:${i + 1}  ${m[0]}  — ${label}`);
      }
    }
  });
}

if (count > 0) {
  console.log(`\nlint-tokens: ${count}건${strict ? "" : " (경고만, --strict 에서 실패)"}`);
  if (strict) process.exit(1);
} else {
  console.log("lint-tokens: 0건");
}
