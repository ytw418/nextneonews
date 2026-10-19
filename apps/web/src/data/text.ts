import "server-only";

function isPlain(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// 언어 파일에 없는 키는 영어로 채운다 (번역이 늦은 항목도 화면이 비지 않게).
// 객체는 키마다 내려가며 합치고, 문자열·배열은 그 언어 값이 있으면 그 값. 빈 문자열은 없는 것으로 본다
export function withFallback<T>(base: T, local: unknown): T {
  if (local === undefined || local === null || local === "") return base;
  if (!isPlain(base) || !isPlain(local)) return local as T;
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(local)) out[key] = withFallback(base[key], value);
  return out as T;
}

// 언어별 문구 파일을 한 번만 읽고 합쳐 둔다 (정적 카탈로그라 서버 프로세스 동안 바뀌지 않는다)
export function textLoader<T>(load: (locale: string) => Promise<{ default: unknown }>) {
  const memo = new Map<string, Promise<T>>();
  return (locale: string): Promise<T> => {
    let text = memo.get(locale);
    if (!text) {
      text = (async () => {
        const en = (await load("en")).default as T;
        return locale === "en" ? en : withFallback(en, (await load(locale)).default);
      })();
      memo.set(locale, text);
    }
    return text;
  };
}
