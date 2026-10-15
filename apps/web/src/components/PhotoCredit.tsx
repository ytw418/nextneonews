import type { Media } from "@kmedia/db";

import { Meta } from "@/components/ui/Meta";

export type CreditMedia = Pick<Media, "credit" | "author" | "licenseName" | "licenseUrl" | "sourceUrl">;

// CC 라이선스가 요구하는 표시: 저작자, 라이선스 이름과 링크, 원본 링크, 수정 여부(화면에 맞게 잘라 씀).
// 사진 위(어두운 그늘)에 얹는다. 위키미디어 사진을 크게 보여 주는 곳(글 히어로·피드 맨 위 카드)마다 둔다
export function PhotoCredit({ media, className = "mt-2" }: { media: CreditMedia; className?: string }) {
  const style = `${className} text-st13 text-white/70`;
  if (!media.sourceUrl) {
    return media.credit ? <figcaption className={style}>{media.credit}</figcaption> : null;
  }
  const link = "underline decoration-white/40 underline-offset-2";
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
          <a key="commons" href={media.sourceUrl} target="_blank" rel="noopener" className={link}>
            Wikimedia Commons
          </a>,
          "cropped",
        ]}
      />
    </figcaption>
  );
}
