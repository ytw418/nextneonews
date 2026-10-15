import { Badge } from "@/components/ui/Badge";
import { type DdayView, ddayTone } from "@/lib/schedule";

// D-day 배지. 항상 절대 날짜 옆에 둔다 (배지만으로 날짜를 알리지 않는다).
// label 은 부르는 쪽이 번역해서 넘긴다 ('D-3', '오늘', '진행 중', '종료')
export function DdayBadge({ view, label, className }: { view: DdayView; label: string; className?: string }) {
  return (
    <Badge tone={ddayTone(view)} className={className}>
      {label}
    </Badge>
  );
}
