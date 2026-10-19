import { isLocale } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { chartMetadata, ChartView } from "@/components/rankings/ChartView";
import { CHART_IDS, getLatestSnapshot, isChartId } from "@/lib/rankings";

// 랭킹은 매일 05:00 KST 에 새로 나온다. 시간 기반으로는 다시 만들지 않고, 랭킹을 만든 직후 worker 가 비우고 바로 다시 요청한다 (refresh day)
export const revalidate = false;
export const dynamicParams = false;

export function generateStaticParams() {
  return CHART_IDS.map((chart) => ({ chart }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/rankings/[chart]">): Promise<Metadata> {
  const { locale, chart } = await params;
  if (!isLocale(locale) || !isChartId(chart)) return {};
  return chartMetadata(locale, chart, await getLatestSnapshot(chart));
}

// 최신 차트 (kpop · actors · kdrama · fan-pick)
export default async function ChartPage({ params }: PageProps<"/[locale]/rankings/[chart]">) {
  const { locale, chart } = await params;
  if (!isLocale(locale) || !isChartId(chart)) notFound();
  setRequestLocale(locale);
  return <ChartView locale={locale} chart={chart} snapshot={await getLatestSnapshot(chart)} />;
}
