import type { ExpoConfig } from "expo/config";

// 언니노트 앱 (docs/decisions/app-2026-10-21.md). 비밀값은 여기 두지 않는다 — 공개 저장소다.
// 로컬 검증: EXPO_PUBLIC_APP_ENV=development EXPO_PUBLIC_SITE_URL=http://localhost:3420 npx expo run:ios
const dev = process.env.EXPO_PUBLIC_APP_ENV === "development";

const config: ExpoConfig = {
  name: "Unnie Note",
  slug: "unnienote",
  scheme: "unnienote",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  ios: {
    bundleIdentifier: "app.unnienote.mobile",
    supportsTablet: false,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      CFBundleAllowMixedLocalizations: true,
      // 개발 빌드만: 맥의 http://localhost 운영 빌드를 연다
      ...(dev ? { NSAppTransportSecurity: { NSAllowsLocalNetworking: true } } : {}),
    },
  },
  android: {
    package: "app.unnienote.mobile",
    adaptiveIcon: {
      backgroundColor: "#ffffff",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    "expo-router",
    // 9개 언어를 번들에 선언한다 (App Store 상품 페이지 '언어'·웹뷰 길게 누르기 메뉴 같은 시스템 문구가 기기 언어를 따른다)
    [
      "expo-localization",
      {
        supportedLocales: {
          ios: ["en", "ja", "zh-Hant", "zh-Hans", "ko", "vi", "id", "fr", "ru"],
          android: ["en", "ja", "zh-TW", "zh-CN", "ko", "vi", "id", "fr", "ru"],
        },
      },
    ],
    "expo-web-browser",
    ["expo-splash-screen", { backgroundColor: "#ffffff", image: "./assets/splash-icon.png", imageWidth: 160, dark: { backgroundColor: "#111113" } }],
  ],
  experiments: { typedRoutes: true },
  owner: "ytw418",
  // EAS 프로젝트 @ytw418/unnienote (빌드·제출)
  extra: { eas: { projectId: "c00b0ccf-71f7-4bb2-b986-f6b28dcbe5cd" } },
};

export default config;
