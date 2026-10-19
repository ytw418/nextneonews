"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { addSavedMany, decodePastedShare } from "@/lib/saved";
import { track } from "@/lib/track";

// 홈 화면 앱(standalone)의 저장함 맨 아래: '나에게 보내기'로 받은 복원 링크를 붙여 넣어 목록을 옮긴다.
// 홈 화면 앱은 사파리와 저장소가 따로라 빈 저장함으로 시작하고, 주소창이 없어 ?i= 링크를 열 길이 없다
export function PasteLink() {
  const t = useTranslations("Engage");
  const id = useId();
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const items = decodePastedShare(value);
    if (items.length === 0) {
      setInvalid(true);
      return;
    }
    const added = addSavedMany(items);
    track("saved_import", { count: added, from: "paste" });
    toast(t("savedImported", { count: added }));
    setValue("");
    setInvalid(false);
  };

  return (
    // noValidate: type="url" 의 브라우저 기본 검사가 제출을 막아 아래 안내 문구 대신 브라우저 말풍선이 떴다 (?i= 값만 붙여도 받는다)
    <form onSubmit={submit} noValidate className="mx-gutter mt-8">
      <label htmlFor={id} className="text-t6 font-semibold text-ink-900">
        {t("savedPasteLabel")}
      </label>
      <div className="mt-2 flex gap-2">
        {/* 17px(t5) 이상이라 아이폰이 초점 때 화면을 확대하지 않는다 */}
        <input
          id={id}
          type="url"
          inputMode="url"
          autoComplete="off"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setInvalid(false);
          }}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${id}-error` : undefined}
          className="min-h-12 min-w-0 flex-1 rounded-btn bg-card px-4 text-t5 text-ink-900 ring-1 ring-line-strong placeholder:text-ink-600 focus:outline-hidden! focus:ring-2 focus:ring-brand"
        />
        <Button type="submit" size="l" variant="neutral" disabled={!value.trim()}>
          {t("savedPasteAction")}
        </Button>
      </div>
      {invalid && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-t6 font-medium text-danger">
          {t("savedPasteInvalid")}
        </p>
      )}
    </form>
  );
}
