import { describe, expect, it } from "vitest";

import { normalizeEmail } from "./subscribe-rules";

describe("이메일 칸 주소 검사", () => {
  it("공백·대문자는 맞추고, 모양이 틀린 주소는 받지 않는다", () => {
    expect(normalizeEmail("  Mia.K@Example.COM ")).toBe("mia.k@example.com");
    expect(normalizeEmail("mia@example")).toBeNull(); // 점 없는 도메인
    expect(normalizeEmail("mia @example.com")).toBeNull();
    expect(normalizeEmail("mia@@example.com")).toBeNull();
    expect(normalizeEmail(`${"a".repeat(250)}@x.co`)).toBeNull(); // 254자 넘음
  });
});
