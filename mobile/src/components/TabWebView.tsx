import { useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";

import { SITE_URL } from "../config";
import { reselectScript } from "../lib/bridge";
import { pageUrl, tabRootPath, type Tab } from "../lib/links";
import type { Locale } from "../lib/locales";
import { openTab } from "../navigation";
import { getLocale, useAppLocale } from "../store/locale";
import { SiteWebView, type SiteWebViewHandle } from "./SiteWebView";

// 웹뷰 탭 하나 (홈·랭킹·가이드·일정). 처음 고를 때 웹뷰를 만들고 그 뒤로 유지한다 (읽던 자리가 남는다).
// 다른 탭에서 언어를 바꿨으면 이 탭으로 돌아올 때 새 언어 첫 화면으로. 같은 탭을 다시 누르면 맨 위로, 맨 위면 첫 화면으로
export function TabWebView({ tab }: { tab: Tab }) {
  const navigation = useNavigation();
  const locale = useAppLocale();
  const [opened, setOpened] = useState(false);
  const shownLocale = useRef<Locale>(getLocale());
  const view = useRef<SiteWebViewHandle>(null);
  const root = (l: Locale) => pageUrl(SITE_URL, l, tabRootPath(tab));

  useFocusEffect(
    useCallback(() => {
      setOpened(true);
      if (shownLocale.current !== getLocale()) {
        shownLocale.current = getLocale();
        view.current?.go(root(getLocale()));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locale]),
  );

  useEffect(
    () =>
      navigation.addListener("tabPress" as never, () => {
        if (navigation.isFocused()) view.current?.inject(reselectScript(root(getLocale())));
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigation],
  );

  if (!opened) return <View style={{ flex: 1 }} />;
  return (
    <SiteWebView
      ref={view}
      id={`tab:${tab}`}
      ownTab={tab}
      uri={root(shownLocale.current)}
      rootUrl={() => {
        shownLocale.current = getLocale(); // 곧 이 언어 첫 화면으로 가니 포커스 때 다시 열지 않는다
        return root(getLocale());
      }}
      onTab={openTab}
      onLocale={(l) => {
        shownLocale.current = l;
      }}
    />
  );
}
