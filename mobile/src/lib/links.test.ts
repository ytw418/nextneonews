import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { classifyUrl, localeFromPath } from "./links";

const HOSTS = ["unnienote.app", "localhost:3420"];

describe("웹뷰가 가려는 주소 분류", () => {
  it("탭 첫 화면은 네이티브 탭, 그 아래는 웹뷰 안, 사이트 밖은 외부, 메일·일정 파일은 시스템", () => {
    expect(classifyUrl("https://unnienote.app/ja/rankings", HOSTS)).toEqual({ kind: "tab", tab: "rankings" });
    expect(classifyUrl("https://unnienote.app/zh-tw", HOSTS)).toEqual({ kind: "tab", tab: "home" });
    expect(classifyUrl("http://localhost:3420/en/saved/?i=x", HOSTS)).toEqual({ kind: "tab", tab: "saved" });
    expect(classifyUrl("https://unnienote.app/ja/rankings/kpop", HOSTS)).toEqual({ kind: "internal" });
    expect(classifyUrl("https://unnienote.app/en/news/some-story", HOSTS)).toEqual({ kind: "internal" });
    expect(classifyUrl("https://global.oliveyoung.com/product?x=1", HOSTS)).toEqual({ kind: "external" });
    expect(classifyUrl("mailto:hello@unnienote.app", HOSTS)).toEqual({ kind: "system" });
    expect(classifyUrl("https://unnienote.app/api/calendar/ja/fan-meeting", HOSTS)).toEqual({ kind: "system" });
    expect(classifyUrl("https://unnienote.app/ja/feed.xml", HOSTS)).toEqual({ kind: "system" });
    expect(classifyUrl("https://unnienote.app/ko/clinic/laser-toning", HOSTS)).toEqual({ kind: "external" }); // 앱 1판에서 뺀 시술 가이드
    expect(classifyUrl("javascript:alert(1)", HOSTS)).toEqual({ kind: "blocked" });
    expect(classifyUrl("itms-services://?action=download-manifest", HOSTS)).toEqual({ kind: "blocked" });
    expect(localeFromPath("/zh-tw/news/x")).toBe("zh-TW");
    expect(localeFromPath("/news/x")).toBeNull();
  });

  it("언어 목록 복사본이 packages/core 원본과 같다 (머리 주석 한 줄 빼고)", () => {
    const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
    const copy = read("./locales.ts").split("\n").slice(1).join("\n");
    expect(copy).toBe(read("../../../packages/core/src/locales.ts"));
  });
});
