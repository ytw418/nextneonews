#!/usr/bin/env node
// 위키미디어 공용 파일 이름 → 여행 명소·동네 커버 사진 객체(data/types.ts CoverPhoto). 출력을 travel/items.ts 에 붙여 넣는다.
// 사용: node apps/web/scripts/commons-photo.mjs "Myeongdong Cathedral 6.jpg" ["다른 파일.jpg" …]
// 라이선스는 CC0·공유 저작물·CC BY·CC BY-SA 만 받는다 (그 밖이면 오류). 사람이 주인공인 사진·간판 클로즈업은 사람이 걸러 낸다
const UA = "UnnieNoteBot/1.0 (https://unnienote.app)";
const ALLOWED = /^(CC0|Public domain|CC BY(-SA)? \d\.\d)$/i;

// 저작자 칸은 HTML 이다 (링크·span). 글자만 남긴다
const plain = (html) =>
  html
    ?.replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim() || null;

const files = process.argv.slice(2).map((f) => f.replace(/^File:/i, ""));
if (files.length === 0) {
  console.error('사용: node apps/web/scripts/commons-photo.mjs "<파일 이름>" …');
  process.exit(1);
}

const out = {};
for (const file of files) {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.search = new URLSearchParams({
    action: "query",
    titles: `File:${file}`,
    prop: "imageinfo",
    iiprop: "url|size|extmetadata|user",
    format: "json",
  }).toString();
  const page = Object.values((await (await fetch(url, { headers: { "User-Agent": UA } })).json()).query.pages)[0];
  const info = page.imageinfo?.[0];
  if (!info) {
    console.error(`없는 파일: ${file}`);
    process.exitCode = 1;
    continue;
  }
  const meta = info.extmetadata ?? {};
  const licenseName = plain(meta.LicenseShortName?.value) ?? "";
  if (!ALLOWED.test(licenseName)) {
    console.error(`쓸 수 없는 라이선스 (${licenseName}): ${file}`);
    process.exitCode = 1;
    continue;
  }
  // API 가 주소 끝에 추적용 ?utm_… 을 붙인다. 썸네일 주소를 만들 때 깨지므로 뗀다
  const bare = (u) => u.split("?")[0];
  out[file] = {
    url: bare(info.url),
    width: info.width,
    height: info.height,
    // 저작자 칸이 'Own work'(자기 작품) 표시뿐이면 올린 사람이 저작자다
    author: /int-own-work/.test(meta.Artist?.value ?? "") ? info.user : plain(meta.Artist?.value),
    licenseName,
    licenseUrl: meta.LicenseUrl?.value ?? null,
    sourceUrl: bare(info.descriptionurl),
  };
  await new Promise((r) => setTimeout(r, 300)); // 공용 서버 예의: 천천히
}
console.log(JSON.stringify(out, null, 2));
