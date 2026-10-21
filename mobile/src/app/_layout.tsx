import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";

import { loadLocale } from "../store/locale";
import { loadSaved } from "../store/saved";

SplashScreen.preventAutoHideAsync().catch(() => {});

// 저장 목록·언어를 읽은 뒤에 탭을 그린다 (첫 웹뷰가 빈 저장 목록을 심지 않게)
export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([loadSaved(), loadLocale()]).finally(() => {
      setReady(true);
      SplashScreen.hideAsync().catch(() => {});
    });
  }, []);

  if (!ready) return null;
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
