import { adsenseClientId } from "@/lib/ads";

// 애드센스 ads.txt (광고 판매자 인증). 게시자 id 는 NEXT_PUBLIC_ADSENSE_CLIENT(ca-pub-…) 에서 'ca-' 를 뗀 값이다.
// 값이 없으면 404. 언어 미들웨어(proxy.ts)는 점이 든 주소를 건너뛰어 루트(/ads.txt)에서 그대로 나간다
export function GET() {
  const client = adsenseClientId();
  if (!client) {
    return new Response("Not Found", { status: 404 });
  }
  const line = `google.com, ${client.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`;
  return new Response(line, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
