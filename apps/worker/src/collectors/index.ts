import { googleTrendsCollector } from "./googleTrends";
import { theqooCollector } from "./theqoo";
import type { Collector } from "./types";
import { yonhapCollector } from "./yonhap";

// robots.txt 와 약관을 지키는 소스만 쓴다 (docs/PRD.md 5장). 네이버 연예·네이트판·디시·인스티즈는 policy.ts 가 요청을 막고,
// 디시·인스티즈 주제는 사람이 `seed-topic` 으로 넣는다 (manualSeed.ts).
export const collectors: Record<string, Collector> = {
  [googleTrendsCollector.name]: googleTrendsCollector,
  [yonhapCollector.name]: yonhapCollector,
  [theqooCollector.name]: theqooCollector,
};
