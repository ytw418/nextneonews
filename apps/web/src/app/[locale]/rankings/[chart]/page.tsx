import { isLocale } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { chartMetadata, ChartView } from "@/components/rankings/ChartView";
import { CHART_IDS, getLatestSnapshot, isChartId } from "@/lib/rankings";

// 랭킹은 매일 05:00 KST 에 새로 나온다. 한 시간마다 다시 만든다 (worker 가 revalidate 로 바로 부를 수도 있다)
export const revalidate = 3600;
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
