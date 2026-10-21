// 스토어 그래픽: Play 대표 그래픽(1024×500)·Play 아이콘(512). 사이트 로고 글꼴(Instrument Serif 이탤릭)과 3D 아이콘을 쓴다.
//   node mobile/scripts/make-store-graphics.mjs <출력 폴더>
// 글꼴은 그릴 때만 받는다(OFL, 저장소에 넣지 않음). next/og 는 루트 node_modules 의 것
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, "../../apps/web/package.json"));
const { ImageResponse } = require("next/og");
const { createElement: h } = require("react");
const out = process.argv[2] ?? "/tmp/unnie-store/graphics";
mkdirSync(out, { recursive: true });

const font = await (await fetch("https://raw.githubusercontent.com/google/fonts/main/ofl/instrumentserif/InstrumentSerif-Italic.ttf")).arrayBuffer();
const icon = (name) => `data:image/png;base64,${readFileSync(join(here, `../../apps/web/public/icons3d/${name}.png`)).toString("base64")}`;
const INK = "#1b1520";
const PINK = "#ff2488";

async function save(file, element, width, height) {
  const img = new ImageResponse(element, { width, height, fonts: [{ name: "Instrument Serif", data: font, style: "italic", weight: 400 }] });
  writeFileSync(join(out, file), Buffer.from(await img.arrayBuffer()));
  console.log("wrote", join(out, file));
}

// 대표 그래픽: 왼쪽 워드마크 + 한 줄, 오른쪽 3D 아이콘 다섯 개 (K-pop·뷰티·드라마·푸드·여행)
const tile = (name, size, style) => h("img", { src: icon(name), width: size, height: size, style: { position: "absolute", ...style } });
await save(
  "feature-graphic.png",
  h(
    "div",
    { style: { width: "100%", height: "100%", display: "flex", background: "#ffffff", position: "relative" } },
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 72, width: 560 } },
      h(
        "div",
        { style: { display: "flex", alignItems: "baseline", fontFamily: "Instrument Serif", fontStyle: "italic", fontSize: 132, color: INK, lineHeight: 1 } },
        "Unnie",
        h("span", { style: { color: PINK } }, "."),
      ),
      h("div", { style: { marginTop: 10, fontSize: 26, letterSpacing: 10, color: "#6b6b74" } }, "NOTE"),
      h("div", { style: { marginTop: 26, fontSize: 30, color: INK, lineHeight: 1.3 } }, "K-pop · K-beauty · K-drama · Korea travel"),
    ),
    tile("kpop", 150, { left: 600, top: 40 }),
    tile("kbeauty", 170, { left: 790, top: 60 }),
    tile("kdrama", 140, { left: 640, top: 250 }),
    tile("kfood", 150, { left: 820, top: 280 }),
    tile("travel", 110, { left: 905, top: 0 }),
  ),
  1024,
  500,
);

// Play 아이콘 512 (앱 아이콘과 같은 'U.')
await save(
  "play-icon-512.png",
  h(
    "div",
    { style: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", fontFamily: "Instrument Serif", fontStyle: "italic", fontSize: 400, color: INK, paddingTop: 30, paddingRight: 10 } },
    "U",
    h("span", { style: { color: PINK } }, "."),
  ),
  512,
  512,
);
