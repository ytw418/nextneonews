#!/usr/bin/env node
// 가이드 카탈로그(src/data/{beauty,travel,clinic,drama}) 검사. 하나라도 걸리면 종료 코드 1 (docs/monetize/PLAN.md §7·§10-3).
//  1. 9개 언어 문구 파일의 키 집합이 영어와 같다 (빠진 키는 영어로 채워지지만, 남는 키·빠진 키는 번역이 어긋났다는 뜻)
//  2. 금지어 0건 — 화장품 효능(화장품법 §13: 치료·재생·의사 추천·최고·1위)·의료(의료법 §56: 보장·최고·부작용 없음·병원 추천),
//     뷰티 판매량·순위·수상 주장(베스트셀러·수백만 개·차트·어워즈·리뷰 수천 개)
//  3. 모든 항목에 공식 출처(https) 1개 이상
//  4. 클리닉에는 구매·제휴가 없다: 시술 항목에 buy·제휴 주소 없음, 클리닉 화면 코드에 제휴 상자·쿠팡 없음
//  5. 교차 참조가 끊기지 않았다: 명소 → 드라마, 드라마 → 촬영지 명소·비슷한 작품
//  6. 뷰티 구매처 1~4개·파트너당 1개, 기능성 표기 없는 제품에 미백·주름 표현 없음, 중국어 파일에 가나 없음
//  7. 커버: 3D 아이콘 키마다 WebP·PNG 파일, 명소·동네 사진은 공용 원본 주소·허용 라이선스·저작자·설명 페이지,
//     제품 사진은 /products/ 파일·OBF 제품 페이지·CC BY-SA·저작자
// 의존성 없음. 카탈로그 사실 파일(items.ts)은 Node 의 타입 지우기로 바로 읽는다 (Node 22.18+)
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const data = join(root, "src", "data");
const LOCALES = ["en", "ja", "zh-TW", "zh-CN", "ko", "vi", "id", "fr", "ru"];
const SECTIONS = ["beauty", "travel", "clinic", "drama"];

const failures = [];
const notes = [];
const fail = (rule, message) => failures.push(`[${rule}] ${message}`);

const items = async (section, name) => (await import(pathToFileURL(join(data, section, "items.ts")).href))[name];
const text = (section, locale) => JSON.parse(readFileSync(join(data, section, "text", `${locale}.json`), "utf8"));

// 객체 키 경로 (배열 안은 내려가지 않는다 — 팁·FAQ 개수는 언어마다 달라도 된다)
function keyPaths(value, prefix = "") {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return [];
  return Object.entries(value).flatMap(([key, child]) => [`${prefix}${key}`, ...keyPaths(child, `${prefix}${key}.`)]);
}

// 문구 안의 모든 문자열 (경로와 함께)
function strings(value, path = "") {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, `${path}[${i}]`));
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([k, v]) => strings(v, path ? `${path}.${k}` : k));
  }
  return [];
}

// ── 금지어 (언어별 대표 표현). 라틴 글자는 대소문자를 가리지 않는다 ──

// 화장품: 효능·권위·최상급 표현 (기능성 미백·주름·자외선은 따로 6번에서 본다).
// 일본어·중국어 '処方·處方'은 화장품 '제형'이라는 뜻으로도 써서, 의사·피부과 처방 꼴만 잡는다
const BEAUTY_BANNED = {
  en: ["cure", "heals ", "regenerat", "doctor-recommended", "doctor recommended", "dermatologist-recommended", "dermatologist recommended", "prescription", "number one", "#1", "no. 1", "the best ", "guarantee"],
  ja: ["治療", "治す", "再生", "医師推奨", "皮膚科医推奨", "医師の処方", "皮膚科の処方", "最高", "1位", "No.1", "保証", "完治"],
  "zh-TW": ["治療", "治癒", "再生", "醫師推薦", "皮膚科推薦", "醫師處方", "皮膚科處方", "最好的", "第一名", "保證", "根治"],
  "zh-CN": ["治疗", "治愈", "再生", "医生推荐", "皮肤科推荐", "医生处方", "皮肤科处方", "最好的", "第一名", "保证", "根治"],
  ko: ["치료", "재생", "의사 추천", "피부과 추천", "피부과 처방", "최고", "1위", "완치", "보장"],
  vi: ["chữa khỏi", "điều trị", "tái tạo", "bác sĩ khuyên dùng", "tốt nhất", "số 1", "đảm bảo"],
  id: ["menyembuhkan", "mengobati", "regenerasi", "direkomendasikan dokter", "terbaik", "nomor 1", "dijamin"],
  fr: ["guérit", "guérir", "soigne", "régénèr", "régénér", "recommandé par les dermatologues", "recommandé par les médecins", "le meilleur", "la meilleure", "n°1", "numéro 1", "garanti"],
  ru: ["лечит", "излечива", "регенерир", "рекомендуют врачи", "рекомендован дерматолог", "лучший", "лучшее", "№1", "номер один", "гарантир"],
};

