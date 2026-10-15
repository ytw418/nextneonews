import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Hallyu Brief";

// 홈·카테고리·사진 없는 글의 기본 공유 이미지 (라틴 글자만 써서 별도 한중일 폰트가 필요 없다)
export default function OgImage() {
  const tints = ["#ffd9e5", "#d6eaff", "#fff0b3", "#cdf1e1", "#e5e0ff"];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#fbf7f2", padding: 72 }}>
        <div style={{ display: "flex", alignItems: "baseline", fontSize: 120, fontStyle: "italic", color: "#1b1520" }}>
          Hallyu<span style={{ color: "#ff3d6e" }}>.</span>
          <span style={{ marginLeft: 24, fontSize: 40, fontStyle: "normal", letterSpacing: 10, color: "#7d7382" }}>BRIEF</span>
        </div>
        <div style={{ marginTop: 24, fontSize: 40, color: "#1b1520" }}>K-POP · K-DRAMA · K-FOOD · LIFE IN KOREA</div>
        <div style={{ marginTop: "auto", display: "flex", gap: 20 }}>
          {tints.map((c) => (
            <div key={c} style={{ width: 190, height: 120, borderRadius: 24, background: c }} />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
