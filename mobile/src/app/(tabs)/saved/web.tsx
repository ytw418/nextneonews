import { router, useLocalSearchParams } from "expo-router";

import { SiteWebView } from "../../../components/SiteWebView";
import { SITE_URL } from "../../../config";
import { pageUrl } from "../../../lib/links";
import { openTab } from "../../../navigation";
import { getLocale } from "../../../store/locale";

// 저장함에서 연 항목 (사이트 경로를 받는다). 웹 안의 '저장' 첫 화면 링크와 첫 페이지의 웹 '뒤로'는 네이티브 목록으로 돌아간다.
// 웹 헤더에 뒤로가 있으니 앱 헤더는 숨긴다 (_layout). 가장자리 스와이프로도 돌아간다
export default function SavedWebScreen() {
  const { path } = useLocalSearchParams<{ path?: string }>();
  const safePath = typeof path === "string" && path.startsWith("/") && !path.startsWith("//") ? path : "/";
  return (
    <SiteWebView
      id={`saved:${safePath}`}
      ownTab={null}
      uri={pageUrl(SITE_URL, getLocale(), safePath)}
      onTab={(tab) => (tab === "saved" ? router.back() : openTab(tab))}
      onBack={() => router.back()}
    />
  );
}
