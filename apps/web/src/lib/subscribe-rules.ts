// 이메일 한 칸(SubscribeBox → POST /api/subscribe) 규칙. 화면과 서버가 같이 쓴다 — 서버 코드(prisma)는 lib/subscribe.ts

export const SUBSCRIBE_SOURCES = ["saved", "quiz"] as const;
export type SubscribeSource = (typeof SUBSCRIBE_SOURCES)[number];

// 동의할 때 보여 준 처리방침 판. 이메일 항목 문구(privacy 페이지·Trust/pages)를 바꾸면 privacy 의 UPDATED 와 같이 올린다
export const CONSENT_VERSION = "2026-10-21";

const EMAIL_MAX = 254;
// 모양만 본다 (공백·제어 문자 없음, @ 하나, 점 있는 도메인). 진짜 있는 주소인지는 확인 메일이 맡는다.
// 제어 문자: 널 문자(\u0000)는 Postgres 가 못 받아 500 이 난다 (lib/api-guard.ts 와 같은 이유)
const EMAIL = /^[^\s@\u0000-\u001f\u007f]+@[^\s@.\u0000-\u001f\u007f]+(?:\.[^\s@.\u0000-\u001f\u007f]+)+$/;

// 앞뒤 공백을 떼고 소문자로 맞춘 주소, 모양이 틀리면 null
export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  return email.length <= EMAIL_MAX && EMAIL.test(email) ? email : null;
}
