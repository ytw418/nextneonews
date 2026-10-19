import { describe, expect, it, vi } from "vitest";

vi.mock("@kmedia/db", () => ({ prisma: {} }));

const { isDbUnavailable } = await import("./item-votes");

// Prisma(pg 어댑터)가 Postgres 오류를 넘기는 모양: code 는 P2039·P2010, 원래 SQLSTATE 는 meta 안쪽
const postgresError = (code: string, sqlState: string) => ({
  code,
  meta: { driverAdapterError: { cause: { originalCode: sqlState } } },
});

describe("DB 를 못 쓰는 오류 판정", () => {
  it("Neon 사용량 한도 초과(53000)는 DB 없음으로 보고, 같은 P2039 라도 쿼리 오류는 숨기지 않는다", () => {
    expect(isDbUnavailable(postgresError("P2039", "53000"))).toBe(true);
    expect(isDbUnavailable(postgresError("P2010", "53000"))).toBe(true); // $queryRaw 로 집계할 때
    expect(isDbUnavailable(postgresError("P2039", "22021"))).toBe(false); // 널 문자 같은 진짜 오류
  });
});
