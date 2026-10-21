// 앱 네이티브 문구(탭 이름·저장함·오프라인)를 웹 메시지에서 뽑아 src/i18n/strings.ts 로 쓴다.
// 탭·저장함 문구는 웹(apps/web/messages)과 같아야 해서 손으로 옮기지 않는다. 웹 문구를 바꾸면 다시 돌린다:
//   node mobile/scripts/gen-strings.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const web = join(here, "../../apps/web/messages");
const out = join(here, "../src/i18n/strings.ts");
const LOCALES = ["en", "ja", "zh-TW", "zh-CN", "ko", "vi", "id", "fr", "ru"];

// 웹에 없는 앱 전용 문구
const APP_ONLY = {
  en: { remove: "Remove", offlineTitle: "You’re offline", offlineBody: "Check your connection and try again.", retry: "Try again" },
  ja: { remove: "削除", offlineTitle: "オフラインです", offlineBody: "接続を確認して、もう一度お試しください。", retry: "再読み込み" },
  "zh-TW": { remove: "移除", offlineTitle: "目前離線", offlineBody: "請檢查網路連線後再試一次", retry: "重試" },
  "zh-CN": { remove: "移除", offlineTitle: "当前离线", offlineBody: "请检查网络连接后重试", retry: "重试" },
  ko: { remove: "삭제", offlineTitle: "인터넷에 연결되어 있지 않아요", offlineBody: "연결을 확인하고 다시 시도해 주세요", retry: "다시 시도" },
  vi: { remove: "Xóa", offlineTitle: "Bạn đang ngoại tuyến", offlineBody: "Hãy kiểm tra kết nối rồi thử lại.", retry: "Thử lại" },
  id: { remove: "Hapus", offlineTitle: "Kamu sedang offline", offlineBody: "Cek koneksimu lalu coba lagi.", retry: "Coba lagi" },
  fr: { remove: "Retirer", offlineTitle: "Vous êtes hors ligne", offlineBody: "Vérifiez votre connexion et réessayez.", retry: "Réessayer" },
  ru: { remove: "Убрать", offlineTitle: "Нет подключения к интернету", offlineBody: "Проверьте подключение и попробуйте снова.", retry: "Повторить" },
};

const read = (path) => JSON.parse(readFileSync(join(web, path), "utf8"));
const strings = {};
for (const locale of LOCALES) {
  const main = read(`${locale}.json`);
  const engage = read(`ns/Engage/${locale}.json`);
  strings[locale] = {
    home: main.Nav.home,
    rankings: read(`ns/Rankings/${locale}.json`).tab,
    guide: read(`ns/Guide/${locale}.json`).tab,
    schedule: main.Nav.schedule,
    back: main.Nav.back,
    saved: engage.savedTab,
    savedTitle: engage.savedTitle,
    savedEmpty: engage.savedEmpty,
    savedBrowse: engage.savedBrowse,
    savedMissing: engage.savedMissing,
    savedRemoved: engage.savedRemoved,
    savedUndo: engage.savedUndo,
    kinds: {
      article: engage.savedTabs.article,
      beauty: engage.savedTabs.beauty,
      place: engage.savedTabs.place,
      clinic: engage.savedTabs.clinic,
      drama: engage.savedTabs.drama,
    },
    ...APP_ONLY[locale],
  };
}

// 빠진 키·빈 문자열·언어마다 다른 키 모양이면 멈춘다 (중첩 키는 JSON 으로 쓸 때 조용히 사라진다)
function shape(value, path) {
  if (typeof value === "string") {
    if (!value.trim()) throw new Error(`${path} 가 비어 있다`);
    return "s";
  }
  if (!value || typeof value !== "object") throw new Error(`${path} 없음`);
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v, `${path}.${k}`)]));
}
const base = JSON.stringify(shape(strings.en, "en"));
for (const locale of LOCALES) {
  if (JSON.stringify(shape(strings[locale], locale)) !== base) throw new Error(`${locale} 의 키가 en 과 다르다`);
}

const body = `// 만든 파일 — 고치지 말 것. mobile/scripts/gen-strings.mjs 가 apps/web/messages 에서 뽑는다
import type { Locale } from "../lib/locales";

export const STRINGS = ${JSON.stringify(strings, null, 2)} as const satisfies Record<Locale, unknown>;

export type Strings = (typeof STRINGS)[Locale];
`;
writeFileSync(out, body);
console.log(`wrote ${out}`);
