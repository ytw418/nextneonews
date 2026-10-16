export interface SignalMetrics {
  rank?: number; // 순위가 있는 목록만 (구글 트렌드). 더쿠 HOT 은 최신순이라 순위가 아니다
  views?: number;
  comments?: number;
  likes?: number;
  // 더쿠: 게시판(mid)·말머리·글 시각(ISO)
  mid?: string;
  cate?: string;
  postedAt?: string;
  // 저장할 때 붙인다 (store.ts): 6시간 안의 직전 조회 수·시각과 시간당 조회 증가
  prevViews?: number;
  prevAt?: string;
  velocity?: number;
}

// 수집기는 제목·링크·숫자만 넘긴다. 본문·이미지·닉네임은 저장하지 않는다 (docs/PRD.md 5장).
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
