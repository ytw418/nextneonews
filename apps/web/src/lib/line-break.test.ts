import { describe, expect, it } from "vitest";

import { bindOpeners } from "./line-break";

// 사파리 27 의 keep-all 이 여는 괄호 뒤에서 끊어 괄호가 줄 끝에 남던 문제 (verify-kinsoku-webkit.md)
describe("bindOpeners", () => {
  it("여는 괄호를 뒤 글자와 묶고, 구 끝에 붙은 괄호는 다음 구 앞으로 옮긴다", () => {
    expect(bindOpeners(["ボトックス", "（ボツリヌストキシン）"])).toEqual([
      ["ボトックス"],
      [{ nowrap: "（ボ" }, "ツリヌストキシン）"],
    ]);
    expect(bindOpeners(["淨膚雷射（", "Laser toning）"])).toEqual([["淨膚雷射"], [{ nowrap: "（L" }, "aser toning）"]]);
    expect(bindOpeners(["보톡스(보툴리눔) 「新"])).toEqual([["보톡스", { nowrap: "(보" }, "툴리눔) ", { nowrap: "「新" }]]);
  });
});