// 의료: 보장·최상급·부작용 없음·병원 추천 (위험을 설명하는 '보장되지 않는다' 같은 부정문은 아래 ALLOW 로 뺀다)
const CLINIC_BANNED = {
  en: ["guaranteed result", "guarantees", "the best ", "number one", "#1", "risk-free", "no side effects", "100% safe", "completely safe", "painless", "top clinic", "best clinic", "recommended clinic"],
  ja: ["効果を保証", "最高の", "1位", "No.1", "副作用なし", "副作用はありません", "痛みなし", "おすすめのクリニック", "名医"],
  "zh-TW": ["保證效果", "最好的", "第一名", "沒有副作用", "零風險", "無痛", "推薦診所", "名醫"],
  "zh-CN": ["保证效果", "最好的", "第一名", "没有副作用", "零风险", "无痛", "推荐诊所", "名医"],
  ko: ["효과 보장", "효과를 보장", "최고", "1위", "부작용 없", "통증 없", "추천 병원", "병원 추천", "명의"],
  vi: ["đảm bảo hiệu quả", "tốt nhất", "số 1", "không có tác dụng phụ", "không đau", "phòng khám uy tín nhất"],
  id: ["hasil dijamin", "terbaik", "nomor 1", "tanpa efek samping", "tanpa rasa sakit", "klinik terbaik"],
  fr: ["résultat garanti", "résultats garantis", "le meilleur", "la meilleure", "n°1", "sans effets secondaires", "sans risque", "sans douleur", "meilleure clinique"],
  ru: ["гарантирует результат", "гарантированный результат", "лучший", "лучшая", "№1", "без побочных", "без риска", "безболезненн", "лучшая клиника"],
};

// 기능성(식약처 보고) 표기가 없는 제품에 쓰면 안 되는 미백·주름 개선 표현
const FUNCTIONAL_WORDS = {
  whitening: { en: ["whitening", "whiten"], ja: ["美白"], "zh-TW": ["美白"], "zh-CN": ["美白"], ko: ["미백"], vi: ["làm trắng"], id: ["memutihkan"], fr: ["blanchi"], ru: ["отбелива"] },
  wrinkle: { en: ["anti-wrinkle", "wrinkle care", "reduces wrinkles"], ja: ["シワ改善"], "zh-TW": ["抗皺"], "zh-CN": ["抗皱"], ko: ["주름 개선"], vi: ["chống nhăn"], id: ["anti-kerut"], fr: ["anti-rides"], ru: ["против морщин"] },
};

// 뷰티: 판매량·인기 순위·수상 주장. 제휴 구매 상자 옆에 실리는데 브랜드 판매 페이지 말고는 근거가 없어서 쓰지 않는다
// (공식 발표·수상 페이지를 출처로 붙여도 화면에 출처가 안 보이므로 일단 전부 막는다). 수상명이 라틴 글자라 award 는 모든 언어에서 본다
const BEAUTY_CLAIMS = {
  en: ["bestseller", "best-seller", "best seller", "best-selling", "best selling", "top-selling", "most-bought", "most bought", "sold millions", "millions of units", "sold out", "award", "chart", "ranking", "thousands of", "amazon reviews", "number one", "no.1", "no. 1", "#1", "most famous", "most popular", "long-selling"],
  ja: ["award", "売上No.1", "No.1", "1位", "ベストセラー", "よく売れ", "売れている", "売り切れ", "完売", "累計", "販売数", "ロングセラー", "アワード", "受賞", "ランキング", "数千件"],
  "zh-TW": ["award", "銷量", "熱銷", "暢銷", "長銷", "斷貨", "售罄", "售出", "大獎", "獎項", "得獎", "排行榜", "美妝榜", "榜單", "名列前茅", "第一名", "數千則"],
  "zh-CN": ["award", "销量", "热销", "畅销", "长销", "断货", "售罄", "售出", "大奖", "奖项", "得奖", "排行榜", "美妆榜", "榜单", "名列前茅", "第一名", "数千条"],
  ko: ["award", "많이 팔리", "판매량", "베스트셀러", "스테디셀러", "품절", "수백만 개", "누적 판매", "어워즈", "어워드", "수상", "차트", "랭킹", "1위", "리뷰가 수천"],
  vi: ["award", "bán chạy", "cháy hàng", "hàng triệu", "giải thưởng", "đoạt giải", "bảng xếp hạng", "số 1", "hàng nghìn đánh giá"],
  id: ["award", "laris", "terjual habis", "terjual jutaan", "penghargaan", "tangga beauty", "peringkat", "nomor 1", "ribuan ulasan"],
  fr: ["award", "best-seller", "meilleure vente", "meilleures ventes", "les plus achetés", "les plus vendus", "épuisé", "millions d’exemplaires", "millions d'exemplaires", "prix annuels", "classement", "n°1", "milliers d’avis", "milliers d'avis"],
  ru: ["award", "бестселлер", "самых покупаемых", "самый продаваемый", "раскупили", "продано", "миллион", "наград", "чарт", "рейтинг", "№1", "тысячи отзывов"],
};

