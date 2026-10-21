// 언니노트 App Store 설정 (App Store Connect API). 앱 레코드가 생긴 뒤에 돈다.
//   node asc-setup.mjs <step> --app <APP_ID> [--build N] [--dry-run]
//   step: status | meta | rating | price | review | shots | submit
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { asc } from "/tmp/unnie-tools/asc.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const step = process.argv[2];
const APP = arg("app");
const DRY = process.argv.includes("--dry-run");
if (!APP) throw new Error("--app <APP_ID>");
const meta = JSON.parse(readFileSync("/tmp/unnie-store/metadata.json", "utf8"));
const LOCALES = Object.keys(meta.appStore); // en-US ja zh-Hant zh-Hans ko vi id fr-FR ru
const ok = (label, r) => { console.log(label, r.status, r.status >= 300 ? r.text.slice(0, 6000) : ""); return r; };
const call = async (m, p, b) => (DRY && m !== "GET" ? (console.log("DRY", m, p), { status: 0, json: {} }) : asc(m, p, b));

async function version() {
  const r = await asc("GET", `/v1/apps/${APP}/appStoreVersions?filter[platform]=IOS&limit=5`);
  return r.json.data.find((v) => ["PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED", "METADATA_REJECTED", "INVALID_BINARY"].includes(v.attributes.appStoreState)) ?? r.json.data[0];
}
async function appInfo() {
  const r = await asc("GET", `/v1/apps/${APP}/appInfos`);
  return r.json.data.find((i) => i.attributes.state !== "READY_FOR_DISTRIBUTION") ?? r.json.data[0];
}

if (step === "status") {
  const v = await version();
  console.log("version", v.id, JSON.stringify(v.attributes));
  const info = await appInfo();
  console.log("appInfo", info.id, JSON.stringify(info.attributes));
  const locs = await asc("GET", `/v1/appStoreVersions/${v.id}/appStoreVersionLocalizations?limit=50`);
  console.log("version locales", locs.json.data.map((l) => l.attributes.locale).join(","));
}

if (step === "meta") {
  const v = await version();
  ok("version", await call("PATCH", `/v1/appStoreVersions/${v.id}`, { data: { type: "appStoreVersions", id: v.id, attributes: { versionString: "1.0.0", copyright: meta.shared.copyright, releaseType: "AFTER_APPROVAL" } } }));
  const info = await appInfo();
  ok("categories", await call("PATCH", `/v1/appInfos/${info.id}`, { data: { type: "appInfos", id: info.id, relationships: {
    primaryCategory: { data: { type: "appCategories", id: "ENTERTAINMENT" } },
    secondaryCategory: { data: { type: "appCategories", id: "LIFESTYLE" } } } } }));
  const infoLocs = (await asc("GET", `/v1/appInfos/${info.id}/appInfoLocalizations?limit=50`)).json.data;
  const verLocs = (await asc("GET", `/v1/appStoreVersions/${v.id}/appStoreVersionLocalizations?limit=50`)).json.data;
  for (const locale of LOCALES) {
    const m = meta.appStore[locale];
    const privacy = meta.shared.privacyUrl.replace("/en/", `/${{ "en-US": "en", ja: "ja", "zh-Hant": "zh-tw", "zh-Hans": "zh-cn", ko: "ko", vi: "vi", id: "id", "fr-FR": "fr", ru: "ru" }[locale]}/`);
    const infoAttrs = { name: m.name, subtitle: m.subtitle, privacyPolicyUrl: privacy };
    const il = infoLocs.find((l) => l.attributes.locale === locale);
    ok(`info ${locale}`, il
      ? await call("PATCH", `/v1/appInfoLocalizations/${il.id}`, { data: { type: "appInfoLocalizations", id: il.id, attributes: infoAttrs } })
      : await call("POST", "/v1/appInfoLocalizations", { data: { type: "appInfoLocalizations", attributes: { locale, ...infoAttrs }, relationships: { appInfo: { data: { type: "appInfos", id: info.id } } } } }));
    const verAttrs = { description: m.description, keywords: m.keywords, promotionalText: m.promotionalText, supportUrl: meta.shared.supportUrl, marketingUrl: meta.shared.marketingUrl };
    const vl = verLocs.find((l) => l.attributes.locale === locale);
    ok(`version ${locale}`, vl
      ? await call("PATCH", `/v1/appStoreVersionLocalizations/${vl.id}`, { data: { type: "appStoreVersionLocalizations", id: vl.id, attributes: verAttrs } })
      : await call("POST", "/v1/appStoreVersionLocalizations", { data: { type: "appStoreVersionLocalizations", attributes: { locale, ...verAttrs }, relationships: { appStoreVersion: { data: { type: "appStoreVersions", id: v.id } } } } }));
  }
}

