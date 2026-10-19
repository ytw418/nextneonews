import type { Locale } from "@kmedia/core";

import type pagesEn from "../../../messages/ns/Clinic/pages/en.json";

export type ClinicPages = typeof pagesEn;

// '병원 고르는 법' 긴 본문은 messages/ns/Clinic/pages/{locale}.json 에 따로 둔다 (Trust/pages 패턴).
// request.ts 가 합치는 Clinic/{locale}.json 은 모든 화면의 클라이언트로 가므로 거기에는 짧은 화면 문구만 둔다
export async function clinicPages(locale: Locale): Promise<ClinicPages> {
  return (await import(`../../../messages/ns/Clinic/pages/${locale}.json`)).default;
}
