import { NativeTabs } from "expo-router/native-tabs";
import { DynamicColorIOS, Platform, useColorScheme } from "react-native";

import { STRINGS } from "../../i18n/strings";
import { useAppLocale } from "../../store/locale";
import { useSaved } from "../../store/saved";

const BADGE_MAX = 99; // 웹 TabBar 와 같다

const iosInk = Platform.OS === "ios" ? DynamicColorIOS({ light: "#121214", dark: "#f4f4f6" }) : null;

// 웹 TabBar(apps/web/src/components/TabBar.tsx)와 같은 다섯 탭. 저장 탭에는 저장 수 배지.
// 탭 화면은 저장함만 네이티브, 나머지는 웹뷰 (화면 구조는 웹이 정한다 — 바꿔도 앱 업데이트가 필요 없다)
export default function TabsLayout() {
  const t = STRINGS[useAppLocale()];
  const savedCount = useSaved().length;
  const dark = useColorScheme() === "dark";
  const ink = iosInk ?? (dark ? "#f4f4f6" : "#121214");
  return (
    // iOS 18 이하: 웹뷰 스크롤을 '끝에 닿음'으로 읽어 탭바가 투명해지고 글자가 아이콘과 겹쳤다 → 늘 흐린 배경.
    // iOS 26 은 시스템이 유리 탭바를 그려 이 값들을 쓰지 않는다
    <NativeTabs tintColor={ink} minimizeBehavior="never" blurEffect="systemChromeMaterial">
      <NativeTabs.Trigger disableTransparentOnScrollEdge name="index">
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
        <NativeTabs.Trigger.Label>{t.home}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger disableTransparentOnScrollEdge name="rankings">
        <NativeTabs.Trigger.Icon sf={{ default: "trophy", selected: "trophy.fill" }} md="trophy" />
        <NativeTabs.Trigger.Label>{t.rankings}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger disableTransparentOnScrollEdge name="guide">
        <NativeTabs.Trigger.Icon sf={{ default: "safari", selected: "safari.fill" }} md="explore" />
        <NativeTabs.Trigger.Label>{t.guide}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger disableTransparentOnScrollEdge name="schedule">
        <NativeTabs.Trigger.Icon sf={{ default: "ticket", selected: "ticket.fill" }} md="confirmation_number" />
        <NativeTabs.Trigger.Label>{t.schedule}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger disableTransparentOnScrollEdge name="saved">
        <NativeTabs.Trigger.Icon sf={{ default: "bookmark", selected: "bookmark.fill" }} md="bookmark" />
        <NativeTabs.Trigger.Label>{t.saved}</NativeTabs.Trigger.Label>
        {savedCount > 0 && <NativeTabs.Trigger.Badge>{savedCount > BADGE_MAX ? `${BADGE_MAX}+` : String(savedCount)}</NativeTabs.Trigger.Badge>}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
