import { useTranslations } from "next-intl";

// 30위 안에서 이만큼 오르면 급상승으로 굵게 (worker rankings 의 rising 기준과 같다)
const RISING = 5;

// 순위 변동: ▲3(brand-ink) / ▼1(ink-600) / – / NEW 칩. 색만으로 알리지 않게 화살표와 숫자에 읽을 문구를 함께 둔다.
// 서버·클라이언트(RankRow) 양쪽에서 쓰므로 훅(useTranslations)만 쓴다
export function RankChange({ rank, prevRank, className = "" }: { rank: number; prevRank: number | null; className?: string }) {
  const t = useTranslations("Rankings");
  // relative: 가로 레일 안에서 sr-only 글자(absolute)가 레일 밖 문서 폭을 늘리지 않게 여기에 묶는다
  const base = `relative inline-flex items-center whitespace-nowrap text-t7 tabular-nums ${className}`;

  if (prevRank === null) {
    return (
      <span className={`${base} min-h-5 rounded-badge bg-brand-weak px-1.5 font-bold text-brand-ink`}>
        <span aria-hidden>NEW</span>
        <span className="sr-only">{t("newEntry")}</span>
      </span>
    );
  }
  const diff = prevRank - rank;
  if (diff === 0) {
    return (
      <span className={`${base} font-semibold text-ink-600`}>
        <span aria-hidden>–</span>
        <span className="sr-only">{t("same")}</span>
      </span>
    );
  }
  const up = diff > 0;
  return (
    <span className={`${base} ${up ? "text-brand-ink" : "text-ink-600"} ${up && diff >= RISING ? "font-bold" : "font-semibold"}`}>
      <span aria-hidden>
        {up ? "▲" : "▼"}
        {Math.abs(diff)}
      </span>
      <span className="sr-only">{t(up ? "up" : "down", { count: Math.abs(diff) })}</span>
    </span>
  );
}
