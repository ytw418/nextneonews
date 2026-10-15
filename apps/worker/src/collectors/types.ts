export interface SignalMetrics {
  rank?: number;
  views?: number;
  comments?: number;
  likes?: number;
}

// 수집기는 제목·링크·숫자만 넘긴다. 본문은 저장하지 않는다 (docs/PRD.md 5.1).
export interface CollectedSignal {
  source: string;
  externalId: string;
  title: string;
  url: string;
  lang: string;
  metrics: SignalMetrics;
}

export interface Collector {
  name: string;
  collect(): Promise<CollectedSignal[]>;
}
