import { isLocale } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { chartMetadata, ChartView } from "@/components/rankings/ChartView";
import { getWeeklySnapshot, isChartId, isWeekPeriod } from "@/lib/rankings";

// 주간 고정본은 발행 뒤 바뀌지 않는다 (정정이 붙으면 그 주소를 비운다)
export const revalidate = false;

// 주간 고정본만 (YYYY-Www). 매일판 아카이브는 만들지 않는다 — 얇은 페이지가 대량으로 생긴다.
// 빌드 때 만들지 않고 첫 요청 때 만든 뒤 캐시한다
export function generateStaticParams() {
  return [];
}

async function load(chart: string, period: string) {
  if (!isChartId(chart) || !isWeekPeriod(period)) return null;
  return getWeeklySnapshot(chart, period);
}

export async function generateMetadata({ params }: PageProps<"/[locale]/rankings/[chart]/[period]">): Promise<Metadata> {
  const { locale, chart, period } = await params;
  const snapshot = await load(chart, period);
  if (!isLocale(locale) || !snapshot) return {};
  return chartMetadata(locale, snapshot.chart, snapshot, period);
}

// 주간 아카이브: 월요일에 지난주 차트를 고정해 둔 것. 발행 뒤에는 고치지 않고 정정(correction)만 단다
export default async function WeeklyChartPage({ params }: PageProps<"/[locale]/rankings/[chart]/[period]">) {
  const { locale, chart, period } = await params;
  const snapshot = await load(chart, period);
  if (!isLocale(locale) || !snapshot) notFound();
  setRequestLocale(locale);
  return <ChartView locale={locale} chart={snapshot.chart} snapshot={snapshot} archive />;
}
