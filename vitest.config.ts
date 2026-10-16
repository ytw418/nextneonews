import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // web 은 DB·Next 없이 도는 순수 함수만 테스트한다 (lib/next-article.test.ts)
    include: ["packages/*/src/**/*.test.ts", "apps/worker/src/**/*.test.ts", "apps/web/src/lib/**/*.test.ts"],
  },
});
