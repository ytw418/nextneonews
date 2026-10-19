import type { PostHog, PostHogConfig } from "posthog-js";

// PostHog 는 첫 화면 자바스크립트에 싣지 않는다 (posthog-js 원본 318KB·gzip 103KB, 첫 JS 의 36%, docs/predeploy/perf.md).
// instrumentation-client.ts 가 페이지를 다 받은 뒤 쉬는 틈에 import() 로 받아 init 하고,
// 그 전에 track() 이 보낸 이벤트는 모아 뒀다가 init 직후 순서대로 넘긴다.
// 이 모듈은 posthog-js 를 타입으로만 가져온다 — 정적으로 가져오면 다시 모든 화면의 첫 JS 에 실린다

type Params = Record<string, string | number | boolean>;

// 너무 오래 쌓이지 않게 (스크롤·피드 이벤트가 몰려도 이만큼만 모은다)
const MAX_PENDING = 50;

let client: PostHog | null = null;
// null = PostHog 를 쓰지 않는다(토큰 없는 로컬·미리보기) 또는 받기에 실패했다 → 모으지 않고 버린다
let pending: [string, Params | undefined][] | null = null;

// init 전이면 모아 두고, init 뒤면 바로 보낸다
export function capturePosthog(name: string, params?: Params): void {
  if (client) client.capture(name, params);
  else if (pending && pending.length < MAX_PENDING) pending.push([name, params]);
}

// 토큰이 있을 때 instrumentation-client.ts 가 하이드레이션 전에 한 번 부른다: 이벤트를 모으기 시작하고, start 가 정한 때에 받는다
export function loadPosthog(key: string, config: Partial<PostHogConfig>, start: (load: () => void) => void): void {
  pending = [];
  start(() => {
    import("posthog-js")
      .then(({ default: posthog }) => {
        posthog.init(key, config);
        client = posthog;
        for (const [name, params] of pending ?? []) posthog.capture(name, params);
      })
      .catch(() => {
        // 광고 차단기·네트워크 실패: 분석 없이 그대로 둔다
      })
      .finally(() => {
        pending = null;
      });
  });
}