if (step === "rating") {
  // 연령 등급: 연예 보도에서 약물·사건이 글로 가끔 언급될 수 있음(약하게·드물게), 나머지 없음. 앱 안 웹은 우리 사이트로만 묶여 있어 무제한 웹 접근 아님
  const info = await appInfo();
  const d = (await asc("GET", `/v1/appInfos/${info.id}/ageRatingDeclaration`)).json.data;
  console.log("current", JSON.stringify(d.attributes));
  const attrs = {};
  for (const [k, v] of Object.entries(d.attributes)) {
    if (["kidsAgeBand", "gracRatingClassificationNumber", "developerAgeRatingInfoUrl", "socialMediaAgeRestricted", "ageRatingOverride", "koreaAgeRatingOverride", "ageRatingOverrideV2"].includes(k)) continue;
    if (typeof v === "boolean" || ["gambling", "unrestrictedWebAccess", "lootBox", "advertising", "ageAssurance", "healthOrWellnessTopics", "messagingAndChat", "parentalControls", "userGeneratedContent", "socialMedia"].includes(k)) attrs[k] = false;
    else attrs[k] = "NONE";
  }
  attrs.alcoholTobaccoOrDrugUseOrReferences = "INFREQUENT_OR_MILD";
  attrs.matureOrSuggestiveThemes = "INFREQUENT_OR_MILD";
  ok("rating", await call("PATCH", `/v1/ageRatingDeclarations/${d.id}`, { data: { type: "ageRatingDeclarations", id: d.id, attributes: attrs } }));
}

if (step === "price") {
  const points = (await asc("GET", `/v1/apps/${APP}/appPricePoints?filter[territory]=USA&limit=200`)).json.data;
  const free = points.find((p) => Number(p.attributes.customerPrice) === 0);
  ok("price", await call("POST", "/v1/appPriceSchedules", {
    data: { type: "appPriceSchedules", relationships: { app: { data: { type: "apps", id: APP } }, baseTerritory: { data: { type: "territories", id: "USA" } }, manualPrices: { data: [{ type: "appPrices", id: "${free}" }] } } },
    included: [{ type: "appPrices", id: "${free}", attributes: { startDate: null }, relationships: { appPricePoint: { data: { type: "appPricePoints", id: free.id } } } }],
  }));
  // 판매 국가: 모든 나라(EU 포함, 사용자 결정 10-21). 중국 본토는 ICP 备案 이 필요해 뺀다
  const terr = (await asc("GET", "/v1/territories?limit=200")).json.data.map((t) => t.id);
  ok(`availability (${terr.length})`, await call("POST", "/v2/appAvailabilities", {
    data: { type: "appAvailabilities", attributes: { availableInNewTerritories: true }, relationships: { app: { data: { type: "apps", id: APP } }, territoryAvailabilities: { data: terr.map((id) => ({ type: "territoryAvailabilities", id: `\${${id}}` })) } } },
    included: terr.map((id) => ({ type: "territoryAvailabilities", id: `\${${id}}`, attributes: { available: id !== "CHN" }, relationships: { territory: { data: { type: "territories", id } } } })),
  }));
}

if (step === "review") {
  // 심사 연락처는 같은 개발자의 브리디 앱 것과 같게 (값은 출력하지 않는다)
  const bv = (await asc("GET", "/v1/apps/6822154153/appStoreVersions?limit=1")).json.data[0];
  const b = (await asc("GET", `/v1/appStoreVersions/${bv.id}/appStoreReviewDetail`)).json.data.attributes;
  const v = await version();
  const attrs = { contactFirstName: b.contactFirstName, contactLastName: b.contactLastName, contactPhone: b.contactPhone, contactEmail: b.contactEmail, demoAccountRequired: false, notes: meta.reviewNotes };
  const cur = await asc("GET", `/v1/appStoreVersions/${v.id}/appStoreReviewDetail`);
  ok("review", cur.json?.data
    ? await call("PATCH", `/v1/appStoreReviewDetails/${cur.json.data.id}`, { data: { type: "appStoreReviewDetails", id: cur.json.data.id, attributes: attrs } })
    : await call("POST", "/v1/appStoreReviewDetails", { data: { type: "appStoreReviewDetails", attributes: attrs, relationships: { appStoreVersion: { data: { type: "appStoreVersions", id: v.id } } } } }));
}

