import { log } from "../log";

// 최근 글 중 투표가 없는 글에 9개 언어 투표 문구를 붙인다 (글마다 AI 1회, 예산 확인). 지금은 CLI 자리만 있다
export async function backfillPolls(_limit: number): Promise<void> {
  log.info("backfill-polls: not implemented");
}
