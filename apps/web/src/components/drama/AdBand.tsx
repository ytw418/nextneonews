import { AdSlot } from "@/components/AdSlot";

// 광고 띠 (DESIGN ⑫): bg-band 안에 넣어 본문과 떼고, 자리 높이는 AdSlot 의 min-h 가 잡는다 (화면 밀림 없음).
// 광고가 없거나(AdSlot 이 null) 안 채워지면 띠째 숨긴다
export function AdBand({ label }: { label: string }) {
  return (
    <div className="mt-6 bg-band py-2 empty:hidden [&:has([data-ad-blocked])]:hidden [&:has([data-ad-status=unfilled])]:hidden">
      <AdSlot label={label} slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_GUIDE ?? process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE} />
    </div>
  );
}
