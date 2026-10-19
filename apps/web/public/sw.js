// 설치(PWA) 조건을 채우는 최소 서비스 워커. 캐시는 하지 않고, 오프라인일 때만 안내 화면을 보여 준다
const OFFLINE = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Unnie Note</title>
<body style="margin:0;display:grid;place-items:center;min-height:100svh;background:#fbf7f2;color:#1b1520;font:17px -apple-system,BlinkMacSystemFont,sans-serif;text-align:center">
<div><p style="font:italic 40px Georgia,serif;margin:0">Unnie<span style="color:#ff3d6e">.</span></p>
<p>You're offline · オフラインです · 目前離線 · 오프라인이에요</p>
<button onclick="location.reload()" style="margin-top:8px;height:48px;padding:0 24px;border:0;border-radius:999px;background:#ff3d6e;color:#fff;font-weight:700;font-size:16px">↻</button></div>`;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(() => new Response(OFFLINE, { headers: { "content-type": "text/html; charset=utf-8" } })),
  );
});
