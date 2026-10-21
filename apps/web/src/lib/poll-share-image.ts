// 투표 결과 공유 카드 (인스타 스토리 9:16). 서버(next/og)는 한중일 글꼴을 싣지 않아서
// 브라우저 캔버스로 그린다 — 질문·보기가 어느 언어든 기기 글꼴로 나온다. 색은 공유 이미지(opengraph-image)와 같은 팔레트

const W = 1080;
const H = 1920;
const PAD = 96;
const TINT = "#f6dcef";
const INK = "#1b1520";
const INK_SUB = "rgba(27, 21, 32, 0.72)";
const TRACK = "rgba(27, 21, 32, 0.10)";
const CHERRY = "#ff2488";

export interface PollShareCard {
  question: string;
  options: { label: string; percent: number; mine: boolean }[];
  mineLabel: string; // '내 선택'
  topPick?: string; // '한국어 독자 1위: … · 전체 1위: …'
  total: string; // '총 120표'
  cta: string; // '너는 어느 쪽? 투표하러 가기'
  domain: string;
}

// 띄어쓰기가 있으면 단어 단위, 없는 언어(한중일)는 글자 단위로 줄을 나눈다. maxLines 를 넘으면 … 로 자른다
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number, maxLines: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const ch of Array.from(text)) {
    const next = line + ch;
    if (ctx.measureText(next).width <= width || !line) {
      line = next;
      continue;
    }
    const space = line.lastIndexOf(" ");
    if (ch !== " " && space > 0) {
      lines.push(line.slice(0, space));
      line = line.slice(space + 1) + ch;
    } else {
      lines.push(line);
      line = ch === " " ? "" : ch;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last && ctx.measureText(`${last}…`).width > width) last = last.slice(0, -1);
  kept[maxLines - 1] = `${last}…`;
  return kept;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(r, h / 2, w / 2));
  ctx.fill();
}

export async function pollShareImage(card: PollShareCard): Promise<Blob | null> {
  await document.fonts?.ready;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const family = getComputedStyle(document.body).fontFamily || "sans-serif";
  const font = (weight: number, px: number) => `${weight} ${px}px ${family}`;
  const inner = W - PAD * 2;

  ctx.fillStyle = TINT;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = "top";

  // 머리: Unnie. NOTE
  ctx.fillStyle = INK;
  ctx.font = font(700, 52);
  ctx.fillText("Unnie", PAD, 140);
  const unnie = ctx.measureText("Unnie").width;
  ctx.fillStyle = CHERRY;
  ctx.fillText(".", PAD + unnie, 140);
  ctx.fillStyle = INK_SUB;
  ctx.font = font(500, 32);
  ctx.letterSpacing = "8px";
  ctx.fillText("NOTE", PAD + unnie + 40, 154);
  ctx.letterSpacing = "0px";

  // 질문
  let y = 300;
  ctx.fillStyle = INK;
  ctx.font = font(700, 76);
  for (const l of wrap(ctx, card.question, inner, 4)) {
    ctx.fillText(l, PAD, y);
    y += 96;
  }
  y += 56;

  // 보기 막대: 내 선택은 체리색, 나머지는 옅은 잉크
  for (const o of card.options.slice(0, 5)) {
    ctx.font = font(o.mine ? 700 : 500, 44);
    ctx.fillStyle = INK;
    const pct = `${o.percent}%`;
    const pctW = ctx.measureText(pct).width;
    const label = wrap(ctx, o.label, inner - pctW - 32, 1)[0] ?? "";
    ctx.fillText(label, PAD, y);
    ctx.fillText(pct, W - PAD - pctW, y);
    if (o.mine) {
      const lw = ctx.measureText(label).width;
      ctx.font = font(700, 30);
      const tag = card.mineLabel;
      const tw = ctx.measureText(tag).width + 32;
      if (PAD + lw + 20 + tw < W - PAD - pctW - 16) {
        ctx.fillStyle = CHERRY;
        roundRect(ctx, PAD + lw + 20, y + 4, tw, 48, 24);
        ctx.fillStyle = "#fff";
        ctx.fillText(tag, PAD + lw + 36, y + 13);
      }
    }
    y += 72;
    ctx.fillStyle = TRACK;
    roundRect(ctx, PAD, y, inner, 28, 14);
    ctx.fillStyle = o.mine ? CHERRY : "rgba(27, 21, 32, 0.38)";
    if (o.percent > 0) roundRect(ctx, PAD, y, Math.max(28, (inner * o.percent) / 100), 28, 14);
    y += 28 + 64;
  }

  // 언어별 1위 · 총 표 수
  ctx.fillStyle = INK_SUB;
  ctx.font = font(600, 36);
  if (card.topPick) {
    for (const l of wrap(ctx, card.topPick, inner, 2)) {
      ctx.fillText(l, PAD, y);
      y += 50;
    }
  }
  ctx.font = font(500, 36);
  ctx.fillText(card.total, PAD, y + 8);

  // 바닥: 참여 유도 + 주소
  ctx.fillStyle = INK;
  ctx.font = font(700, 48);
  const ctaLines = wrap(ctx, card.cta, inner, 2);
  let by = H - 200 - ctaLines.length * 64;
  for (const l of ctaLines) {
    ctx.fillText(l, PAD, by);
    by += 64;
  }
  ctx.fillStyle = CHERRY;
  ctx.font = font(700, 40);
  ctx.fillText(card.domain, PAD, H - 170);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
