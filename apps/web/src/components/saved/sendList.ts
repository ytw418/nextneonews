import { localeHomePath } from "@kmedia/core";

import { toast } from "@/components/ui/Toast";
import { encodeSavedShare, readSaved, SAVED_SHARE_MAX, type SavedItem } from "@/lib/saved";
import { track } from "@/lib/track";

// 저장 목록은 이 기기·이 브라우저에만 있다 (사파리는 7일 안 쓰면 지우고, 인스타·LINE 앱 안 브라우저는 사파리와 따로 산다).
// '나에게 보내기'로 ?i= 복원 링크를 기기 밖에 남겨 둔다: LINE 이 주 메신저인 ja·zh-TW 는 LINE 공유, 그 밖은 링크 복사

const LINE_LOCALES = new Set(["ja", "zh-TW"]);

// 앱 안 브라우저 (인스타그램·페이스북·LINE). 여기 저장한 건 사파리에서 안 보인다
const IN_APP = /Instagram|FBAN|FBAV|\bLine\//;

export function isInAppBrowser(userAgent: string): boolean {
  return IN_APP.test(userAgent);
}

export function sendsByLine(locale: string): boolean {
  return LINE_LOCALES.has(locale);
}

// 이 목록을 되살리는 주소 (/saved?i=…, 최신 SAVED_SHARE_MAX 개)
export function savedShareUrl(locale: string, items: readonly SavedItem[]): string {
  return `${window.location.origin}${localeHomePath(locale)}/saved?i=${encodeSavedShare(items)}`;
}

interface SendOptions {
  locale: string;
  text: string; // LINE 메시지 첫 줄 (Engage.sendToSelfText)
  copied: string; // 복사한 뒤 토스트 (Engage.sendToSelfCopied)
  from: "toast" | "saved";
}

// 지금 저장 목록 전체를 나에게 보낸다. 버튼·토스트 버튼을 누른 순간에 불러야 한다 (window.open 은 사용자 동작 안에서만 열린다)
export async function sendSavedList({ locale, text, copied, from }: SendOptions): Promise<void> {
  const items = readSaved();
  const url = savedShareUrl(locale, items);
  const count = Math.min(items.length, SAVED_SHARE_MAX);
  if (sendsByLine(locale)) {
    track("saved_share", { count, from, to: "line" });
    window.open(`https://line.me/R/share?text=${encodeURIComponent(`${text}\n${url}`)}`, "_blank", "noopener");
    return;
  }
  track("saved_share", { count, from, to: "copy" });
  try {
    await navigator.clipboard.writeText(url);
    toast(copied);
  } catch {
    // 클립보드를 못 쓰는 브라우저(일부 앱 안 브라우저)는 공유 시트로
    if (!navigator.share) return;
    try {
      await navigator.share({ title: text, url });
    } catch {
      // 공유 시트를 닫은 경우
    }
  }
}
