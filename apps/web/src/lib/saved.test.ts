import { describe, expect, it } from "vitest";

import { decodeSavedShare, encodeSavedShare, SAVED_MAX, type SavedItem, withAdded, withToggled } from "./saved";

const item = (kind: SavedItem["kind"], id: string, at: number): SavedItem => ({ kind, id, at });

describe("저장 목록", () => {
  it("공유 링크는 순서대로 되살리고, 주소에 끼워 넣은 엉터리 항목은 버린다", () => {
    const code = encodeSavedShare([item("beauty", "cosrx-snail-96", 3), item("place", "seongsu-cafe", 2)]);
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeSavedShare(code, 1000)).toEqual([item("beauty", "cosrx-snail-96", 1000), item("place", "seongsu-cafe", 999)]);

    const forged = btoa("drama:ok-one,hack:x,beauty:<script>,clinic:,drama:ok-one").replace(/=+$/, "");
    expect(decodeSavedShare(forged, 10)).toEqual([item("drama", "ok-one", 10)]);
    expect(decodeSavedShare("%%%")).toEqual([]);
  });

  it("하트를 누르면 맨 앞에 넣고 다시 누르면 빼며, 상한을 넘으면 가장 오래된 것부터 뺀다", () => {
    const full = Array.from({ length: SAVED_MAX }, (_, i) => item("article", `a-${i}`, SAVED_MAX - i));
    const added = withToggled(full, "beauty", "new-one", 10_000);
    expect(added.saved).toBe(true);
    expect(added.list).toHaveLength(SAVED_MAX);
    expect(added.list[0]).toEqual(item("beauty", "new-one", 10_000));
    expect(added.list.at(-1)?.id).toBe(`a-${SAVED_MAX - 2}`);

    const removed = withToggled(added.list, "beauty", "new-one", 10_001);
    expect(removed.saved).toBe(false);
    expect(removed.list.some((i) => i.id === "new-one")).toBe(false);
  });

  it("가져오기는 이미 있는 항목을 건너뛰고 새로 더한 수만 센다", () => {
    const mine = [item("beauty", "a1", 5)];
    const { list, added } = withAdded(mine, [item("beauty", "a1", 9), item("drama", "d1", 8), item("drama", "d1", 7)]);
    expect(added).toBe(1);
    expect(list).toEqual([item("drama", "d1", 8), item("beauty", "a1", 5)]);
  });
});
