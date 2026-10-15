import { z } from "zod";

import { stripHangulParens } from "./checks";

// 언어 하나 분량의 기사. 작성(write)과 배치 번역(translate)이 같은 모양을 쓴다
const Faq = z.object({ q: z.string(), a: z.string() });
export const Localized = z.object({
  title: z.string(),
  seoTitle: z.string(),
  summary: z.string(),
  keyPoints: z.array(z.string()),
  body: z.string(),
  faq: z.array(Faq),
});
export type Localized = z.infer<typeof Localized>;

// 번역문에 남은 한글 괄호를 지운다 (ko 는 그대로)
export function clean(t: Localized): Localized {
  return {
    title: stripHangulParens(t.title),
    seoTitle: stripHangulParens(t.seoTitle),
    summary: stripHangulParens(t.summary),
    keyPoints: t.keyPoints.map(stripHangulParens),
    body: stripHangulParens(t.body),
    faq: t.faq.map((f) => ({ q: stripHangulParens(f.q), a: stripHangulParens(f.a) })),
  };
}
