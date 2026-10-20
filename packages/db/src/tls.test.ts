import { describe, expect, it } from "vitest";

import { pgConnectionConfig, SUPABASE_ROOT_2021_CA } from "./tls";

describe("pgConnectionConfig", () => {
  it("Supabase 주소는 sslmode 를 빼고 루트 인증서로 검증한다, 다른 주소는 그대로", () => {
    const supa = pgConnectionConfig("postgres://u:p@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x");
    expect(supa.connectionString).not.toContain("sslmode");
    expect(supa.connectionString).toContain("supa=base-pooler.x");
    expect(supa.ssl).toEqual({ ca: SUPABASE_ROOT_2021_CA, rejectUnauthorized: true });

    const neon = "postgres://u:p@ep-x-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
    expect(pgConnectionConfig(neon)).toEqual({ connectionString: neon });
  });
});
