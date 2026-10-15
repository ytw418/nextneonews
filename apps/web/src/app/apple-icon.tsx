import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// 아이폰 홈 화면에 추가했을 때의 아이콘
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fbf7f2",
          fontSize: 120,
          fontStyle: "italic",
          color: "#1b1520",
        }}
      >
        H<span style={{ color: "#ff3d6e" }}>.</span>
      </div>
    ),
    size,
  );
}
