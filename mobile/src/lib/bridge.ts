import { TABS, type Tab } from "./links";
import { isLocale, type Locale } from "./locales";
import { normalizeSaved, type SavedItem } from "./saved-rules";

// 웹뷰 ↔ 앱 약속. 웹 코드는 거의 그대로 두고, 앱이 페이지마다 심는 스크립트(beforeContentScript)가
// 웹의 저장 목록(localStorage 'hb:saved' + 'hb:saved-changed' 이벤트, apps/web/src/lib/saved.ts)을 앱과 맞춘다.
// 원본은 앱(AsyncStorage) — 사파리처럼 7일 뒤 지워지지 않는다. 웹이 직접 보내는 메시지는 lib/app-mode.ts 의 postToApp 하나뿐이다

export type WebMessage =
  | { type: "saved"; items: SavedItem[] } // 웹에서 저장·해제했다 (목록 전체)
  | { type: "tab"; tab: Tab } // 다섯 탭 첫 화면 링크를 눌렀다 → 네이티브 탭으로
  | { type: "locale"; locale: Locale } // 언어 링크(hreflang — 언어 시트·푸터)를 눌렀다 → 앱 언어를 바꾼다. 리다이렉트로 바뀐 주소는 따라가지 않는다
  | { type: "share"; url: string; title?: string; text?: string } // navigator.share 대신
  | { type: "back" }; // 쌓아 연 웹뷰의 첫 페이지에서 웹 '뒤로' (apps/web/src/components/BackButton.tsx)

const str = (v: unknown, max = 2000): string | undefined => (typeof v === "string" && v.length <= max ? v : undefined);

// 모양이 틀리거나 모르는 메시지는 null. 저장 목록은 규칙대로 거른다
export function parseMessage(raw: string): WebMessage | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const m = data as Record<string, unknown>;
  switch (m.type) {
    case "saved":
      return Array.isArray(m.items) ? { type: "saved", items: normalizeSaved(m.items) } : null;
    case "tab":
      return typeof m.tab === "string" && (TABS as readonly string[]).includes(m.tab) ? { type: "tab", tab: m.tab as Tab } : null;
    case "locale":
      return typeof m.locale === "string" && isLocale(m.locale) ? { type: "locale", locale: m.locale } : null;
    case "share": {
      const url = str(m.url);
      return url ? { type: "share", url, title: str(m.title, 300), text: str(m.text) } : null;
    }
    case "back":
      return { type: "back" };
    default:
      return null;
  }
}

// 페이지 문서가 만들어질 때(그리기 전) 도는 스크립트.
// ownTab: 이 웹뷰의 탭. 그 탭 첫 화면 링크는 웹뷰 안에서 열고, 다른 탭 첫 화면 링크는 앱에 넘긴다 (null 이면 모두 넘긴다)
export function beforeContentScript({ savedJson, ownTab }: { savedJson: string; ownTab: Tab | null }): string {
  return `(function(){
if (window.__hbApp) return; window.__hbApp = 1;
window.__hbAppPushed = ${JSON.stringify(ownTab === null)};
function post(m){ try { window.ReactNativeWebView.postMessage(JSON.stringify(m)); } catch (e) {} }
try { localStorage.setItem("hb:saved", ${JSON.stringify(savedJson)}); } catch (e) {}
window.addEventListener("hb:saved-changed", function(){
  if (window.__hbFromApp) { window.__hbFromApp = 0; return; }
  var items = []; try { items = JSON.parse(localStorage.getItem("hb:saved") || "[]"); } catch (e) {}
  post({ type: "saved", items: items });
});
var TAB = { "/": "home", "/rankings": "rankings", "/guide": "guide", "/schedule": "schedule", "/saved": "saved" };
var OWN = ${JSON.stringify(ownTab)};
function tabOf(path){ var p = path.replace(/^\\/(en|ja|zh-tw|zh-cn|ko|vi|id|fr|ru)(?=\\/|$)/i, "").replace(/\\/+$/, "") || "/"; return TAB[p] || null; }
document.addEventListener("click", function(e){
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
  if (!a || a.target === "_blank" || a.hasAttribute("download") || a.host !== location.host) return;
  var lang = a.getAttribute("hreflang");
  if (lang) post({ type: "locale", locale: lang });
  var tab = tabOf(a.pathname);
  if (!tab || tab === OWN) return;
  e.preventDefault(); e.stopPropagation();
  post({ type: "tab", tab: tab });
}, true);
if (!navigator.share) {
  navigator.share = function(d){ d = d || {}; post({ type: "share", url: String(d.url || location.href), title: d.title, text: d.text }); return Promise.resolve(); };
}
})(); true;`;
}

// 앱 목록을 웹뷰에 다시 심는다 (다른 탭에서 저장·해제했을 때, 페이지를 다 읽었을 때). 같으면 아무것도 안 한다.
// __hbFromApp: 웹이 이 변경을 다시 앱으로 보내지 않게 (메아리 막기)
export function pushSavedScript(savedJson: string): string {
  return `(function(){try{var s=${JSON.stringify(savedJson)};if(localStorage.getItem("hb:saved")!==s){localStorage.setItem("hb:saved",s);window.__hbFromApp=1;window.dispatchEvent(new Event("hb:saved-changed"));}}catch(e){}})();true;`;
}

// 같은 탭을 다시 눌렀을 때: 내려가 있으면 맨 위로, 맨 위면 탭 첫 화면으로
export function reselectScript(rootUrl: string): string {
  return `(function(){if(window.scrollY>8){window.scrollTo({top:0,behavior:"smooth"});}else if(location.href.replace(/[?#].*$/,"").replace(/\\/$/,"")!==${JSON.stringify(rootUrl.replace(/\/$/, ""))}){location.href=${JSON.stringify(rootUrl)};}})();true;`;
}

export function gotoScript(url: string): string {
  return `location.href=${JSON.stringify(url)};true;`;
}
