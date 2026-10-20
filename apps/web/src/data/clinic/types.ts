import type { Icon3d } from "../icons3d";

export type ClinicField = "derma" | "dental" | "plastic";

export const CLINIC_FIELDS: readonly ClinicField[] = ["derma", "dental", "plastic"];

export interface Procedure {
  slug: string;
  field: ClinicField;
  // 공개 통계 출처가 있을 때만
  price?: {
    lowKrw: number;
    highKrw: number;
    unit: "session" | "tooth" | "area" | "procedure";
    asOf: string; // YYYY-MM
    source: string;
  };
  downtimeDays: [number, number];
  sessions?: string;
  painLevel: 1 | 2 | 3;
  durationMin?: [number, number];
  surgical: boolean;
  icon: Icon3d; // 커버 아이콘 (시술 사진은 쓰지 않는다)
  addedAt: string;
  sources: string[]; // 학회·식약처·공공기관·논문 1개 이상
}

export interface ProcedureText {
  name: string;
  aka: string[];
  what: string;
  whoFor: string;
  steps?: string;
  recovery: string;
  risks: string[];
  questionsToAsk: string[];
  aftercare: string[];
  faq: { q: string; a: string }[]; // 3~4
}

// text/{locale}.json 한 파일의 모양
export type ClinicText = {
  fields: Record<ClinicField, { name: string; intro: string }>;
  procedures: Record<string, ProcedureText>;
};
