import { Instrument_Serif } from "next/font/google";

// 웹폰트는 로고(.wordmark) 하나뿐. next/font 가 빌드 때 받아 우리 도메인에서 제공한다 (중국에서도 막히지 않음).
// 레이아웃과 레이아웃 밖 화면(루트 not-found·global-error)이 같은 글꼴을 쓰도록 한 곳에 둔다
export const instrument = Instrument_Serif({
  weight: "400",
  style: ["italic"],
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});
