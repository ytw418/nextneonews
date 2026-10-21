import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { useSyncExternalStore } from "react";

import { DEFAULT_LOCALE, isLocale, type Locale, matchLocale } from "../lib/locales";

// 앱 언어. 처음에는 기기 언어를 9개 중 하나로 맞추고, 웹 언어 시트에서 바꾸면 주소(/ja/…)를 보고 따라간다
const KEY = "locale";

let locale: Locale = DEFAULT_LOCALE;
const listeners = new Set<() => void>();

export async function loadLocale(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(KEY);
    if (stored && isLocale(stored)) {
      locale = stored;
      return;
    }
  } catch {
    // 저장소를 못 읽으면 기기 언어로
  }
  locale =
    getLocales()
      .map((l) => matchLocale(l.languageTag))
      .find((l): l is Locale => l !== null) ?? DEFAULT_LOCALE;
}

export function getLocale(): Locale {
  return locale;
}

export function setLocale(next: Locale): void {
  if (next === locale) return;
  locale = next;
  AsyncStorage.setItem(KEY, next).catch(() => {});
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAppLocale(): Locale {
  return useSyncExternalStore(subscribe, getLocale);
}
