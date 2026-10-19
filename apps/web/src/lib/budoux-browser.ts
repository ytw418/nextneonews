// 브라우저 번들에서 budoux 대신 쓰는 모듈 (next.config.ts turbopack.resolveAlias 의 browser 조건).
// 일본어·중국어 사전과 linkedom(약 140KB, 원본 380KB)을 클라이언트로 보내지 않는다.
// 분석기가 없다고(null) 알려서 components/Phrase.tsx 가 글을 그대로 그리게 한다. 서버(RSC·SSR)는 진짜 budoux 를 쓴다
export const loadDefaultJapaneseParser = () => null;
export const loadDefaultSimplifiedChineseParser = () => null;
export const loadDefaultTraditionalChineseParser = () => null;
