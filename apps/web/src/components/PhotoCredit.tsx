import type { Media } from "@kmedia/db";

import { Meta } from "@/components/ui/Meta";

export type CreditMedia = Pick<Media, "credit" | "author" | "licenseName" | "licenseUrl" | "sourceUrl"> & {
  sourceName?: string; // 원본이 있는 곳. 기본 위키미디어 공용 (제품 사진은 Open Beauty Facts)
  change?: string; // 수정 내용. 기본 cropped (화면에 맞게 잘라 씀), 제품 사진은 background removed
};

// CC 라이선스가 요구하는 표시: 저작자, 라이선스 이름과 링크, 원본 링크, 수정 여부.
// 기본은 사진 위(어두운 그늘)에 얹는다. 위키미디어 사진을 크게 보여 주는 곳(글 히어로·피드 맨 위 카드)마다 둔다.
// plain 은 밝은 면 위 (오려 낸 제품 사진 아래 줄)
export function PhotoCredit({
  media,
  className = "mt-2",
  tone = "scrim",
}: {
  media: CreditMedia;
  className?: string;
  tone?: "scrim" | "plain";
}) {
  const style = `${className} text-st13 ${tone === "plain" ? "text-ink-600" : "text-white/70"}`;
  if (!media.sourceUrl) {
    return media.credit ? <figcaption className={style}>{media.credit}</figcaption> : null;
  }
  const link = `underline underline-offset-2 ${tone === "plain" ? "decoration-line-strong" : "decoration-white/40"}`;
  return (
    <figcaption className={style}>
      <Meta
        parts={[
          `Photo: ${media.author ?? "Unknown"}`,
          media.licenseName &&
            (media.licenseUrl ? (
              <a key="license" href={media.licenseUrl} target="_blank" rel="noopener license" className={link}>
                {media.licenseName}
              </a>
            ) : (
              media.licenseName
            )),
          <a key="source" href={media.sourceUrl} target="_blank" rel="noopener" className={link}>
            {media.sourceName ?? "Wikimedia Commons"}
          </a>,
          media.change ?? "cropped",
        ]}
      />
    </figcaption>
  );
}
