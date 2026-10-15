// IndexNow 키 파일. worker 가 글을 승인할 때 Bing 등에 새 URL 을 알리면서 이 위치를 keyLocation 으로 보낸다
export function GET() {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    return new Response("Not Found", { status: 404 });
  }
  return new Response(key, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
