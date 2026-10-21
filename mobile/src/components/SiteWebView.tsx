import * as WebBrowser from "expo-web-browser";
import { type ComponentType, type Ref, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Linking, Share, StyleSheet, useColorScheme, View } from "react-native";
import { WebView, type WebViewMessageEvent, type WebViewProps } from "react-native-webview";
import type { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";

import { SITE_HOSTS, USER_AGENT_TAG } from "../config";
import { beforeContentScript, gotoScript, parseMessage, pushSavedScript } from "../lib/bridge";
import { classifyUrl, splitUrl, type Tab } from "../lib/links";
import type { Locale } from "../lib/locales";
import { STRINGS } from "../i18n/strings";
import { getLocale, setLocale } from "../store/locale";
import { savedJson, setSaved, useSavedJson } from "../store/saved";
import { registerWebView } from "../store/webviews";
import { COLORS } from "../theme";
import { OfflineScreen } from "./OfflineScreen";

// react-native-webview 14 의 타입은 class WebView<P = undefined> 라 TS 6 에서 props 가 WebViewProps & undefined = never 가 된다
type WebViewInstance = WebView<object>;
const Web = WebView as unknown as ComponentType<WebViewProps & { ref?: Ref<WebViewInstance> }>;

// 탭 화면이 쓰는 손잡이: 주소 옮기기·스크립트 넣기
export interface SiteWebViewHandle {
  go(url: string): void;
  inject(script: string): void;
}

interface Props {
  ref?: Ref<SiteWebViewHandle>;
  id: string; // 웹뷰 이름 (저장 목록을 다른 웹뷰에 다시 심을 때 보낸 쪽을 뺀다)
  ownTab: Tab | null; // 이 웹뷰의 탭. 그 탭 첫 화면 링크는 이 안에서 연다 (null: 저장함 상세 — 탭 링크는 모두 앱으로)
  uri: string; // 처음 열 주소 (바뀌어도 다시 읽지 않는다 — 이동은 goRoot·링크로)
  rootUrl?: () => string; // 다른 탭에서 이 탭 첫 화면 링크를 눌렀을 때 갈 곳 (부를 때의 앱 언어로)
  onTab: (tab: Tab) => void;
  onLocale?: (locale: Locale) => void;
  onBack?: () => void; // 쌓아 연 웹뷰(ownTab null)의 첫 페이지에서 웹 '뒤로'를 눌렀을 때
}

// 사이트를 띄우는 웹뷰 하나. 화면은 웹이 그리고, 앱은 탭·저장·바깥 링크·오프라인만 맡는다.
// - UA 끝에 UnnieNoteApp/<버전> → 웹이 웹 탭바·설치 카드·광고·이메일 칸을 뺀다 (apps/web/src/lib/app-mode.ts)
// - 페이지마다 그리기 전에 앱 저장 목록을 심는다 (lib/bridge.ts). 웹에서 저장·해제하면 메시지로 받아 앱 저장소에 쓴다
// - 사이트 밖 주소는 인앱 사파리 창(제휴 쿠키가 사파리와 같다), mailto·LINE·일정 .ics 는 시스템에 넘긴다
// - 다섯 탭 첫 화면 링크는 네이티브 탭으로 옮긴다. 아이폰은 가장자리 스와이프로 뒤로, 당겨서 새로고침
export function SiteWebView({ ref: handle, id, ownTab, uri, rootUrl, onTab, onLocale, onBack }: Props) {
  const ref = useRef<WebViewInstance>(null);
  useImperativeHandle(handle, () => ({
    go: (url) => ref.current?.injectJavaScript(gotoScript(url)),
    inject: (script) => ref.current?.injectJavaScript(script),
  }));
  const [failed, setFailed] = useState(false);
  const dark = useColorScheme() === "dark";
  const t = STRINGS[getLocale()];
  // 문서가 새로 열릴 때마다 심는 스크립트. 저장 목록이 바뀌면 다시 만든다 — 웹뷰를 만들 때의 목록으로 심으면
  // 오래 둔 탭을 새로고침할 때 낡은 목록이 공유 localStorage 에 들어가 다른 탭의 변경을 덮을 수 있다 (react-native-webview 는 다음 문서부터 새 스크립트를 쓴다)
  const json = useSavedJson();
  const before = useMemo(() => beforeContentScript({ savedJson: json, ownTab }), [json, ownTab]);
  const [source] = useState(() => ({ uri }));

  useEffect(
    () =>
      registerWebView(id, {
        tab: ownTab,
        pushSaved: (json) => ref.current?.injectJavaScript(pushSavedScript(json)),
        goRoot: () => {
          if (rootUrl) ref.current?.injectJavaScript(gotoScript(rootUrl()));
        },
      }),
    [id, ownTab, rootUrl],
  );

  const onMessage = (event: WebViewMessageEvent) => {
    // 우리 사이트 프레임이 보낸 것만 (iframe 도 수신구에 닿는다 — 안드로이드 웹뷰 광고를 켜면 광고 프레임이 생긴다). 크기 상한: 저장 300개도 20KB 안
    const from = splitUrl(event.nativeEvent.url ?? "")?.host;
    if (!from || !SITE_HOSTS.includes(from) || event.nativeEvent.data.length > MESSAGE_MAX) return;
    const message = parseMessage(event.nativeEvent.data);
    if (!message) return;
    switch (message.type) {
      case "saved":
        setSaved(message.items, id);
        break;
      case "tab":
        onTab(message.tab);
        break;
      case "locale":
        onLocale?.(message.locale);
        setLocale(message.locale);
        break;
      case "back":
        onBack?.();
        break;
      case "share":
        Share.share({ url: message.url, message: message.text ? `${message.text}\n${message.url}` : message.url, title: message.title }).catch(
          () => {},
        );
        break;
    }
  };

  const openOutside = (url: string, kind: "external" | "system" | "blocked") => {
    if (kind === "blocked") return;
    if (kind === "external") WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url).catch(() => {}));
    else Linking.openURL(url).catch(() => {});
  };

  const onShouldStart = (request: ShouldStartLoadRequest) => {
    if (request.isTopFrame === false) return true; // 광고·임베드 iframe 은 그대로
    const link = classifyUrl(request.url, SITE_HOSTS);
    if (link.kind === "internal") return true;
    if (link.kind === "blocked") return false;
    if (link.kind === "tab") {
      if (link.tab === ownTab) return true;
      onTab(link.tab);
      return false;
    }
    openOutside(request.url, link.kind);
    return false;
  };

  const background = useMemo(() => ({ backgroundColor: COLORS[dark ? "dark" : "light"].bg }), [dark]);

  return (
    <View style={[styles.fill, background]}>
      <Web
        ref={ref}
        source={source}
        style={[styles.fill, background]}
        applicationNameForUserAgent={USER_AGENT_TAG}
        // 모든 이동을 onShouldStartLoadWithRequest 가 고르게 한다 (기본값은 http(s) 밖의 주소를 묻지 않고 바로 Linking 으로 연다)
        originWhitelist={ALL_ORIGINS}
        injectedJavaScriptBeforeContentLoaded={before}
        injectedJavaScriptBeforeContentLoadedForMainFrameOnly
        onMessage={onMessage}
        onShouldStartLoadWithRequest={onShouldStart}
        onOpenWindow={(event) => {
          // 새 창(target=_blank·window.open): 사이트 페이지는 이 웹뷰에서, 나머지는 바깥으로. http(s) 가 아닌 빈 창·javascript: 는 버린다
          const url = event.nativeEvent.targetUrl;
          const link = classifyUrl(url, SITE_HOSTS);
          if (link.kind === "tab" || (link.kind === "internal" && /^https?:/i.test(url))) ref.current?.injectJavaScript(gotoScript(url));
          else if (link.kind !== "internal") openOutside(url, link.kind);
        }}
        onLoadEnd={() => ref.current?.injectJavaScript(pushSavedScript(savedJson()))}
        onLoad={() => setFailed(false)}
        onError={() => setFailed(true)}
        onHttpError={(event) => {
          if (event.nativeEvent.statusCode >= 500) setFailed(true);
        }}
        onContentProcessDidTerminate={() => ref.current?.reload()}
        onRenderProcessGone={() => ref.current?.reload()}
        allowsBackForwardNavigationGestures
        pullToRefreshEnabled
        allowsInlineMediaPlayback
        // 배열로 넘긴다: 안드로이드 네이티브는 이 값을 배열로 읽어 문자열이면 앱이 꺼진다 (iOS 는 안에서 배열로 바꿔 준다)
        dataDetectorTypes={NO_DATA_DETECTORS}
        setSupportMultipleWindows
        webviewDebuggingEnabled={__DEV__}
      />
      {failed && (
        <OfflineScreen
          title={t.offlineTitle}
          body={t.offlineBody}
          retry={t.retry}
          back={onBack ? { label: t.back, onPress: onBack } : undefined}
          onRetry={() => {
            setFailed(false);
            ref.current?.reload();
          }}
        />
      )}
    </View>
  );
}

const ALL_ORIGINS = ["*"];
const NO_DATA_DETECTORS: ["none"] = ["none"];
const MESSAGE_MAX = 100_000;

const styles = StyleSheet.create({ fill: { flex: 1 } });
