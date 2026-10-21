import type { PostHog, PostHogConfig } from "posthog-js";

// PostHog 는 첫 화면 자바스크립트에 싣지 않는다 (posthog-js 원본 318KB·gzip 103KB, 첫 JS 의 36%, docs/predeploy/perf.md).
// instrumentation-client.ts 가 페이지를 다 받은 뒤 쉬는 틈에 import() 로 받아 init 하고,
// 그 전에 track() 이 보낸 이벤트와 난 에러는 모아 뒀다가 init 직후 순서대로 넘긴다.
// 이 모듈은 posthog-js 를 타입으로만 가져온다 — 정적으로 가져오면 다시 모든 화면의 첫 JS 에 실린다

type Params = Record<string, string | number | boolean>;
type Send = (posthog: PostHog) => void;

// 너무 오래 쌓이지 않게 (스크롤·피드 이벤트가 몰려도 이만큼만 모은다)
const MAX_PENDING = 50;
// 한 탭에서 보내는 에러는 같은 것은 한 번, 모두 합쳐 이만큼만. 렌더·타이머가 같은 에러를 되풀이해도
// 에러 추적 무료 한도(월 10만 건)를 갉아먹지 않는다
const MAX_ERRORS = 10;

let client: PostHog | null = null;
// null = PostHog 를 쓰지 않는다(토큰 없는 로컬·미리보기) 또는 받기에 실패했다 → 모으지 않고 버린다
let pending: Send[] | null = null;
const sentErrors = new Set<string>();

// 운영자 기기 표시. 주소 끝에 ?internal=1 을 붙여 한 번 열면 그 브라우저는 분석을 보내지 않고, ?internal=0 이면 다시 보낸다.
// 쿠키 없는 모드라 PostHog 쪽에서는 내부 접속을 가를 수 없어서(Direct 1인당 쪽수가 부풀었다, 브리핑 10/21) 받기 전에 끊는다
const INTERNAL_KEY = "un_internal";

export function isInternalVisit(search: string, storage: Pick<Storage, "getItem" | "setItem" | "removeItem">): boolean {
  const flag = new URLSearchParams(search).get("internal");
  if (flag === "1") storage.setItem(INTERNAL_KEY, "1");
  else if (flag === "0") storage.removeItem(INTERNAL_KEY);
  return storage.getItem(INTERNAL_KEY) === "1";
}

// 없는 옛 청크(/_next/…)를 요청한 봇·오래된 탭에 404 화면이 뜨면 그 주소로 페이지뷰가 잡힌다. 사람 방문이 아니라 버린다
export function isAssetPath(pathname: string): boolean {
  return pathname.startsWith("/_next/");
}

// init 전이면 모아 두고, init 뒤면 바로 보낸다
export function capturePosthog(name: string, params?: Params): void {
  if (client) client.capture(name, params);
  else if (pending && pending.length < MAX_PENDING) pending.push((posthog) => posthog.capture(name, params));
}

// 스택에 우리 번들(/_next/ 아래)이 없는 에러는 광고·분석 스크립트 안에서 난 것이라 우리가 고칠 수 없다
function fromOurCode(error: unknown): boolean {
  return !(error instanceof Error) || !error.stack || error.stack.includes("/_next/");
}

// PostHog 에러 추적($exception)으로 보낸다. 잡히지 않은 에러는 instrumentation-client.ts 가, 에러 화면이 잡은 렌더 에러는
// captureBoundaryError 가 넘긴다. 서버 에러는 instrumentation.ts 가 따로 보낸다
export function captureErrorPosthog(error: unknown): void {
  if ((!client && !pending) || !fromOurCode(error)) return;
  const key = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  if (sentErrors.has(key) || sentErrors.size >= MAX_ERRORS) return;
  sentErrors.add(key);
  if (client) client.captureException(error);
  else pending?.push((posthog) => posthog.captureException(error));
}

// error.tsx·global-error.tsx 가 잡은 에러. Next 는 에러 화면이 잡은 에러를 콘솔에만 찍고 window 로 올리지 않아서 따로 보낸다.
// 서버에서 난 에러(digest 가 붙어 온다)는 instrumentation.ts 가 이미 보냈다
export function captureBoundaryError(error: Error & { digest?: string }): void {
  if (!error.digest) captureErrorPosthog(error);
}

// 토큰이 있을 때 instrumentation-client.ts 가 하이드레이션 전에 한 번 부른다: 이벤트를 모으기 시작하고, start 가 정한 때에 받는다
export function loadPosthog(key: string, config: Partial<PostHogConfig>, start: (load: () => void) => void): void {
  pending = [];
  start(() => {
    import("posthog-js")
      .then(({ default: posthog }) => {
        posthog.init(key, config);
        client = posthog;
        for (const send of pending ?? []) send(posthog);
      })
      .catch(() => {
        // 광고 차단기·네트워크 실패: 분석 없이 그대로 둔다
      })
      .finally(() => {
        pending = null;
      });
  });
}
