// 브라우저의 데이터 절약 모드(Save-Data, navigator.connection.saveData). 켜져 있으면 미뤄도 되는 것(글 끝 광고 등)을 받지 않는다.
// 아이폰 사파리는 이 값을 주지 않아 늘 false 다 (안드로이드 일부 브라우저만). 의존성 없는 작은 모듈이라 어느 클라이언트 컴포넌트에서나 쓴다
export function saveDataOn(): boolean {
  if (typeof navigator === "undefined") return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}
