import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { z } from "zod";

import { isLocale, type Locale } from "@kmedia/core";
import { anonymousId, displayNickname } from "@kmedia/core/nickname";
import { type Comment, prisma } from "@kmedia/db";

// 로그인 없는 익명 댓글 (docs/PRD.md): 비밀번호로 수정·삭제, 닉네임 옆에는 IP 대신 IP 해시 4자리.

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

export const BODY_MAX = 1000;
const NICKNAME_MAX = 12;
// 같은 사람(IP 해시)이 10분에 5개까지
const RATE_WINDOW_MS = 10 * 60_000;
const RATE_MAX = 5;
// 신고가 이만큼 쌓이면 자동으로 숨긴다
const HIDE_AFTER_REPORTS = 3;
// 광고 도배는 거의 다 링크라 링크가 든 댓글은 받지 않는다
const LINK = /https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|kr|jp|cn|ru|xyz|top|link|shop)\b/i;

function secret(): string {
  const value = process.env.COMMENT_HASH_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") throw new Error("COMMENT_HASH_SECRET is not set");
  return "dev-only-secret";
}

// Vercel 은 실제 접속 IP 를 x-real-ip 에 넣는다
export function clientIp(headers: Headers): string {
  return headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
}

// 글과 상관없이 같은 사람인지(도배 제한용)만 알 수 있는 해시. IP 는 저장하지 않는다
function ipHash(ip: string): string {
  return createHmac("sha256", secret()).update(`ip:${ip}`).digest("hex").slice(0, 16);
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 32);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

export const CreateInput = z.object({
  articleId: z.string().min(1).max(40),
  locale: z.string().refine(isLocale),
  nickname: z.string().trim().max(NICKNAME_MAX).optional(),
  password: z.string().min(4).max(64),
  body: z.string().trim().min(1).max(BODY_MAX),
  website: z.string().optional(), // 사람에게는 안 보이는 칸. 채워져 있으면 봇이다
});

export const PasswordInput = z.object({ password: z.string().min(1).max(64) });
export const EditInput = PasswordInput.extend({ body: z.string().trim().min(1).max(BODY_MAX) });

export type CommentError = "invalid" | "links" | "tooFast" | "notFound" | "wrongPassword";

export const ERROR_STATUS: Record<CommentError, number> = {
  invalid: 400,
  links: 422,
  tooFast: 429,
  notFound: 404,
  wrongPassword: 403,
};

export interface PublicComment {
  id: string;
  nickname: string;
  idHash: string;
  locale: string;
  body: string;
  createdAt: string;
  edited: boolean;
}

function toPublic(c: Comment): PublicComment {
  return {
    id: c.id,
    nickname: c.nickname,
    idHash: c.idHash,
    locale: c.locale,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
    edited: c.updatedAt.getTime() - c.createdAt.getTime() > 1000,
  };
}

export async function listComments(articleId: string): Promise<PublicComment[]> {
  const rows = await prisma.comment.findMany({
    where: { articleId, status: "VISIBLE" },
    orderBy: { createdAt: "asc" },
    take: 300,
  });
  return rows.map(toPublic);
}

export async function createComment(
  input: z.infer<typeof CreateInput>,
  ip: string,
): Promise<{ ok: true; comment: PublicComment } | { ok: false; error: CommentError }> {
  if (input.website) return { ok: false, error: "invalid" };
  if (LINK.test(input.body) || (input.nickname && LINK.test(input.nickname))) return { ok: false, error: "links" };

  const article = await prisma.article.findFirst({
    where: { id: input.articleId, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!article) return { ok: false, error: "notFound" };

  const hash = ipHash(ip);
  const recent = await prisma.comment.count({
    where: { ipHash: hash, createdAt: { gte: new Date(Date.now() - RATE_WINDOW_MS) } },
  });
  if (recent >= RATE_MAX) return { ok: false, error: "tooFast" };

  const key = secret();
  const comment = await prisma.comment.create({
    data: {
      articleId: article.id,
      locale: input.locale,
      // "名無しさん(7f3a)": 같은 글 안에서만 같은 사람끼리 구분된다
      nickname: displayNickname({ nickname: input.nickname, ip, articleId: article.id, locale: input.locale as Locale }, key),
      idHash: anonymousId(ip, article.id, key),
      ipHash: hash,
      passwordHash: await hashPassword(input.password),
      body: input.body,
    },
  });
  return { ok: true, comment: toPublic(comment) };
}

async function authorize(id: string, password: string): Promise<Comment | CommentError> {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment || comment.status !== "VISIBLE") return "notFound";
  return (await verifyPassword(password, comment.passwordHash)) ? comment : "wrongPassword";
}

export async function editComment(id: string, input: z.infer<typeof EditInput>) {
  if (LINK.test(input.body)) return { ok: false as const, error: "links" as const };
  const found = await authorize(id, input.password);
  if (typeof found === "string") return { ok: false as const, error: found };
  const comment = await prisma.comment.update({ where: { id: found.id }, data: { body: input.body } });
  return { ok: true as const, comment: toPublic(comment) };
}

export async function deleteComment(id: string, password: string) {
  const found = await authorize(id, password);
  if (typeof found === "string") return { ok: false as const, error: found };
  await prisma.comment.delete({ where: { id: found.id } });
  return { ok: true as const };
}

export async function reportComment(id: string): Promise<boolean> {
  const { count } = await prisma.comment.updateMany({
    where: { id, status: "VISIBLE" },
    data: { reportCount: { increment: 1 } },
  });
  if (count === 0) return false;
  await prisma.comment.updateMany({
    where: { id, reportCount: { gte: HIDE_AFTER_REPORTS } },
    data: { status: "HIDDEN" },
  });
  return true;
}
