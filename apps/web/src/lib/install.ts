// 크롬은 서비스 워커가 이미 있는 재방문이면 beforeinstallprompt 를 하이드레이션 전에 보낼 수 있다.
// 그때 놓치지 않게 레이아웃 맨 앞 인라인 스크립트가 먼저 붙잡아 두고(작은 설치 막대도 막고), InstallPrompt 가 나중에 꺼내 쓴다
export const INSTALL_EVENT_KEY = "__hbInstallEvent";
export const INSTALL_CAPTURE_SCRIPT = `addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.${INSTALL_EVENT_KEY}=e})`;

// 앱 안 브라우저: 인스타그램·페이스북·LINE·스레드(Barcelona)·틱톡(BytedanceWebview·musical_ly)·위챗·카카오톡·X·네이버 앱·
// 샤오훙수·구글 앱(GSA). 여기서 저장한 건 사파리와 따로 산다 (저장함 경고, 설치 안내 제외).
// 크롬 iOS·파이어폭스 같은 일반 브라우저는 넣지 않는다 — '이 앱 안 브라우저' 경고가 틀린 말이 된다 (InstallPrompt 가 따로 더한다)
const IN_APP_UA =
  /Instagram|FBAN|FBAV|\bLine\/|Barcelona|BytedanceWebview|musical_ly|MicroMessenger|KAKAOTALK|Twitter|NAVER\(inapp|xhsdiscover|GSA\//;

export function isInAppBrowser(userAgent: string): boolean {
  return IN_APP_UA.test(userAgent);
}
