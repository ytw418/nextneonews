// 앱 아이콘·스플래시·안드로이드 아이콘을 그린다: 사이트 로고(헤더 'Unnie.')와 같은 Instrument Serif 이탤릭 'U' + 핑크 점.
// 웹 api/pwa-icon 처럼 next/og(satori)로 그린다 — 루트 node_modules 의 next 를 쓰니 루트에서 npm ci 뒤에 돌린다:
//   node mobile/scripts/make-icons.mjs
// 글꼴은 Google Fonts 저장소의 OFL 원본을 받아 그릴 때만 쓴다 (저장소에 넣지 않는다)
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, "../../apps/web/package.json"));
const { ImageResponse } = require("next/og");
const { createElement: h } = require("react");

const FONT_URL = "https://raw.githubusercontent.com/google/fonts/main/ofl/instrumentserif/InstrumentSerif-Italic.ttf";
const INK = "#1b1520";
const DOT = "#ff2488";

const res = await fetch(FONT_URL);
if (!res.ok) throw new Error(`글꼴을 받지 못했다: ${res.status}`);
const font = await res.arrayBuffer();

// ratio: 글자 크기 / 그림 한 변. 아이폰 아이콘은 꽉 차게, 스플래시·안드로이드 전경은 잘리지 않게 작게
async function draw(file, size, ratio, background) {
  const image = new ImageResponse(
    h(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background,
          fontFamily: "Instrument Serif",
          fontStyle: "italic",
          fontSize: Math.round(size * ratio),
          color: INK,
          // 이탤릭 'U' 의 시각 중심이 오른쪽으로 쏠려 보여 살짝 왼쪽·아래로 (글자 상자 기준 중앙은 위로 떠 보인다)
          paddingRight: Math.round(size * 0.02),
          paddingTop: Math.round(size * 0.06),
        },
      },
      "U",
      h("span", { style: { color: DOT } }, "."),
    ),
    { width: size, height: size, fonts: [{ name: "Instrument Serif", data: font, style: "italic", weight: 400 }] },
  );
  const out = join(here, "../assets", file);
  writeFileSync(out, Buffer.from(await image.arrayBuffer()));
  console.log("wrote", out);
}

await draw("icon.png", 1024, 0.78, "#ffffff");
await draw("splash-icon.png", 512, 0.62, "transparent");
await draw("android-icon-foreground.png", 1024, 0.5, "transparent");
await draw("favicon.png", 48, 0.78, "#ffffff");
