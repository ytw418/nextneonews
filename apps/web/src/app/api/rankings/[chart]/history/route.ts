import { SITE_NAME } from "@kmedia/core";
import { type NextRequest, NextResponse } from "next/server";

import { isChartId, isWikiLang, listHistory } from "@/lib/rankings";
import { SITE_URL } from "@/lib/url";

// 공개 데이터 (CC BY 4.0). 다른 사이트·노트북에서 바로 부를 수 있게 CORS 를 열고, CDN 에 한 시간 둔다
const HEADERS = {
  "access-control-allow-origin": "*",
  "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

const MAX_DAYS = 180;
const MAX_TOP = 30;

function int(value: string | null, fallback: number, max: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : fallback;
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

// GET /api/rankings/{chart}/history?days=90&top=30&scope=all&format=json|csv
export async function GET(request: NextRequest, { params }: RouteContext<"/api/rankings/[chart]/history">) {
  const { chart } = await params;
  if (!isChartId(chart)) return NextResponse.json({ error: "unknown chart" }, { status: 404, headers: HEADERS });

  const query = request.nextUrl.searchParams;
  const scope = query.get("scope") ?? "all";
  if (scope !== "all" && !isWikiLang(scope)) {
    return NextResponse.json({ error: "scope must be all or a Wikipedia language code" }, { status: 400, headers: HEADERS });
  }
  const days = int(query.get("days"), 30, MAX_DAYS);
  const top = int(query.get("top"), MAX_TOP, MAX_TOP);

  const snapshots = await listHistory(chart, scope, days);
  const rows = snapshots.map((s) => ({
    period: s.period,
    items: s.items.slice(0, top).map((i) => ({
      rank: i.rank,
      entityId: i.entityId,
      name: i.names.en ?? i.names.ko ?? i.entityId,
      score: i.score,
    })),
  }));

  if (query.get("format") === "csv") {
    const lines = [
      "period,rank,entityId,name,score",
      ...rows.flatMap((d) => d.items.map((i) => [d.period, i.rank, i.entityId, i.name, i.score].map(csvCell).join(","))),
    ];
    return new Response(`${lines.join("\r\n")}\r\n`, {
      headers: {
        ...HEADERS,
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `inline; filename="${chart}-${scope}-history.csv"`,
      },
    });
  }

  return NextResponse.json(
    {
      chart,
      scope,
      method: snapshots.at(-1)?.method ?? "v1",
      license: "CC BY 4.0",
      attribution: `${SITE_NAME} (${SITE_URL})`,
      generatedAt: new Date().toISOString(),
      days: rows,
    },
    { headers: HEADERS },
  );
}
