import { describe, expect, it } from "vitest";

import { buildIcs } from "./schedule";
import { eventMatches, eventState, findEvent, type UpcomingEvent } from "./upcoming";

const at = (iso: string) => new Date(iso);
const opts = { url: "https://example.com/en/schedule/x", host: "example.com", lines: [], dtstamp: at("2026-10-16T00:00:00Z") };

describe("일정", () => {
  it("eventState 는 KST 자정을 기준으로 오늘·진행 중·끝남을 가른다", () => {
    const e = { start: "2026-11-20", end: "2026-11-21" };
    expect(eventState(e, at("2026-11-19T23:59:00+09:00"))).toMatchObject({ state: "upcoming", days: 1 });
    expect(eventState(e, at("2026-11-20T00:00:00+09:00"))).toMatchObject({ state: "today", dayIndex: 1 });
    // 이틀째는 '오늘'이 아니라 '진행 중'
    expect(eventState(e, at("2026-11-21T00:01:00+09:00"))).toMatchObject({ state: "ongoing", dayIndex: 2, totalDays: 2 });
    expect(eventState(e, at("2026-11-22T00:00:00+09:00"))).toMatchObject({ state: "ended" });
  });

  it("짧은 대문자 키워드는 단어로만 맞춘다", () => {
    const e = { keywords: ["MMA", "멜론뮤직어워드"] };
    expect(eventMatches(e, "MMA 2026 lineup")).toBe(true);
    expect(eventMatches(e, "Emma Stone")).toBe(false);
  });

  it("하루 종일 일정은 DATE 로, 끝 날짜는 다음 날로 쓴다", () => {
    const ics = buildIcs(findEvent("mama-2026") as UpcomingEvent, "en", opts);
    expect(ics).toContain("DTSTART;VALUE=DATE:20261120\r\n");
    expect(ics).toContain("DTEND;VALUE=DATE:20261122\r\n");
  });

  it("시각이 있는 여러 날 일정은 UTC 시작에 매일 반복을 단다", () => {
    const ics = buildIcs(findEvent("aaa-2026") as UpcomingEvent, "en", opts);
    expect(ics).toContain("DTSTART:20261205T090000Z\r\n");
    expect(ics).toContain("RRULE:FREQ=DAILY;COUNT=2\r\n");
    expect(ics).not.toContain("DTEND");
  });
});
