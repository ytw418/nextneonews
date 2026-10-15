// 출처 목록에서 한국 매체 이름을 한글을 못 읽는 독자에게 로마자로 (각 매체가 쓰는 영문 이름).
// 모르는 이름은 그대로 둔다
const ROMAN: Record<string, string> = {
  연합뉴스: "Yonhap News",
  뉴스1: "News1",
  뉴시스: "Newsis",
  텐아시아: "TenAsia",
  스포츠조선: "Sports Chosun",
  엑스포츠뉴스: "Xportsnews",
  마이데일리: "My Daily",
  뉴스엔: "Newsen",
  TV리포트: "TV Report",
  MK스포츠: "MK Sports",
  스포츠서울: "Sports Seoul",
  스타뉴스: "Star News",
  스포티비뉴스: "SPOTV News",
  앳스타일: "@star1",
  티브이데일리: "TV Daily",
  일간스포츠: "Ilgan Sports",
  스포츠경향: "Sports Kyunghyang",
  스포츠동아: "Sports Donga",
  MBC연예: "MBC Entertainment",
  디스패치: "Dispatch",
  세계일보: "Segye Ilbo",
  조선일보: "Chosun Ilbo",
  중앙일보: "JoongAng Ilbo",
  동아일보: "Dong-A Ilbo",
  한겨레: "Hankyoreh",
  경향신문: "Kyunghyang Shinmun",
  한국일보: "Hankook Ilbo",
  헤럴드경제: "Herald Economy",
  MHN스포츠: "MHN Sports",
  OSEN: "OSEN",
  더쿠: "theqoo",
};

export function publisherName(name: string, locale: string): string {
  return locale === "ko" ? name : (ROMAN[name] ?? name);
}
