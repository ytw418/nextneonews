import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, FlatList, Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";

import { SavedRow } from "../../../components/SavedRow";
import { SITE_URL } from "../../../config";
import { STRINGS } from "../../../i18n/strings";
import { pageUrl } from "../../../lib/links";
import { savedKey, type SavedItem, withoutItem } from "../../../lib/saved-rules";
import { coverUrl, isSummary, type Summary, SUMMARY_CHUNK, summariesUrl } from "../../../lib/summaries";
import { openTab } from "../../../navigation";
import { useAppLocale } from "../../../store/locale";
import { setSaved, useSaved } from "../../../store/saved";
import { COLORS } from "../../../theme";

// 키 → 요약. null = 서버가 이번에 못 준 항목(내려갔거나 DB 가 잠깐 멈춤 — 화면에 다시 오면 다시 묻는다). 키가 없으면 아직 못 불러옴
type Summaries = Record<string, Summary | null>;

const CACHE_KEY = (locale: string) => `saved-summaries:${locale}`;
const FETCH_TIMEOUT_MS = 8000;
const UNDO_MS = 5000;

async function fetchChunk(chunk: SavedItem[], locale: string): Promise<Summaries | null> {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(summariesUrl(SITE_URL, chunk, locale), { signal: abort.signal });
    if (!res.ok) return null;
    const body = (await res.json()) as { items?: unknown[] };
    const found = new Map((body.items ?? []).filter(isSummary).map((s) => [`${s.kind}:${s.id}`, s]));
    return Object.fromEntries(chunk.map((i) => [savedKey(i), found.get(savedKey(i)) ?? null]));
  } catch {
    return null; // 네트워크 실패·시간 초과 — 다음 기회에 다시
  } finally {
    clearTimeout(timer);
  }
}

// 저장 목록의 제목·커버를 언어별로 불러온다 (100개씩). 받은 것은 기기에 남겨 오프라인에서도 제목이 보이게 하고,
// 못 받은 묶음은 화면에 다시 들어올 때·앱이 다시 앞으로 올 때 다시 묻는다
function useSummaries(items: readonly SavedItem[], locale: string): Summaries {
  const [map, setMap] = useState<{ locale: string; data: Summaries }>({ locale, data: {} });
  const [attempt, setAttempt] = useState(0);
  const data = useMemo(() => (map.locale === locale ? map.data : {}), [map, locale]);
  const missing = items.filter((i) => !data[savedKey(i)]);
  const missingKey = missing.map(savedKey).join(",");

  // 기기에 남겨 둔 요약 먼저
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(CACHE_KEY(locale))
      .then((raw) => {
        if (!alive || !raw) return;
        const cached = JSON.parse(raw) as Summaries;
        setMap((prev) => ({ locale, data: { ...cached, ...(prev.locale === locale ? prev.data : {}) } }));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [locale]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  useFocusEffect(retry);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") retry();
    });
    return () => sub.remove();
  }, [retry]);

  useEffect(() => {
    if (!missingKey) return;
    let alive = true;
    const chunks: SavedItem[][] = [];
    for (let i = 0; i < missing.length; i += SUMMARY_CHUNK) chunks.push(missing.slice(i, i + SUMMARY_CHUNK));
    Promise.all(chunks.map((chunk) => fetchChunk(chunk, locale))).then((results) => {
      const got = results.filter((r): r is Summaries => r !== null);
      if (!alive || got.length === 0) return;
      setMap((prev) => {
        const next = { locale, data: Object.assign({}, prev.locale === locale ? prev.data : {}, ...got) };
        // 받은 요약만 남긴다 (null 은 남기지 않는다 — 한 번의 일시 장애로 '불러오지 못함'이 굳지 않게)
        const found = Object.fromEntries(Object.entries(next.data).filter(([, v]) => v !== null));
        AsyncStorage.setItem(CACHE_KEY(locale), JSON.stringify(found)).catch(() => {});
        return next;
      });
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingKey, locale, attempt]);

  return data;
}

// 네이티브 저장함. 목록은 앱 저장소가 원본이라 사파리처럼 7일 뒤 사라지지 않는다.
// 항목을 누르면 같은 탭 안 웹뷰로(시술 항목은 앱 1판에서 뺀 섹션이라 사파리 창으로), ×는 바로 지우고 몇 초 동안 되돌리기를 둔다
export default function SavedScreen() {
  const locale = useAppLocale();
  const t = STRINGS[locale];
  const c = COLORS[useColorScheme() === "dark" ? "dark" : "light"];
  const items = useSaved();
  const summaries = useSummaries(items, locale);
  const rows = useMemo(() => items.map((item) => ({ item, summary: summaries[savedKey(item)] })), [items, summaries]);
  const [removed, setRemoved] = useState<SavedItem | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(undoTimer.current), []);

  const remove = (item: SavedItem) => {
    setSaved(withoutItem(items, item), null);
    setRemoved(item);
    clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setRemoved(null), UNDO_MS);
  };
  const undo = () => {
    if (removed) setSaved([...items, removed], null); // 저장 시각(at)을 그대로 두어 원래 자리로 돌아간다
    setRemoved(null);
  };
  const open = (item: SavedItem, summary: Summary) => {
    if (item.kind === "clinic") void WebBrowser.openBrowserAsync(pageUrl(SITE_URL, locale, summary.href));
    else router.push({ pathname: "/saved/web", params: { path: summary.href } });
  };

  const undoBar = removed && (
    <View style={[styles.undo, { backgroundColor: c.ink900 }]} accessibilityLiveRegion="polite">
      <Text style={[styles.undoText, { color: c.bg }]}>{t.savedRemoved}</Text>
      <Pressable accessibilityRole="button" onPress={undo} hitSlop={8} style={styles.undoButton}>
        <Text style={[styles.undoAction, { color: c.bg }]}>{t.savedUndo}</Text>
      </Pressable>
    </View>
  );

  if (items.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: c.bg }]}>
        <Text style={[styles.emptyText, { color: c.ink600 }]}>{t.savedEmpty}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => openTab("guide")}
          style={({ pressed }) => [styles.browse, { backgroundColor: c.band, opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.browseText, { color: c.ink900 }]}>{t.savedBrowse}</Text>
        </Pressable>
        {undoBar}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={rows}
        keyExtractor={(row) => savedKey(row.item)}
        renderItem={({ item: { item, summary } }) => (
          <SavedRow
            title={summary ? summary.title : summary === null ? t.savedMissing : "…"}
            sub={summary?.sub ? `${t.kinds[item.kind]} · ${summary.sub}` : t.kinds[item.kind]}
            image={summary ? coverUrl(SITE_URL, summary.cover) : null}
            onOpen={summary ? () => open(item, summary) : undefined}
            onRemove={() => remove(item)}
            removeLabel={t.remove}
          />
        )}
      />
      {undoBar}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 16 },
  emptyText: { fontSize: 16, lineHeight: 24, textAlign: "center" },
  browse: { minHeight: 48, paddingHorizontal: 24, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  browseText: { fontSize: 16, fontWeight: "600" },
  undo: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 100,
    minHeight: 52,
    borderRadius: 14,
    paddingLeft: 18,
    paddingRight: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  undoText: { flex: 1, fontSize: 15 },
  undoButton: { minHeight: 44, paddingHorizontal: 12, justifyContent: "center" },
  undoAction: { fontSize: 15, fontWeight: "700" },
});
