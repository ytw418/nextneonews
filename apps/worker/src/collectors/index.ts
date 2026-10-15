import { naverEntertainCollector } from "./naverEntertain";
import { pannCollector } from "./pann";
import type { Collector } from "./types";

export const collectors: Record<string, Collector> = {
  [naverEntertainCollector.name]: naverEntertainCollector,
  [pannCollector.name]: pannCollector,
};
