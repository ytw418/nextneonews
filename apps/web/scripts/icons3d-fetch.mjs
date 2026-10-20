#!/usr/bin/env node
// src/data/icons3d.ts 의 ICON3D 표에 있는데 public/icons3d/<키>.png 원본이 없는 아이콘을 Fluent Emoji 3D(MIT) 레포에서 받고,
// 끝나면 icons3d-webp.mjs 로 WebP 를 다시 만든다. 사람·손 이모지는 피부톤 기본(Default) 폴더에 있다.
// 사용: node apps/web/scripts/icons3d-fetch.mjs  (Node 22.18+, 표는 타입 지우기로 바로 읽는다)
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dir = join(root, "public", "icons3d");
const { ICON3D } = await import(pathToFileURL(join(root, "src", "data", "icons3d.ts")).href);

const BASE = "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets";

// 폴더 'Hot beverage' → assets/Hot%20beverage/3D/hot_beverage_3d.png (또는 Default/3D/hot_beverage_3d_default.png)
function candidates(folder) {
  const name = folder.toLowerCase().replace(/ /g, "_");
  const path = encodeURIComponent(folder);
  return [`${BASE}/${path}/3D/${name}_3d.png`, `${BASE}/${path}/Default/3D/${name}_3d_default.png`];
}

let fetched = 0;
for (const [key, folder] of Object.entries(ICON3D)) {
  const file = join(dir, `${key}.png`);
  if (existsSync(file)) continue;
  let ok = false;
  for (const url of candidates(folder)) {
    const res = await fetch(url);
    if (!res.ok) continue;
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    ok = true;
    break;
  }
  if (!ok) {
    console.error(`icons3d: '${folder}' 를 Fluent 레포에서 찾지 못했다 (${key})`);
    process.exitCode = 1;
    continue;
  }
  fetched += 1;
}
console.log(`icons3d: 새로 받은 원본 ${fetched}개`);
await import("./icons3d-webp.mjs");
