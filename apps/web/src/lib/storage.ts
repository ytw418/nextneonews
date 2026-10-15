// 사파리 사생활 보호 모드·일부 인앱 브라우저는 localStorage 접근 자체가 예외를 던진다. 그래도 페이지는 떠야 한다
export function storageGet(key: string): string | null {
  try {
    return window.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function storageSet(key: string, value: string): void {
  try {
    window.localStorage?.setItem(key, value);
  } catch {
    // 저장 못 해도 기능은 그대로 쓴다
  }
}

// 탭을 닫으면 사라지는 값 (이번 방문에 한 번만 보여 줄 것들)
export function sessionGet(key: string): string | null {
  try {
    return window.sessionStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function sessionSet(key: string, value: string): void {
  try {
    window.sessionStorage?.setItem(key, value);
  } catch {
    // 저장 못 해도 기능은 그대로 쓴다
  }
}
