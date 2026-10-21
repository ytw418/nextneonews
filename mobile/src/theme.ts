// 웹 globals.css 와 같은 색 (밝은·어두운 화면). 네이티브 화면이 웹뷰와 같은 사이트처럼 보이게
export const COLORS = {
  light: { bg: "#ffffff", band: "#f4f4f6", line: "#eeeef0", ink900: "#121214", ink600: "#6b6b74", brand: "#e0137a", brandInk: "#d1106e" },
  dark: { bg: "#111113", band: "#1c1c1f", line: "#2c2c31", ink900: "#f4f4f5", ink600: "#a1a1aa", brand: "#e0137a", brandInk: "#ff6fb1" },
} as const;

export type Palette = (typeof COLORS)["light"];
