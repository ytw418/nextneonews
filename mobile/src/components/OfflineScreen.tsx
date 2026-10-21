import { useEffect } from "react";
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, useColorScheme } from "react-native";

import { COLORS } from "../theme";

// 웹뷰를 못 불러왔을 때 위에 덮는 화면 (웹뷰는 그대로 두고 다시 시도하면 지운다)
// back: 앱 헤더가 없는 쌓인 화면(저장함에서 연 항목)이면 돌아갈 길을 같이 둔다
export function OfflineScreen({
  title,
  body,
  retry,
  onRetry,
  back,
}: {
  title: string;
  body: string;
  retry: string;
  onRetry: () => void;
  back?: { label: string; onPress: () => void };
}) {
  const c = COLORS[useColorScheme() === "dark" ? "dark" : "light"];
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(title);
  }, [title]);
  // 큰 글꼴(손쉬운 사용)에서 내용이 화면보다 길어도 버튼까지 내려갈 수 있게 스크롤로 감싼다
  return (
    <ScrollView
      style={[StyleSheet.absoluteFill, { backgroundColor: c.bg }]}
      contentContainerStyle={styles.wrap}
      accessibilityViewIsModal
    >
      <Text style={[styles.mark, { color: c.ink900 }]} accessibilityElementsHidden importantForAccessibility="no">
        U<Text style={{ color: c.brand }}>.</Text>
      </Text>
      <Text accessibilityRole="header" style={[styles.title, { color: c.ink900 }]}>
        {title}
      </Text>
      <Text style={[styles.body, { color: c.ink600 }]}>{body}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [styles.button, { backgroundColor: c.brand, opacity: pressed ? 0.85 : 1 }]}
      >
        <Text style={styles.buttonText}>{retry}</Text>
      </Pressable>
      {back && (
        <Pressable accessibilityRole="button" onPress={back.onPress} style={({ pressed }) => [styles.back, { opacity: pressed ? 0.6 : 1 }]}>
          <Text style={[styles.backText, { color: c.ink600 }]}>{back.label}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingVertical: 48, gap: 8 },
  mark: { fontFamily: "Georgia", fontStyle: "italic", fontSize: 44, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  body: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  button: { marginTop: 16, minHeight: 48, paddingHorizontal: 28, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  back: { minHeight: 44, paddingHorizontal: 20, alignItems: "center", justifyContent: "center" },
  backText: { fontSize: 15, fontWeight: "600" },
});
