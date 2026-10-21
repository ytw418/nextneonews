import Constants from "expo-constants";

import { splitUrl } from "./lib/links";

// 웹뷰가 여는 사이트. 로컬 검증은 EXPO_PUBLIC_SITE_URL=http://localhost:3420 (next start, next dev 아님)
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL ?? "https://unnienote.app").replace(/\/+$/, "");

// 앱 안에서 여는 호스트 (나머지는 외부 브라우저)
export const SITE_HOSTS: readonly string[] = [...new Set(["unnienote.app", "www.unnienote.app", splitUrl(SITE_URL)?.host ?? ""])].filter(Boolean);

export const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

// 웹이 앱 모드를 켜는 꼬리표 (apps/web/src/lib/app-mode.ts). 기본 웹뷰 UA 끝에 붙는다
export const USER_AGENT_TAG = `UnnieNoteApp/${APP_VERSION}`;
