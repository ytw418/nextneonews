// GEO 측정용 목표 질문. 독자가 AI 에게 실제로 물을 법한 질문을 언어별로 둔다 (docs/keywords.md 에서 뽑음).
// 같은 질문을 주기적으로 다시 돌려 인용 변화를 본다 — 질문 문구를 자주 바꾸지 않는다.
export const GEO_QUESTIONS: { locale: string; question: string }[] = [
  { locale: "ja", question: "韓国のコンサートチケットを外国人が買う方法は？NOL Worldの使い方を教えて" },
  { locale: "ja", question: "MAMA AWARDS 2026 大阪の日程とチケット情報は？" },
  { locale: "ja", question: "チ・チャンウクの新ドラマ『メリーベリーラブ』はどこで見られる？" },
  { locale: "zh-TW", question: "2026 AAA 高雄 什麼時候？要怎麼買票？" },
  { locale: "zh-TW", question: "台灣人申請韓國打工度假的條件和截止日期是什麼？" },
  { locale: "en", question: "How can foreigners buy K-pop concert tickets in Korea without a Korean phone number?" },
  { locale: "en", question: "What should I buy at a Korean convenience store in 2026?" },
  { locale: "en", question: "Ji Chang-wook Merry Berry Love Disney+ ranking" },
];
