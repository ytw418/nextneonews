import { ImageResponse } from "next/og";

const SIZES = new Set([192, 512]);

// PWA 설치 아이콘 (안드로이드 홈 화면·설치 창). apple-icon·icon.svg 와 같은 'U.' (Unnie Note).
// maskable 은 원 안에 잘려도 보이게 여백을 둔다. 7일 immutable 캐시라 그림을 바꾸면 manifest.ts 의 주소 버전(v)도 올린다
export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const size = Number(params.get("size"));
  if (!SIZES.has(size)) return new Response("Not Found", { status: 404 });
  const maskable = params.get("maskable") === "1";
  const font = Math.round(size * (maskable ? 0.5 : 0.66));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          fontSize: font,
          fontStyle: "italic",
          color: "#1b1520",
        }}
      >
        U<span style={{ color: "#ff2488" }}>.</span>
      </div>
    ),
    { width: size, height: size, headers: { "cache-control": "public, max-age=604800, immutable" } },
  );
}
