#!/usr/bin/env node

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const read = (relativePath) => readFileSync(resolve(root, relativePath), "utf8");
const failures = [];

const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const html = read("index.html");
const css = read("styles.css");
const siteDataSource = read("site-data.js");
const manifest = JSON.parse(read("site.webmanifest"));
const versionData = JSON.parse(read("version.json"));
const sw = read("sw.js");
const sandbox = { window: {} };
vm.runInNewContext(siteDataSource, sandbox, { filename: "site-data.js" });
const config = sandbox.window.SITE_CONFIG;

assert(config && typeof config === "object", "SITE_CONFIG 未成功建立");
assert(/<html\s+lang="zh-Hant"/i.test(html), "首頁必須標示繁體中文語系");
assert(/<meta\s+name="viewport"\s+content="width=device-width, initial-scale=1"/i.test(html), "首頁缺少行動裝置 viewport");
assert(html.includes('class="skip-link" href="#main-content"'), "首頁缺少跳到主要內容連結");
assert(html.includes('<main id="main-content">'), "首頁缺少主要內容 landmark");
assert((html.match(/<h1\b/g) ?? []).length === 1, "首頁應保留單一 h1 標題");
for (const imageTag of html.matchAll(/<img\b[^>]*>/gi)) {
  assert(/\balt="[^"]+"/i.test(imageTag[0]), `圖片缺少替代文字：${imageTag[0]}`);
}
assert(css.includes(":focus-visible"), "樣式表必須保留鍵盤 focus-visible 樣式");
assert(css.includes("@media (max-width: 620px)"), "樣式表必須保留手機版斷點");
assert(config.annualFee === "1,200", "annualFee 必須是 1,200");
assert(config.recreationFee === "300", "recreationFee 必須是 300");
assert(config.currentCollectionTotal === "1,500", "currentCollectionTotal 必須是 1,500");
assert(Array.isArray(config.activitySchedule) && config.activitySchedule.length === 4, "活動流程資料應有 4 筆");
assert(Array.isArray(config.activityReminders) && config.activityReminders.length === 5, "活動提醒資料應有 5 筆");
assert(Array.isArray(config.workshops) && config.workshops.length === 3, "多元研習資料應有 3 筆");

for (const match of html.matchAll(/data-value="([^"]+)"/g)) {
  const key = match[1];
  assert(Object.prototype.hasOwnProperty.call(config, key), `HTML 使用了不存在的資料欄位：${key}`);
}

for (const requiredText of [
  "校內會員專屬康樂費",
  "本次收費明細",
  "工會款由財務長統一匯款",
  "data-render-list=\"activity-schedule\"",
  "data-render-list=\"activity-reminders\"",
  "data-render-list=\"workshops\""
]) {
  assert(html.includes(requiredText), `首頁缺少必要內容：${requiredText}`);
}

for (const forbiddenText of [
  "現在預繳，免收",
  "繳費名冊與收據要怎麼回傳",
  "支會長統一匯款",
  "支會長一次匯款",
  "支會長完成匯款",
  "新明國小"
]) {
  assert(!html.includes(forbiddenText), `首頁出現禁止回歸文字：${forbiddenText}`);
}

assert(versionData.version, "version.json 缺少 version");
assert(sw.includes(`const BUILD_VERSION = '${versionData.version}';`), "sw.js 版本與 version.json 不一致");
assert(html.includes(`window.SITE_VERSION = '${versionData.version}';`), "index.html SITE_VERSION 與 version.json 不一致");

const versionedAssetNames = ["styles.css", "site-data.js", "app.js", "sw-register.js", "assets/og-image.png"];
for (const assetName of versionedAssetNames) {
  assert(html.includes(`${assetName}?v=${versionData.version}`), `資源缺少版本參數：${assetName}`);
}

const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
assert(ogImageMatch && ogImageMatch[1].startsWith("https://"), "og:image 必須使用絕對 HTTPS 網址");
assert(ogImageMatch?.[1].includes(`?v=${versionData.version}`), "og:image 缺少目前版本快取參數");
assert(html.includes('<meta property="og:image:width" content="1200">'), "OG 圖缺少 1200 寬度標記");
assert(html.includes('<meta property="og:image:height" content="630">'), "OG 圖缺少 630 高度標記");

const ogPath = resolve(root, "assets", "og-image.png");
assert(existsSync(ogPath), "找不到 assets/og-image.png");
if (existsSync(ogPath)) {
  const image = readFileSync(ogPath);
  assert(image.length < 8 * 1024 * 1024, "OG 圖檔案不可超過 8 MB");
  assert(image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), "OG 圖必須是 PNG");
  assert(image.readUInt32BE(16) === 1200 && image.readUInt32BE(20) === 630, "OG 圖尺寸必須是 1200×630");
}

const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]));
for (const match of html.matchAll(/href="#([^"?]+)"/g)) {
  assert(ids.has(match[1]), `頁內連結找不到目標：#${match[1]}`);
}

assert(manifest.lang === "zh-Hant", "manifest 語系必須是 zh-Hant");
assert(manifest.icons?.length >= 4, "manifest 應保留完整 PWA 圖示組");

if (failures.length) {
  console.error(`❌ site checks failed (${failures.length})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`✅ site checks passed: version ${versionData.version}, ${config.workshops.length} workshops, ${config.activitySchedule.length} activity steps`);
