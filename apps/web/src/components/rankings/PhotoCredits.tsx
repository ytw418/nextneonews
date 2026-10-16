import { getTranslations } from "next-intl/server";

import { ChevronDownIcon } from "@/components/icons";
import { Meta } from "@/components/ui/Meta";
import type { EntityPhoto } from "@/lib/entity-image";

const LINK = "underline decoration-line-strong underline-offset-2";

// 이 화면에 보인 사진의 CC 표시 (저작자 · 라이선스 링크 · 원본 링크 · 잘라 씀). 한 번에 접어 두고 펼쳐 본다.
// 같은 사진이 여러 번 나와도(히어로·뜨는 목록) 한 줄만
export async function PhotoCredits({ credits }: { credits: { name: string; photo: EntityPhoto }[] }) {
  const unique = [...new Map(credits.map((c) => [c.photo.sourceUrl, c])).values()];
  if (unique.length === 0) return null;
  const t = await getTranslations("Rankings");

  return (
    <details className="group px-gutter pt-6">
      <summary className="press flex min-h-11 cursor-pointer list-none items-center gap-1 text-t6 font-semibold text-ink-600 [&::-webkit-details-marker]:hidden">
        {t("credits", { count: unique.length })}
        <ChevronDownIcon className="size-4 text-ink-400 transition-transform duration-200 ease-expo group-open:rotate-180" />
      </summary>
      <ul className="flex flex-col gap-2 pt-2 text-st12 text-ink-600">
        {unique.map(({ name, photo }) => (
          <li key={photo.sourceUrl}>
            <span className="font-semibold text-ink-700">{name}</span>
            {" — "}
            <Meta
              parts={[
                t("photoBy", { author: photo.author ?? t("unknownAuthor") }),
                photo.licenseUrl ? (
                  <a key="license" href={photo.licenseUrl} target="_blank" rel="noopener license" className={LINK}>
                    {photo.licenseName}
                  </a>
                ) : (
                  photo.licenseName
                ),
                <a key="source" href={photo.sourceUrl} target="_blank" rel="noopener" className={LINK}>
                  Wikimedia Commons
                </a>,
                t("cropped"),
              ]}
            />
          </li>
        ))}
      </ul>
    </details>
  );
}
