import { prisma } from "@kmedia/db";

import { log } from "../log";
import { collectCu } from "./cu";

// K-쇼핑 주간 랭킹용 상품 수집 (AI 없음). 처음 본 날(firstSeenAt)로 "이번 주 신상" 을 고른다
export async function collectProducts(): Promise<void> {
  const products = await collectCu();
  const now = new Date();
  for (let i = 0; i < products.length; i += 50) {
    await Promise.all(
      products.slice(i, i + 50).map(({ id, ...p }) =>
        prisma.product.upsert({
          where: { id },
          create: { id, ...p, firstSeenAt: now, lastSeenAt: now },
          update: { name: p.name, price: p.price, imageUrl: p.imageUrl, tags: p.tags, lastSeenAt: now },
        }),
      ),
    );
  }
  const fresh = products.filter((p) => p.tags.includes("new")).length;
  log.info("products: collected", { source: "cu", total: products.length, taggedNew: fresh });
}
