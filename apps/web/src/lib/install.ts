// 크롬은 서비스 워커가 이미 있는 재방문이면 beforeinstallprompt 를 하이드레이션 전에 보낼 수 있다.
// 그때 놓치지 않게 레이아웃 맨 앞 인라인 스크립트가 먼저 붙잡아 두고(작은 설치 막대도 막고), InstallPrompt 가 나중에 꺼내 쓴다
export const INSTALL_EVENT_KEY = "__hbInstallEvent";
export const INSTALL_CAPTURE_SCRIPT = `addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.${INSTALL_EVENT_KEY}=e})`;