if (step === "shots") {
  const DISPLAY = "APP_IPHONE_67"; // 6.9" 1320x2868 도 이 세트로 받는다 (브리디와 같음)
  const ORDER = ["01-home", "02-feed", "03-rankings", "07-beauty", "04-schedule", "06-saved"];
  const PREFIX = process.env.ONLY ? Object.fromEntries(process.env.ONLY.split(",").map((p) => p.split(":"))) : { "en-US": "en", ja: "ja", ko: "ko", "zh-Hant": "zh-Hant" };
  const v = await version();
  const verLocs = (await asc("GET", `/v1/appStoreVersions/${v.id}/appStoreVersionLocalizations?limit=50`)).json.data;
  for (const [locale, prefix] of Object.entries(PREFIX)) {
    const loc = verLocs.find((l) => l.attributes.locale === locale);
    if (!loc) { console.log("no localization", locale); continue; }
    const sets = (await asc("GET", `/v1/appStoreVersionLocalizations/${loc.id}/appScreenshotSets`)).json.data;
    let set = sets.find((s) => s.attributes.screenshotDisplayType === DISPLAY);
    if (!set) set = (await call("POST", "/v1/appScreenshotSets", { data: { type: "appScreenshotSets", attributes: { screenshotDisplayType: DISPLAY }, relationships: { appStoreVersionLocalization: { data: { type: "appStoreVersionLocalizations", id: loc.id } } } } })).json.data;
    const existing = (await asc("GET", `/v1/appScreenshotSets/${set.id}/appScreenshots?limit=20`)).json.data;
    for (const s of existing) await call("DELETE", `/v1/appScreenshots/${s.id}`);
    const ids = [];
    for (const name of ORDER) {
      const file = `/tmp/unnie-store/shots/${prefix}-${name}.png`;
      const buf = readFileSync(file);
      const shot = (await call("POST", "/v1/appScreenshots", { data: { type: "appScreenshots", attributes: { fileName: `${prefix}-${name}.png`, fileSize: buf.length }, relationships: { appScreenshotSet: { data: { type: "appScreenshotSets", id: set.id } } } } })).json.data;
      if (DRY) continue;
      for (const op of shot.attributes.uploadOperations) {
        await fetch(op.url, { method: op.method, headers: Object.fromEntries(op.requestHeaders.map((h) => [h.name, h.value])), body: buf.subarray(op.offset, op.offset + op.length) });
      }
      ok(`shot ${locale} ${name}`, await asc("PATCH", `/v1/appScreenshots/${shot.id}`, { data: { type: "appScreenshots", id: shot.id, attributes: { uploaded: true, sourceFileChecksum: createHash("md5").update(buf).digest("hex") } } }));
      ids.push(shot.id);
    }
  }
}

if (step === "submit") {
  const number = arg("build");
  if (!number) throw new Error("--build N");
  let build;
  for (let i = 0; i < 60; i++) {
    const r = await asc("GET", `/v1/builds?filter[app]=${APP}&filter[version]=${number}&limit=5`);
    build = r.json.data[0];
    if (build?.attributes.processingState === "VALID") break;
    console.log(`build ${number} ${build?.attributes.processingState ?? "아직 없음"} — 30초 뒤`);
    await new Promise((res) => setTimeout(res, 30000));
  }
  if (build?.attributes.processingState !== "VALID") throw new Error("build not VALID");
  const v = await version();
  ok("attach build", await call("PATCH", `/v1/appStoreVersions/${v.id}/relationships/build`, { data: { type: "builds", id: build.id } }));
  const open = (await asc("GET", `/v1/reviewSubmissions?filter[app]=${APP}&filter[platform]=IOS&filter[state]=READY_FOR_REVIEW`)).json.data;
  const sub = open[0] ?? (await call("POST", "/v1/reviewSubmissions", { data: { type: "reviewSubmissions", attributes: { platform: "IOS" }, relationships: { app: { data: { type: "apps", id: APP } } } } })).json.data;
  ok("item", await call("POST", "/v1/reviewSubmissionItems", { data: { type: "reviewSubmissionItems", relationships: { reviewSubmission: { data: { type: "reviewSubmissions", id: sub.id } }, appStoreVersion: { data: { type: "appStoreVersions", id: v.id } } } } }));
  ok("submit", await call("PATCH", `/v1/reviewSubmissions/${sub.id}`, { data: { type: "reviewSubmissions", id: sub.id, attributes: { submitted: true } } }));
}
