import * as cheerio from "cheerio";

import { USER_AGENT } from "../collectors/http";
import { assertRobotsAllowed } from "../collectors/robots";

// CU 상품 목록 (cu.bgfretail.com, robots.txt 없음 = 허용). 화면이 부르는 AJAX 를 그대로 쓴다.
// 분류마다 첫 쪽(40개)을 받아 이름·가격·이미지·NEW/BEST·1+1 을 읽는다
const LIST = "https://cu.bgfretail.com/product/productAjax.do";
const CATEGORIES: Record<string, string> = {
  "10": "간편식사",
  "20": "즉석조리",
  "30": "과자류",
  "40": "아이스크림",
  "50": "식품",
  "60": "음료",
  "70": "생활용품",
};

export interface CollectedProduct {
  id: string;
  source: string;
  name: string;
  price: number | null;
  imageUrl: string | null;
  url: string;
  category: string;
  tags: string[];
}

async function page(code: string): Promise<string> {
  await assertRobotsAllowed(LIST, USER_AGENT);
  const body = new URLSearchParams({
    pageIndex: "1",
    searchMainCategory: code,
    codeParent: code,
    listType: "0",
    searchCondition: "setA",
    searchUseYn: "N",
    gdIdx: "0",
  });
  const res = await fetch(LIST, {
    method: "POST",
    headers: {
      "user-agent": USER_AGENT,
      "content-type": "application/x-www-form-urlencoded",
      referer: "https://cu.bgfretail.com/product/product.do?category=product&depth2=4",
    },
    body,
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`cu ${code} -> ${res.status}`);
  return res.text();
}

export async function collectCu(): Promise<CollectedProduct[]> {
  const products: CollectedProduct[] = [];
  for (const [code, category] of Object.entries(CATEGORIES)) {
    const $ = cheerio.load(await page(code));
    $("li.prod_list").each((_, li) => {
      const id = $(li).find(".prod_img[onclick]").attr("onclick")?.match(/view\((\d+)\)/)?.[1];
      const name = $(li).find(".name p").first().text().trim();
      if (!id || !name) return;
      const price = Number($(li).find(".price strong").first().text().replace(/[^0-9]/g, "")) || null;
      const src = $(li).find("img.prod_img").attr("src");
      const tags = [
        ...$(li)
          .find(".tag span")
          .map((_, el) => $(el).attr("class") ?? "")
          .get(),
        ...$(li)
          .find(".badge span")
          .map((_, el) => ({ plus1: "1+1", plus2: "2+1" })[$(el).attr("class") ?? ""] ?? "")
          .get(),
      ].filter(Boolean);
      products.push({
        id: `cu:${id}`,
        source: "cu",
        name,
        price,
        imageUrl: src ? (src.startsWith("//") ? `https:${src}` : src) : null,
        url: `https://cu.bgfretail.com/product/view.do?category=product&gdIdx=${id}`,
        category,
        tags,
      });
    });
  }
  return products;
}
