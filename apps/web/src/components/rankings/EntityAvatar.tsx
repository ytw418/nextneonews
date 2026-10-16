import Image from "next/image";

const SIZE = {
  32: "size-8 text-st12",
  40: "size-10 text-t7",
  48: "size-12 text-t6",
  64: "size-16 text-t5",
} as const;

// 사진이 없을 때 원 안에 넣을 글자: 'Kim Soo-hyun' → 'KS', 'BLACKPINK' → 'B', '金秀賢' → '金'
export function initials(name: string): string {
  const words = name.split(/[\s-]+/).filter(Boolean);
  if (words.length > 1 && /^[A-Za-z]/.test(name)) {
    return words
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("");
  }
  return (Array.from(name.trim())[0] ?? "?").toUpperCase();
}

// 순위표의 원형 사진. 사진이 없으면 차트 틴트 파스텔에 이니셜 — 빈 원은 사진이 깨진 것처럼 보인다.
// 바로 옆에 이름이 있어 그림은 읽지 않는다 (alt="", aria-hidden). 서버·클라이언트 양쪽에서 쓴다
export function EntityAvatar({
  name,
  src,
  tint,
  size = 48,
}: {
  name: string;
  src?: string | null;
  tint: string;
  size?: keyof typeof SIZE;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        unoptimized
        // 작은 원은 1위 히어로 사진(LCP)과 대역폭을 다투지 않게 뒤로 미룬다
        fetchPriority="low"
        className={`${SIZE[size]} shrink-0 rounded-full bg-fill-weak object-cover object-[50%_20%]`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`${SIZE[size]} flex shrink-0 items-center justify-center rounded-full font-bold text-on-tint`}
      style={{ backgroundColor: tint }}
    >
      {initials(name)}
    </span>
  );
}
