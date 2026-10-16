// 30일 점수 선. 차트 라이브러리 없이 서버에서 SVG 로 그린다 (자바스크립트 0).
// 그날 순위표에 없던 날(null)은 선을 끊는다. 폭은 부모를 꽉 채우고 높이는 32px
const W = 120;
const H = 32;
const PAD = 3;

export function Sparkline({ values, label }: { values: (number | null)[]; label: string }) {
  const nums = values.filter((v): v is number => v !== null);
  if (values.length < 2 || nums.length < 2) return null;
  const min = Math.min(...nums);
  const range = Math.max(...nums) - min || 1;
  const x = (i: number) => (PAD + (i * (W - PAD * 2)) / (values.length - 1)).toFixed(1);
  const y = (v: number) => (H - PAD - ((v - min) / range) * (H - PAD * 2)).toFixed(1);

  // null 에서 끊어 여러 조각으로
  let line = "";
  let pen = false;
  values.forEach((v, i) => {
    if (v === null) {
      pen = false;
      return;
    }
    line += `${pen ? "L" : "M"}${x(i)} ${y(v)}`;
    pen = true;
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      className="block h-8 w-full text-brand-ink"
    >
      <path d={`M${PAD} ${H - PAD}H${W - PAD}`} stroke="var(--line)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
