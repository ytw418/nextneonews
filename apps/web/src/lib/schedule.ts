import type { BadgeTone } from "@/components/ui/Badge";

// 일정 화면 전용 얇은 도우미 (번역·CSS 변수가 필요한 것만). 날짜 계산은 @kmedia/core 에 둔다.
// DdayView 는 core 의 eventState() 결과와 같은 모양이다 (state·days 만 쓴다)
export interface DdayView {
  state: "upcoming" | "today" | "ongoing" | "ended";
  days: number; // 시작일까지 남은 날 (KST)
}

// 채운 배지는 오늘·진행 중·D-1~D-7 만. D-8~D-30 은 옅게, 그 뒤와 끝난 일정은 회색
export function ddayTone(view: DdayView): Extract<BadgeTone, "brand" | "brandWeak" | "neutral"> {
  if (view.state === "today" || view.state === "ongoing") return "brand";
  if (view.state === "ended") return "neutral";
  if (view.days <= 7) return "brand";
  if (view.days <= 30) return "brandWeak";
  return "neutral";
}