function scanBanned(section, locale, file, banned, rule = "금지어") {
  for (const [path, value] of strings(file)) {
    const lower = value.toLowerCase();
    for (const word of banned[locale] ?? []) {
      if (lower.includes(word.toLowerCase())) fail(rule, `${section}/${locale} ${path}: “${word}” — ${value.slice(0, 90)}`);
    }
  }
}

// ── 1. 9개 언어 키 집합 ──
const texts = {};
for (const section of SECTIONS) {
  texts[section] = Object.fromEntries(LOCALES.map((l) => [l, text(section, l)]));
  const base = new Set(keyPaths(texts[section].en));
  for (const locale of LOCALES.slice(1)) {
    const keys = new Set(keyPaths(texts[section][locale]));
    const missing = [...base].filter((k) => !keys.has(k));
    const extra = [...keys].filter((k) => !base.has(k));
    if (missing.length) fail("언어 키", `${section}/${locale} 빠짐 ${missing.length}: ${missing.slice(0, 5).join(", ")}`);
    if (extra.length) fail("언어 키", `${section}/${locale} 남음 ${extra.length}: ${extra.slice(0, 5).join(", ")}`);
  }
}

const [BEAUTY, TRAVEL, CLINIC, DRAMA] = await Promise.all([
  items("beauty", "BEAUTY_ITEMS"),
  items("travel", "TRAVEL_ITEMS"),
  items("clinic", "CLINIC_ITEMS"),
  items("drama", "DRAMA_ITEMS"),
]);

// 사실 파일의 slug 가 영어 문구에 다 있는가 (없으면 화면에서 빠진다)
const slugText = { beauty: ["products", BEAUTY], travel: ["places", TRAVEL], clinic: ["procedures", CLINIC], drama: ["dramas", DRAMA] };
for (const [section, [key, list]] of Object.entries(slugText)) {
  const known = new Set(Object.keys(texts[section].en[key] ?? {}));
  for (const item of list) if (!known.has(item.slug)) fail("언어 키", `${section}: ${item.slug} 영어 문구 없음`);
}

// ── 2. 금지어 ──
for (const locale of LOCALES) {
  scanBanned("beauty", locale, texts.beauty[locale].products, BEAUTY_BANNED);
  scanBanned("beauty", locale, texts.beauty[locale], BEAUTY_CLAIMS, "판매·수상 주장");
  scanBanned("clinic", locale, texts.clinic[locale], CLINIC_BANNED);
}

// ── 3. 출처 ──
for (const [section, list] of Object.entries({ beauty: BEAUTY, travel: TRAVEL, clinic: CLINIC, drama: DRAMA })) {
  for (const item of list) {
    const sources = item.sources ?? [];
    if (sources.length === 0) fail("출처", `${section}/${item.slug}: sources 비어 있음`);
    for (const url of sources) {
      if (!/^https?:\/\/\S+$/.test(url)) fail("출처", `${section}/${item.slug}: 주소가 아님 ${url}`);
      // 공식 사이트가 https 를 안 쓰는 곳 (동네 식당·사찰 등). 출처로는 되지만 화면에서 링크하면 브라우저가 경고할 수 있다
      else if (url.startsWith("http:")) notes.push(`${section}/${item.slug}: 출처가 http ${url}`);
    }
  }
}

