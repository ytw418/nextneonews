// 글 entities JSON 한 줄이 이 인물을 가리키는지 (인물 페이지의 관련 글). DB 없이 도는 순수 함수만 둔다 (테스트용)

// 글 entities 한 줄: { id?, name, koreanName }. id(위키데이터 Q-id)는 나중에 쓴 글에만 있다 (worker pipeline/write.ts)
export interface MentionRow {
  id?: unknown;
  name?: unknown;
  koreanName?: unknown;
}

export interface MentionTarget {
  id: string;
  en: string | null;
  ko: string | null;
}

const text = (value: unknown) => (typeof value === "string" ? value.trim().toLowerCase() : "");

// id 가 있으면 id 로만 맞춘다. 없는 옛 글은 영어·한국어 이름으로 맞추되, 한쪽 이름만 같고 다른 쪽이 다르면 동명이인으로 본다
// (예: 영어 이름 'Kim Ji-won' 은 같아도 한국어 이름이 다른 사람)
export function mentionsEntity(row: MentionRow, entity: MentionTarget): boolean {
  if (typeof row.id === "string" && row.id) return row.id === entity.id;
  const name = text(row.name);
  const korean = text(row.koreanName);
  // 글의 name 은 영어 이름, 영어 이름이 없으면 한국어 이름이다
  const en = text(entity.en ?? entity.ko);
  const ko = text(entity.ko);
  const hit = (!!name && name === en) || (!!korean && korean === ko);
  const conflict = (!!name && !!en && name !== en) || (!!korean && !!ko && korean !== ko);
  return hit && !conflict;
}

// 글 entities JSON 전체에서 한 번이라도 이 인물이 나오는지
export function articleMentions(entities: unknown, entity: MentionTarget): boolean {
  return Array.isArray(entities) && entities.some((e) => !!e && typeof e === "object" && mentionsEntity(e as MentionRow, entity));
}
