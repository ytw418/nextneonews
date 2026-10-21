// App Store Connect API 작은 도우미 (키는 ~/.appstoreconnect/eas.env, 값을 출력하지 않는다)
import { readFileSync } from "node:fs";
import { createSign } from "node:crypto";
import { homedir } from "node:os";
const env = {};
for (const line of readFileSync(`${homedir()}/.appstoreconnect/eas.env`, "utf8").split("\n")) {
  const m = line.match(/^(?:export\s+)?(\w+)=["']?(.*?)["']?$/);
  if (m) env[m[1]] = m[2].replace(/^(~|\$HOME|\$\{HOME\})/, homedir());
}
const keyPath = env.EXPO_ASC_API_KEY_PATH;
const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
function token() {
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: "ES256", kid: env.EXPO_ASC_KEY_ID, typ: "JWT" });
  const body = b64({ iss: env.EXPO_ASC_ISSUER_ID, iat: now, exp: now + 1100, aud: "appstoreconnect-v1" });
  const sig = createSign("SHA256").update(`${head}.${body}`).sign({ key: readFileSync(keyPath, "utf8"), dsaEncoding: "ieee-p1363" }, "base64url");
  return `${head}.${body}.${sig}`;
}
export async function asc(method, path, body) {
  const res = await fetch(`https://api.appstoreconnect.apple.com${path}`, { method, headers: { authorization: `Bearer ${token()}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}
if (process.argv[1]?.endsWith("asc.mjs") && process.argv[2]) {
  const [m, p, b] = process.argv.slice(2);
  const r = await asc(m, p, b ? JSON.parse(b) : undefined);
  console.log(r.status, JSON.stringify(r.json, null, 1)?.slice(0, 4000));
}