// ── 4. 클리닉 무제휴 ──
const AFFILIATE_HOSTS = /oliveyoung|yesstyle|amazon\.|klook|creatrip|trip\.com|airalo|coupang/i;
for (const item of CLINIC) {
  if ("buy" in item || "watch" in item) fail("클리닉 제휴", `clinic/${item.slug}: buy·watch 필드가 있음`);
  if (item.price && AFFILIATE_HOSTS.test(item.price.source)) fail("클리닉 제휴", `clinic/${item.slug}: 가격 출처가 쇼핑몰`);
}
for (const locale of LOCALES) {
  for (const [path, value] of strings(texts.clinic[locale])) {
    if (AFFILIATE_HOSTS.test(value) && /https?:\/\//.test(value)) fail("클리닉 제휴", `clinic/${locale} ${path}: 제휴 주소`);
  }
}
const CLINIC_CODE = [join(root, "src", "app", "[locale]", "clinic"), join(root, "src", "components", "clinic")];
const CLINIC_FORBIDDEN = /AffiliateBox|AffiliateLink|affiliateHref|partnersForLocale|CoupangBanner|coupangBannerFor/;
for (const dir of CLINIC_CODE.filter(existsSync)) {
  for (const file of readdirSync(dir, { recursive: true }).map(String).filter((f) => /\.(tsx?|mjs)$/.test(f))) {
    const source = readFileSync(join(dir, file), "utf8");
    const hit = source.match(CLINIC_FORBIDDEN);
    if (hit) fail("클리닉 제휴", `${relative(root, join(dir, file))}: ${hit[0]}`);
  }
}

// ── 5. 교차 참조 ──
const placeSlugs = new Set(TRAVEL.map((p) => p.slug));
const dramaSlugs = new Set(DRAMA.map((d) => d.slug));
for (const place of TRAVEL) {
  for (const drama of place.related?.dramas ?? []) {
    if (!dramaSlugs.has(drama)) fail("교차 참조", `travel/${place.slug} → drama/${drama} 없음`);
    else if (!DRAMA.find((d) => d.slug === drama).filmingPlaces.includes(place.slug)) {
      notes.push(`travel/${place.slug} → drama/${drama} 는 있는데 드라마 촬영지 목록에는 이 명소가 없다`);
    }
  }
}
for (const drama of DRAMA) {
  for (const place of drama.filmingPlaces ?? []) if (!placeSlugs.has(place)) fail("교차 참조", `drama/${drama.slug} → travel/${place} 없음`);
  for (const other of drama.similar ?? []) {
    if (!dramaSlugs.has(other)) fail("교차 참조", `drama/${drama.slug} → 비슷한 작품 ${other} 없음`);
    if (other === drama.slug) fail("교차 참조", `drama/${drama.slug}: 비슷한 작품에 자기 자신`);
  }
}

// ── 6. 뷰티 구매처·기능성 표현, 중국어 가나 ──
for (const product of BEAUTY) {
  const partners = product.buy.map((b) => b.partner);
  if (partners.length < 1 || partners.length > 4) fail("구매처", `beauty/${product.slug}: 구매처 ${partners.length}개 (1~4)`);
  if (new Set(partners).size !== partners.length) fail("구매처", `beauty/${product.slug}: 같은 파트너 두 번`);
  for (const [effect, words] of Object.entries(FUNCTIONAL_WORDS)) {
    if (product.functional?.includes(effect)) continue;
    for (const locale of LOCALES) {
      const entry = texts.beauty[locale].products?.[product.slug];
      for (const [path, value] of strings(entry ?? {}, product.slug)) {
        for (const word of words[locale] ?? []) {
          if (value.toLowerCase().includes(word.toLowerCase())) {
            fail("기능성 표현", `beauty/${locale} ${path}: 기능성(${effect}) 표기 없는 제품에 “${word}”`);
          }
        }
      }
    }
  }
}
// 가나 글자(일본어가 섞인 번역). 가타카나 가운뎃점 ・(U+30FB)은 문장부호라 참고로만 알린다 (중국어는 · 를 쓴다)
const KANA = /[぀-ヺー-ヿ]/;
for (const section of SECTIONS) {
  for (const locale of ["zh-TW", "zh-CN"]) {
    for (const [path, value] of strings(texts[section][locale])) {
      if (KANA.test(value)) fail("중국어 가나", `${section}/${locale} ${path}: ${value.slice(0, 60)}`);
      else if (value.includes("・")) notes.push(`${section}/${locale} ${path}: 일본어 가운뎃점 ・ → · 권장`);
    }
  }
}

// ── 7. 커버 (3D 아이콘·CC 사진, src/data/cover.ts) ──
// 모든 아이콘 키에 WebP(화면)와 PNG(원본·공유 이미지)가 있다 (항목·기본값이 표에 있는 키만 쓰는지는 타입 검사가 본다).
// 명소·동네 사진은 위키미디어 공용 원본 주소 + 허용 라이선스 + 저작자(BY 계열은 필수) + 설명 페이지
const { ICON3D } = await import(pathToFileURL(join(data, "icons3d.ts")).href);
const icons3d = join(root, "public", "icons3d");
for (const key of Object.keys(ICON3D)) {
  for (const ext of ["webp", "png"]) {
    if (!existsSync(join(icons3d, `${key}.${ext}`))) fail("커버", `public/icons3d/${key}.${ext} 없음 (node scripts/icons3d-fetch.mjs)`);
  }
}
const PHOTO_LICENSE = /^(CC0|Public domain|CC BY(-SA)? \d\.\d)$/i;
const AREA_PHOTOS = await items("travel", "AREA_PHOTOS");
const photos = [
  ...TRAVEL.flatMap((p) => (p.photo ? [[`travel/${p.slug}`, p.photo]] : [])),
  ...Object.entries(AREA_PHOTOS).map(([area, photo]) => [`travel 동네 ${area}`, photo]),
];
for (const [where, photo] of photos) {
  if (!/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[0-9a-f]\/[0-9a-f]{2}\/[^?#]+$/.test(photo.url)) fail("커버", `${where}: 공용 원본 주소가 아님 ${photo.url}`);
  if (!(photo.width > 0 && photo.height > 0)) fail("커버", `${where}: 원본 크기 없음`);
  if (!PHOTO_LICENSE.test(photo.licenseName)) fail("커버", `${where}: 허용하지 않는 라이선스 ${photo.licenseName}`);
  if (/BY/i.test(photo.licenseName) && !photo.author) fail("커버", `${where}: 저작자 없음 (${photo.licenseName})`);
  if (!photo.sourceUrl?.startsWith("https://commons.wikimedia.org/wiki/File:")) fail("커버", `${where}: 설명 페이지 주소가 아님`);
}

// 제품 사진(뷰티): 우리 /products/ 파일이 있고, OBF 사진이면 제품 페이지 + CC BY-SA·저작자 (직접 찍은 사진은 출처 없음).
// 쇼핑몰·제휴 이미지 주소는 받지 않는다
const { BEAUTY_PHOTOS } = await import(pathToFileURL(join(data, "beauty", "photos.ts")).href);
const BEAUTY_SLUGS = new Set(BEAUTY.map((p) => p.slug));
for (const [slug, photo] of Object.entries(BEAUTY_PHOTOS)) {
  const where = `beauty/${slug} 제품 사진`;
  if (!BEAUTY_SLUGS.has(slug)) fail("커버", `${where}: 카탈로그에 없는 제품`);
  if (photo.src !== `/products/${slug}.webp`)
    fail("커버", `${where}: 주소가 /products/${slug}.webp 가 아님 (${photo.src})`);
  else if (!existsSync(join(root, "public", photo.src)))
    fail("커버", `${where}: public${photo.src} 없음 (node scripts/product-photo.mjs ${slug})`);
  if (!(photo.width > 0 && photo.height > 0)) fail("커버", `${where}: 크기 없음`);
  if (photo.sourceUrl === null) continue; // 운영자가 직접 찍은 사진 (표기 없음)
  if (!PHOTO_LICENSE.test(photo.licenseName ?? "") || !photo.author)
    fail("커버", `${where}: 라이선스·저작자 (${photo.licenseName}, ${photo.author})`);
  if (!/^https:\/\/world\.openbeautyfacts\.org\/product\/\d+$/.test(photo.sourceUrl))
    fail("커버", `${where}: OBF 제품 페이지가 아님 ${photo.sourceUrl}`);
}

// ── 결과 ──
for (const note of notes) console.log(`참고: ${note}`);
if (failures.length > 0) {
  for (const f of failures) console.log(f);
  console.log(`\ncheck-catalog: ${failures.length}건 실패`);
  process.exit(1);
}
console.log(
  `check-catalog: 통과 — 뷰티 ${BEAUTY.length} · 명소 ${TRAVEL.length} · 시술 ${CLINIC.length} · 드라마 ${DRAMA.length}, ${LOCALES.length}개 언어`,
);
