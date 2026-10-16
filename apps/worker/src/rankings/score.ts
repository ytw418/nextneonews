import { type RankingItem, WIKI_LANGS, type WikiLang } from "@kmedia/core";

// 랭킹 점수 (순수 함수, AI 없음). 계산 방법이 바뀌면 METHOD 를 올리고 /rankings/methodology 변경 기록에 적는다
export const METHOD = "v1";

// 랭킹 후보 한 명의 재료. metrics 는 7일 합 — KR_SOURCES, 'wiki:{lang}', 직전 7일 'wiki:{lang}:prev'
export interface Candidate {
  entityId: string;
  names: RankingItem["names"];
  krSignals: number; // 최근 7일 국내 신호 줄 수 (EntityMetric 국내 source 의 날짜×종류)
  wikiTitles: number; // 위키백과 문서가 있는 언어 수
  metrics: Record<string, number>;
}

// 30위 안에서 5계단 이상 오르면 급상승. core RankingItem 에 없는 값이라 여기서 덧붙인다
export type SnapshotItem = RankingItem & { rising: boolean };

const RISING_WITHIN = 30;
const RISING_STEPS = 5;
// 언어별 '뜨는' 목록에 들어갈 최소 7일 조회 수
const LANG_MIN_VIEWS = 500;

const L = (x: number) => Math.log10(1 + Math.max(0, x));
const round1 = (x: number) => Math.round(x * 10) / 10;

// 후보 풀 안에서 0~100 으로 맞춘다. 모두 같으면 값이 있을 때 100, 없을 때 0
function minMax(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => (max > 0 ? 100 : 0));
  return values.map((v) => ((v - min) / (max - min)) * 100);
}

const metric = (c: Candidate, key: string) => c.metrics[key] ?? 0;

// KR(국내 화제) = 0.4·더쿠 조회 + 0.2·더쿠 댓글 + 0.2·트렌드 + 0.2·연합 (성분마다 log 뒤 0~100)
// GL(세계 관심) = 8개 언어 위키 7일 조회를 언어마다 0~100 으로 맞춘 뒤 평균 (영어 위키가 점수를 독점하지 않게)
function axes(cands: Candidate[]): { kr: number; gl: number }[] {
  const part = (key: string) => minMax(cands.map((c) => L(metric(c, key))));
  const views = part("theqoo:views");
  const comments = part("theqoo:comments");
  const trends = part("trends");
  const yonhap = part("yonhap");
  const langs = WIKI_LANGS.map((lang) => part(`wiki:${lang}`));
  return cands.map((_, i) => ({
    kr: 0.4 * views[i]! + 0.2 * comments[i]! + 0.2 * trends[i]! + 0.2 * yonhap[i]!,
    gl: langs.reduce((sum, values) => sum + values[i]!, 0) / langs.length,
  }));
}

// 축이 비면 순위에서 뺀다: 최근 7일 국내 신호가 없거나, 위키 문서·조회가 없으면
function hasBothAxes(c: Candidate): boolean {
  const wikiViews = WIKI_LANGS.reduce((sum, lang) => sum + metric(c, `wiki:${lang}`), 0);
  return c.krSignals > 0 && c.wikiTitles > 0 && wikiViews > 0;
}

// 화면에 보일 원래 숫자만 남긴다 (0 은 뺀다)
function shownMetrics(c: Candidate, keys: string[]): Record<string, number> {
  return Object.fromEntries(keys.map((k) => [k, Math.round(metric(c, k))]).filter(([, v]) => v !== 0));
}

const ALL_KEYS = [
  "theqoo:posts",
  "theqoo:views",
  "theqoo:comments",
  "trends",
  "yonhap",
  ...WIKI_LANGS.map((lang) => `wiki:${lang}`),
];

// 어제(주간판은 지난주) 순위를 붙인다. 없으면 NEW(null)
export function withPrevRank(
  items: Omit<SnapshotItem, "prevRank" | "rising">[],
  prev: Pick<RankingItem, "entityId" | "rank">[] | null,
): SnapshotItem[] {
  const before = new Map((prev ?? []).map((p) => [p.entityId, p.rank]));
  return items.map((item) => {
    const prevRank = before.get(item.entityId) ?? null;
    const rising = prevRank !== null && item.rank <= RISING_WITHIN && prevRank - item.rank >= RISING_STEPS;
    return { ...item, prevRank, rising };
  });
}

// 정렬이 같은 날 다시 돌려도 같도록: 점수 → 보조 값 → id
function byScore<T extends { score: number; tie: number; entityId: string }>(a: T, b: T): number {
  return b.score - a.score || b.tie - a.tie || a.entityId.localeCompare(b.entityId);
}

// 전체(scope all) 순위: 점수 = 0.5·KR + 0.5·GL
export function rankChart(
  cands: Candidate[],
  prev: Pick<RankingItem, "entityId" | "rank">[] | null,
  top = 30,
): SnapshotItem[] {
  const scored = axes(cands).map((a, i) => ({ c: cands[i]!, ...a }));
  const ranked = scored
    .filter(({ c }) => hasBothAxes(c))
    .map(({ c, kr, gl }) => ({ c, kr, gl, score: 0.5 * kr + 0.5 * gl, tie: gl, entityId: c.entityId }))
    .sort(byScore)
    .slice(0, top)
    .map(({ c, kr, gl, score }, i) => ({
      rank: i + 1,
      entityId: c.entityId,
      names: c.names,
      score: round1(score),
      kr: round1(kr),
      gl: round1(gl),
      metrics: shownMetrics(c, ALL_KEYS),
    }));
  return withPrevRank(ranked, prev);
}

// 언어 scope: '이 언어에서 뜨는' 목록. 점수 대신 그 언어 위키의 7일 조회 / 직전 7일 조회(성장률)로 줄 세운다.
// 7일 조회 500 이상이고 실제로 오른 것만 (내려간 인물이 '뜨는' 목록에 보이지 않게)
export function rankRising(
  cands: Candidate[],
  lang: WikiLang,
  prev: Pick<RankingItem, "entityId" | "rank">[] | null,
  top = 10,
): SnapshotItem[] {
  const key = `wiki:${lang}`;
  const all = axes(cands);
  const pool = cands
    .map((c, i) => {
      const views = metric(c, key);
      const before = metric(c, `${key}:prev`);
      return { c, kr: all[i]!.kr, gl: all[i]!.gl, views, before, growth: views / Math.max(before, 1) };
    })
    .filter((x) => x.views >= LANG_MIN_VIEWS && x.growth > 1);
  // 성장률도 log 뒤 0~100 으로 맞춰 점수 자리에 둔다 (화면은 metrics.growth 로 % 를 보인다)
  const growthScores = minMax(pool.map((x) => L(x.growth - 1)));
  const ranked = pool
    .map((x, i) => ({ ...x, score: growthScores[i]!, tie: x.views, entityId: x.c.entityId }))
    .sort(byScore)
    .slice(0, top)
    .map((x, i) => ({
      rank: i + 1,
      entityId: x.c.entityId,
      names: x.c.names,
      score: round1(x.score),
      kr: round1(x.kr),
      gl: round1(x.gl),
      metrics: {
        [key]: Math.round(x.views),
        [`${key}:prev`]: Math.round(x.before),
        growth: Math.round(x.growth * 100) / 100,
      },
    }));
  return withPrevRank(ranked, prev);
}
