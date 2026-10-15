import { describe, expect, it } from "vitest";

import { unsupportedNumbers } from "./checks";

describe("unsupportedNumbers", () => {
  it("facts 에 없는 두 자리 이상 숫자만 잡고, 천 단위 콤마 차이는 무시한다", () => {
    const missing = unsupportedNumbers({
      facts: [{ statement: "The concert on 11/20 drew 45000 fans in Osaka." }],
      summary: "About 45,000 fans gathered.",
      body: "It was held on 11/20 and tickets cost 154000 won. Top 3 moments below.",
      faq: [{ q: "When?", a: "On 11/20." }],
    });
    expect(missing).toEqual(["154000"]);
  });
});
