import Image from "next/image";

import { PhotoCredit } from "@/components/PhotoCredit";
import { CheerButton } from "@/components/rankings/CheerButton";
import { Badge } from "@/components/ui/Badge";
import type { EntityPhoto } from "@/lib/entity-image";
import { imgSrc } from "@/lib/image";

interface Props {
  entityId: string;
  chart: string; // 응원 이벤트에 함께 보낼 차트 (어느 차트에도 없는 종류면 'idol')
  name: string; // 화면 언어 이름 (h1)
  subName: string | null; // 한국어 이름 (한국어 화면에서는 영어 이름)
  subLang: string;
  typeLabel: string | null; // 그룹·가수·배우·드라마
  photo: EntityPhoto | null;
  tint: string;
  cheers: number; // 오늘 팬 응원 수
}

// 인물 페이지 맨 위. 사진이 있으면 글 히어로처럼 화면 폭을 채우는 4:5 커버(이 화면의 LCP 라 바로 받는다) 위에
// 종류 배지 · 이름 · 한국어 이름 · CC 표시를 얹는다. 사진이 없으면 차트 틴트 카드. 자리는 비율로 미리 잡아 밀림이 없다
export function IdolHero({ entityId, chart, name, subName, subLang, typeLabel, photo, tint, cheers }: Props) {
  return (
    <>
      {photo ? (
        <figure className="relative flex aspect-[4/5] max-h-[78svh] w-full flex-col justify-end overflow-hidden bg-fill-weak">
          <Image
            src={imgSrc(photo.src, photo.width)}
            alt={name}
            fill
            preload
            sizes="(max-width: 640px) 100vw, 640px"
            // 인물 사진은 얼굴이 위쪽에 있다. 이름 블록 위로 얼굴이 남게 위쪽을 기준으로 자른다
            className="object-cover object-[50%_20%]"
          />
          <div className="relative bg-[linear-gradient(to_top,rgb(0_0_0/.72)_0%,rgb(0_0_0/.56)_calc(100%-96px),transparent_100%)] px-gutter pt-24 pb-5 text-white">
            {typeLabel && <Badge tone="scrim">{typeLabel}</Badge>}
            <h1 className="mt-2 text-st2 font-bold break-words text-white">{name}</h1>
            {subName && (
              <p lang={subLang} className="text-t5 font-medium text-white/80">
                {subName}
              </p>
            )}
            <PhotoCredit
              media={{
                credit: null,
                author: photo.author,
                licenseName: photo.licenseName,
                licenseUrl: photo.licenseUrl,
                sourceUrl: photo.sourceUrl,
              }}
            />
          </div>
        </figure>
      ) : (
        <div className="px-gutter pt-4">
          <div className="rounded-card px-5 pt-5 pb-6 shadow-card" style={{ backgroundColor: tint }}>
            {typeLabel && <Badge tone="paper">{typeLabel}</Badge>}
            <h1 className="mt-3 text-st2 font-bold break-words text-on-tint">{name}</h1>
            {subName && (
              <p lang={subLang} className="text-t5 font-medium text-on-tint-sub">
                {subName}
              </p>
            )}
          </div>
        </div>
      )}
      <div className="px-gutter pt-4">
        <CheerButton entityId={entityId} chart={chart} count={cheers} block />
      </div>
    </>
  );
}
