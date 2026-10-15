import { googleTrendsCollector } from "./googleTrends";
import { theqooCollector } from "./theqoo";
import type { Collector } from "./types";
import { yonhapCollector } from "./yonhap";

// robots.txt 를 지키는 소스만 쓴다 (docs/PRD.md 5장). 네이버 연예·네이트판은 robots.txt 가 막아 뺐다.
export const collectors: Record<string, Collector> = {
  [googleTrendsCollector.name]: googleTrendsCollector,
  [yonhapCollector.name]: yonhapCollector,
  [theqooCollector.name]: theqooCollector,
};
