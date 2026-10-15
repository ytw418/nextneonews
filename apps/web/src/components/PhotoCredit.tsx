import type { Media } from "@kmedia/db";

// CC 라이선스가 요구하는 표시: 저작자, 라이선스 이름과 링크, 원본 링크, 수정 여부(화면에 맞게 잘라 씀)
export function PhotoCredit({ media }: { media: Pick<Media, "credit" | "author" | "licenseName" | "licenseUrl" | "sourceUrl"> }) {
  if (!media.sourceUrl) {
    return media.credit ? <figcaption className="mt-2 text-st13 text-white/70">{media.credit}</figcaption> : null;
  }
  const link = "underline decoration-white/40 underline-offset-2";
  return (
    <figcaption className="mt-2 text-st13 text-white/70">
      Photo: {media.author ?? "Unknown"}
      {media.licenseName && (
        <>
          {" · "}
          {media.licenseUrl ? (
            <a href={media.licenseUrl} target="_blank" rel="noopener license" className={link}>
              {media.licenseName}
            </a>
          ) : (
            media.licenseName
          )}
        </>
      )}
      {" · "}
      <a href={media.sourceUrl} target="_blank" rel="noopener" className={link}>
        Wikimedia Commons
      </a>
      {" · cropped"}
    </figcaption>
  );
}
