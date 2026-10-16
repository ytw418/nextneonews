import { describe, expect, it } from "vitest";

import { parseBoard } from "./theqoo";

// 2026-10-16 의 /hot 목록 구조를 줄인 것
const HTML = `<table class="bd_lst bd_tb_lst bd_tb theqoo_board_table"><tbody class="hide_notice">
<tr class="notice nofn"><td class="no"><strong>공지</strong></td><td class="cate"><strong></strong></td>
  <td class="title"><a href="/hot/1383792790"><strong>◤더쿠 이용 규칙◢</strong></a></td><td class="time">20.04.29</td><td class="m_no">38,235,530</td></tr>
<tr class="notice_expand"><td colspan="5">모든 공지 확인하기</td></tr>
<tr><td class="no">163429</td><td class="cate"><span>이슈</span></td>
  <td class="title"><a href="/hot/4377235601">실시간 난리난 공식 시연 장면.twt</a> <a href="/hot/4377235601#4377235601_comment" class="replyNum">69</a></td>
  <td class="time"> 11:07 </td><td class="m_no">3,594</td></tr>
<tr><td class="no">163428</td><td class="cate"><span>유머</span></td>
  <td class="title"><a href="/hot/4377209504">어제 글</a></td><td class="time">10.15</td><td class="m_no">22,507</td></tr>
<tr><td class="no">163427</td><td class="cate"><span>정보</span></td>
  <td class="title"><a href="/hot/2984500576">작년 글</a></td><td class="time">25.11.01</td><td class="m_no">88</td></tr>
</tbody></table>`;

describe("theqoo board", () => {
  it("공지를 빼고 세 가지 시각 형식을 KST 로 읽는다", () => {
    const now = new Date("2026-10-16T03:00:00Z"); // KST 12:00
    const rows = parseBoard(HTML, "hot", now);
    expect(rows.map((r) => r.externalId)).toEqual(["4377235601", "4377209504", "2984500576"]);
    expect(rows[0]).toMatchObject({
      title: "실시간 난리난 공식 시연 장면",
      url: "https://theqoo.net/hot/4377235601",
      metrics: { views: 3594, comments: 69, mid: "hot", cate: "이슈", postedAt: "2026-10-16T02:07:00.000Z" },
    });
    expect(rows[1]!.metrics.postedAt).toBe("2026-10-14T15:00:00.000Z");
    expect(rows[2]!.metrics.postedAt).toBe("2025-10-31T15:00:00.000Z");
  });
});
