import { ImageResponse } from "next/og";

import { isSkinType, SHARE_DOMAIN, SKIN_CODE } from "@/lib/beauty";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "My skin type · Unnie Note";

// 피부 타입 결과 공유 이미지. 라틴 글자만 쓴다 (한중일 폰트를 싣지 않는다) — 'My skin type: DRY · Unnie Note'.
// 색은 뷰티 틴트(--tint-kbeauty 라이트 값을 sRGB 로)와 잉크, 체리 점 하나 (기본 공유 이미지와 같은 팔레트)
const TINT = "#f6dcef";
const INK = "#1b1520";
const INK_SUB = "rgba(27, 21, 32, 0.72)";
const GHOST = "rgba(27, 21, 32, 0.1)";
const CHERRY = "#ff3d6e";

export default async function SkinTypeOgImage({ params }: { params: Promise<{ locale: string; type: string }> }) {
  const { type } = await params;
  const code = isSkinType(type) ? SKIN_CODE[type] : "SKIN";
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
        {/* 유령 글자는 첫 글자 하나만 (긴 코드 전체를 깔면 본문 글자와 겹쳐 읽기 어렵다) */}
        <div
          style={{
            position: "absolute",
            right: -30,
            bottom: -150,
            fontSize: 560,
            color: GHOST,
            display: "flex",
          }}
        >
          {code.slice(0, 1)}
        </div>
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
