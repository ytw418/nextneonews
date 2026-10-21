import { Stack } from "expo-router";

import { STRINGS } from "../../../i18n/strings";
import { useAppLocale } from "../../../store/locale";

// 저장 탭: 네이티브 목록 → 항목을 누르면 같은 탭 안에서 웹뷰로 연다
export default function SavedLayout() {
  const t = STRINGS[useAppLocale()];
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: "minimal" }}>
      <Stack.Screen name="index" options={{ title: t.savedTitle, headerLargeTitle: true }} />
      <Stack.Screen name="web" options={{ headerShown: false }} />
    </Stack>
  );
}
