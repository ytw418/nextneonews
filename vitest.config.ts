import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // web 은 DB·Next 없이 도는 순수 함수만 테스트한다 (lib/next-article.test.ts)
    // mobile 은 RN 없이 도는 lib 의 순수 함수만 (링크 분류·웹뷰 메시지·언어 목록 복사본)
    include: [
      "packages/*/src/**/*.test.ts",
      "apps/worker/src/**/*.test.ts",
      "apps/web/src/lib/**/*.test.ts",
      "mobile/src/lib/**/*.test.ts",
    ],
  },
});
