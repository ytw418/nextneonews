"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { addSavedMany, decodeSavedShare, type SavedItem } from "@/lib/saved";
import { track } from "@/lib/track";

const noSubscribe = () => () => {};

// 공유 링크(?i=)의 값. useSearchParams 를 쓰면 정적 페이지가 Suspense 경계까지 클라이언트 렌더로 바뀌어서 주소를 직접 읽는다
const shareCode = () => new URLSearchParams(window.location.search).get("i");

// 주소에서 ?i= 를 지운다 (새로고침해도 배너가 다시 뜨지 않게). LINE 으로 받은 링크의 외부 브라우저 표시도 함께
function clearShareCode() {
  const url = new URL(window.location.href);
  url.searchParams.delete("i");
  url.searchParams.delete("openExternalBrowser");
  window.history.replaceState(window.history.state, "", url);
}

// 친구가 보낸 저장 목록 링크로 열었을 때 맨 위 배너: "목록 가져오기 n개". 이미 저장한 항목은 빼고 센다
export function ImportBanner({ items }: { items: readonly SavedItem[] }) {
  const t = useTranslations("Engage");
  const tNav = useTranslations("Nav");
  const code = useSyncExternalStore(noSubscribe, shareCode, () => null);
  const [closed, setClosed] = useState(false);
  const incoming = useMemo(() => (code ? decodeSavedShare(code) : []), [code]);
  const fresh = incoming.filter((i) => !items.some((s) => s.kind === i.kind && s.id === i.id));

  if (closed || fresh.length === 0) return null;

  const close = () => {
    clearShareCode();
    setClosed(true);
  };

  const accept = () => {
    const added = addSavedMany(fresh);
    track("saved_import", { count: added });
    toast(t("savedImported", { count: added }));
    close();
  };

  return (
    <div className="mx-gutter mt-4 rounded-card bg-brand-weak p-4">
      <p className="text-t6 font-semibold text-brand-ink">{t("savedImport", { count: fresh.length })}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="m" onClick={accept}>
          {t("savedImportAction")}
        </Button>
        <Button size="m" variant="neutral" onClick={close}>
          {tNav("close")}
        </Button>
      </div>
    </div>
  );
}
