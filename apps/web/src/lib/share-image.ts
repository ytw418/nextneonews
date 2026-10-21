import { useEffect, useRef } from "react";

// 결과 공유 카드 (인스타 스토리 9:16): 투표 결과·테스트 결과. 서버(next/og)는 한중일 글꼴을 싣지 않아서
// 브라우저 캔버스로 그린다 — 어느 언어든 기기 글꼴로 나온다. 색은 공유 이미지(opengraph-image)와 같은 팔레트

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

type Font = (weight: number, px: number) => string;

// 배경·머리(Unnie. NOTE)까지 그린 캔버스와, 바닥(참여 유도 + 주소)을 그리고 PNG 로 굽는 함수
async function startCard(): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; font: Font } | null> {
  await document.fonts?.ready;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const family = getComputedStyle(document.body).fontFamily || "sans-serif";
  const font: Font = (weight, px) => `${weight} ${px}px ${family}`;
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
  return { canvas, ctx, font };
}

function finishCard(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, font: Font, cta: string, domain: string) {
  ctx.fillStyle = INK;
  ctx.font = font(700, 48);
  const ctaLines = wrap(ctx, cta, W - PAD * 2, 2);
  let y = H - 200 - ctaLines.length * 64;
  for (const l of ctaLines) {
    ctx.fillText(l, PAD, y);
    y += 64;
  }
  ctx.fillStyle = CHERRY;
  ctx.font = font(700, 40);
  ctx.fillText(domain, PAD, H - 170);
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
}

export async function pollShareImage(card: PollShareCard): Promise<Blob | null> {
  const start = await startCard();
  if (!start) return null;
  const { canvas, ctx, font } = start;
  const inner = W - PAD * 2;

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
  return finishCard(canvas, ctx, font, card.cta, card.domain);
}

export interface QuizShareCard {
  label: string; // '피부 타입 테스트'
  name: string; // 결과 이름 '건성 피부'
  oneLiner: string;
  icon?: string; // 결과 3D 아이콘 PNG 경로 (/icons3d/cactus.png)
  cta: string; // '나는 건성 피부! 너는? 6문항 피부 타입 테스트'
  domain: string;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function quizShareImage(card: QuizShareCard): Promise<Blob | null> {
  const start = await startCard();
  if (!start) return null;
  const { canvas, ctx, font } = start;
  const inner = W - PAD * 2;

  const icon = card.icon ? await loadImage(card.icon) : null;
  if (icon) ctx.drawImage(icon, (W - 560) / 2, 300, 560, 560);

  let y = 940;
  ctx.fillStyle = INK_SUB;
  ctx.font = font(600, 44);
  ctx.fillText(card.label, PAD, y);
  y += 76;
  ctx.fillStyle = INK;
  ctx.font = font(800, 116);
  for (const l of wrap(ctx, card.name, inner, 2)) {
    ctx.fillText(l, PAD, y);
    y += 136;
  }
  y += 24;
  ctx.fillStyle = INK_SUB;
  ctx.font = font(500, 44);
  for (const l of wrap(ctx, card.oneLiner, inner, 4)) {
    ctx.fillText(l, PAD, y);
    y += 62;
  }
  return finishCard(canvas, ctx, font, card.cta, card.domain);
}

// 결과 카드를 미리 그려 PNG 파일로 들고 있는다. 사파리는 탭한 순간에만 공유 시트를 열어 줘서
// 누른 뒤에 그리면(비동기) 공유가 막힌다. 사진 공유를 못 하는 브라우저면 null 로 남는다 (링크 공유로)
export function useShareImage(key: string, name: string, draw: (() => Promise<Blob | null>) | null | undefined) {
  const file = useRef<File | null>(null);
  useEffect(() => {
    file.current = null;
    if (!draw || typeof navigator.canShare !== "function") return;
    let live = true;
    void draw().then((blob) => {
      if (!live || !blob) return;
      const f = new File([blob], name, { type: "image/png" });
      file.current = navigator.canShare({ files: [f] }) ? f : null;
    });
    return () => {
      live = false;
    };
    // key 가 바뀔 때만 다시 그린다 (draw 는 렌더마다 새 함수)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return file;
}
