import { AdSlot } from "@/components/AdSlot";

// 가이드 화면 광고 칸: bg-band 띠 안에 둬서 본문과 갈라 보이게 (DESIGN.md §4-⑫). 자리는 AdSlot 이 280px 로 미리 잡는다.
// 광고가 없으면(운영에서 슬롯 미설정·안 채워짐·막힘) 띠째 숨긴다
export function AdBand({ label }: { label: string }) {
  return (
    <div className="mt-6 bg-band py-2 empty:hidden [&:has([data-ad-blocked])]:hidden [&:has([data-ad-status=unfilled])]:hidden">
      <AdSlot
        label={label}
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_GUIDE ?? process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE}
      />
    </div>
  );
}
