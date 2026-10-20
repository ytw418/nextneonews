import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { SKIN_ICON } from "@/data/cover";
import { isSkinType, SHARE_DOMAIN, SKIN_CODE } from "@/lib/beauty";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "My skin type · Unnie Note";

// 피부 타입 결과 공유 이미지. 라틴 글자만 쓴다 (한중일 폰트를 싣지 않는다) — 'My skin type: DRY · Unnie Note'.
// 색은 뷰티 틴트(--tint-kbeauty 라이트 값을 sRGB 로)와 잉크, 체리 점 하나 (기본 공유 이미지와 같은 팔레트).
// 오른쪽에 결과 화면과 같은 3D 아이콘 (next/og 는 WebP 를 못 읽어 PNG 원본을 쓴다). 못 읽으면 아이콘 없이 그린다

async function iconDataUrl(type: string): Promise<string | null> {
  if (!isSkinType(type)) return null;
  try {
    const png = await readFile(join(process.cwd(), "public", "icons3d", `${SKIN_ICON[type]}.png`));
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}
const TINT = "#f6dcef";
const INK = "#1b1520";
const INK_SUB = "rgba(27, 21, 32, 0.72)";
const CHERRY = "#ff2488";

export default async function SkinTypeOgImage({ params }: { params: Promise<{ locale: string; type: string }> }) {
  const { type } = await params;
  const code = isSkinType(type) ? SKIN_CODE[type] : "SKIN";
  const icon = await iconDataUrl(type);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
          background: TINT,
          padding: 72,
          color: INK,
        }}
      >
        {icon && (
          <img src={icon} alt="" width={300} height={300} style={{ position: "absolute", right: 72, top: 96 }} />
        )}
        <div style={{ display: "flex", alignItems: "baseline", fontSize: 44 }}>
          Unnie<span style={{ color: CHERRY }}>.</span>
          <span style={{ marginLeft: 16, fontSize: 30, letterSpacing: 8, color: INK_SUB }}>NOTE</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 56, color: INK_SUB }}>My skin type:</div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", marginTop: 8 }}>
            <span style={{ fontSize: 120, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }}>{code}</span>
            <span style={{ marginLeft: 24, fontSize: 48, color: INK_SUB }}>· Unnie Note</span>
          </div>
          <div style={{ display: "flex", marginTop: 32, fontSize: 30, color: INK_SUB }}>{SHARE_DOMAIN}</div>
        </div>
      </div>
    ),
    size,
  );
}
