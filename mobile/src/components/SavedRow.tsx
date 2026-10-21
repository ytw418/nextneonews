import { Image, Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";

import { COLORS } from "../theme";

// 저장함 한 줄: 커버 · 제목 · 종류 / 오른쪽 삭제(×). 줄 전체를 누르면 연다. 터치 영역 44pt 이상
export function SavedRow({
  title,
  sub,
  image,
  onOpen,
  onRemove,
  removeLabel,
}: {
  title: string;
  sub: string;
  image: string | null;
  onOpen?: () => void;
  onRemove: () => void;
  removeLabel: string;
}) {
  const c = COLORS[useColorScheme() === "dark" ? "dark" : "light"];
  return (
    <View style={[styles.row, { borderBottomColor: c.line }]}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${title}, ${sub}`}
        disabled={!onOpen}
        onPress={onOpen}
        style={({ pressed }) => [styles.main, { opacity: pressed ? 0.6 : 1 }]}
      >
        <View style={[styles.cover, { backgroundColor: c.band }]}>
          {image && <Image source={{ uri: image }} style={styles.image} resizeMode="cover" accessibilityIgnoresInvertColors />}
        </View>
        <View style={styles.text}>
          <Text numberOfLines={2} style={[styles.title, { color: c.ink900 }]}>
            {title}
          </Text>
          <Text numberOfLines={1} style={[styles.sub, { color: c.ink600 }]}>
            {sub}
          </Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${removeLabel}: ${title}`}
        hitSlop={8}
        onPress={onRemove}
        style={({ pressed }) => [styles.remove, { opacity: pressed ? 0.5 : 1 }]}
      >
        <Text style={[styles.removeText, { color: c.ink600 }]}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingLeft: 20, paddingRight: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  main: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, minHeight: 72 },
  cover: { width: 56, height: 56, borderRadius: 12, overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontWeight: "600", lineHeight: 21 },
  sub: { fontSize: 13 },
  remove: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  removeText: { fontSize: 24, lineHeight: 26 },
});
