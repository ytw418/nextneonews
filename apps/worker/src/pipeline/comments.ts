import { prisma } from "@kmedia/db";

import { log } from "../log";

// 신고로 숨겨진 댓글 보기·되살리기 (웹은 서로 다른 3명이 신고하면 자동으로 숨긴다)
export async function listHiddenComments(): Promise<void> {
  const rows = await prisma.comment.findMany({
    where: { status: "HIDDEN" },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: { id: true, nickname: true, body: true, reportCount: true, articleId: true },
  });
  if (rows.length === 0) log.info("comments: no hidden comments");
  for (const c of rows) {
    log.info(`hidden ${c.id} (reports ${c.reportCount}) ${c.nickname}: ${c.body.slice(0, 120)}`, { articleId: c.articleId });
  }
}

export async function restoreComments(ids: string[]): Promise<void> {
  const [, { count }] = await prisma.$transaction([
    prisma.commentReport.deleteMany({ where: { commentId: { in: ids } } }),
    prisma.comment.updateMany({ where: { id: { in: ids }, status: "HIDDEN" }, data: { status: "VISIBLE", reportCount: 0 } }),
  ]);
  log.info("comments: restored", { count });
}
