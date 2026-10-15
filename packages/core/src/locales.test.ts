import { describe, expect, it } from "vitest";

import { matchLocale } from "./locales";

describe("matchLocale", () => {
  it("브라우저 언어 태그를 사이트 언어로 맞춘다", () => {
    expect(matchLocale("ja-JP")).toBe("ja");
    expect(matchLocale("zh-HK")).toBe("zh-TW");
    expect(matchLocale("zh-Hant-TW")).toBe("zh-TW");
    expect(matchLocale("zh")).toBe("zh-CN");
    expect(matchLocale("ms-MY")).toBe("id");
    expect(matchLocale("ru")).toBe("ru");
    expect(matchLocale("de-DE")).toBeNull();
  });
});
