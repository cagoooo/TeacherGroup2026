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
const appSource = read("app.js");
const pwaHealth = read("pwa-health.html");
const usageStatsPage = read("usage-stats.html");
const usageStatsSource = read("usage-stats.js");
const offlinePage = read("offline.html");
const brandAssets = JSON.parse(read("brand-assets.json"));
const qrManifest = JSON.parse(read("assets/qr-manifest.json"));
const gasManifest = JSON.parse(read("gas/appsscript.json"));
const gasCode = read("gas/Code.gs");
const operationsCode = read("gas/Operations.gs");
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
  assert(/\balt="[^"]*"/i.test(imageTag[0]), `圖片缺少替代文字屬性：${imageTag[0]}`);
}
assert(css.includes(":focus-visible"), "樣式表必須保留鍵盤 focus-visible 樣式");
assert(css.includes("@media (max-width: 620px)"), "樣式表必須保留手機版斷點");
assert(css.includes("@media (prefers-reduced-motion: reduce)"), "樣式表必須提供減少動態效果設定");
assert(css.includes("scroll-margin-top"), "頁內錨點必須保留 sticky header 的滾動間距");
assert(html.includes('class="mobile-quick-nav"'), "首頁缺少手機快速操作列");
assert(html.includes('class="back-to-top"'), "首頁缺少回到頁首入口");
assert(html.includes("data-activity-registration-status"), "首頁缺少活動報名狀態容器");
assert(html.includes("data-activity-registration-action"), "首頁缺少活動報名狀態控制入口");
assert(config.annualFee === "1,200", "annualFee 必須是 1,200");
assert(config.recreationFee === "300", "recreationFee 必須是 300");
assert(config.currentCollectionTotal === "1,500", "currentCollectionTotal 必須是 1,500");
assert(Array.isArray(config.activitySchedule) && config.activitySchedule.length === 4, "活動流程資料應有 4 筆");
assert(Array.isArray(config.activityReminders) && config.activityReminders.length === 5, "活動提醒資料應有 5 筆");
assert(Array.isArray(config.workshops) && config.workshops.length === 3, "多元研習資料應有 3 筆");
assert(Array.isArray(config.quickEntries) && config.quickEntries.length === 4, "快速入口資料應有 4 筆");
assert(Array.isArray(config.announcements) && config.announcements.length === 3, "公告資料應有 3 筆");
for (const key of ["activityRegistrationStartsAt", "activityRegistrationEndsAt", "activityEventEndsAt"]) {
  assert(!Number.isNaN(new Date(config[key]).getTime()), `活動狀態欄位日期格式錯誤：${key}`);
}
for (const workshop of config.workshops ?? []) {
  const startsAt = new Date(workshop.registrationStartsAt);
  const endsAt = new Date(workshop.registrationEndsAt);
  assert(!Number.isNaN(startsAt.getTime()) && !Number.isNaN(endsAt.getTime()) && startsAt < endsAt, `研習報名日期順序錯誤：${workshop.id}`);
  if (workshop.eventEndsAt) assert(new Date(workshop.eventEndsAt) > endsAt, `研習活動結束日期錯誤：${workshop.id}`);
}
assert(config.usageAnalytics?.provider === "gas-sheets", "使用統計後端必須標示為 gas-sheets");
assert(typeof config.usageAnalytics?.enabled === "boolean", "使用統計後端必須明確標示 enabled");
assert(config.usageAnalytics?.enabled === false || /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(config.usageAnalytics?.endpoint ?? ""), "啟用中央統計時必須使用 GAS Web App /exec 網址");

for (const entry of config.quickEntries ?? []) {
  assert(entry.qrUrl?.startsWith("https://cagoooo.github.io/TeacherGroup2026/"), `QR 必須指向本站公開網址：${entry.id}`);
  assert(!/[?&](name|email|phone|member|account|roster)=/i.test(entry.qrUrl ?? ""), `QR 不可包含個資參數：${entry.id}`);
  assert(entry.href?.startsWith("#"), `快速入口必須使用頁內錨點：${entry.id}`);
}

for (const announcement of config.announcements ?? []) {
  assert(new Date(announcement.startsAt) < new Date(announcement.archiveAt), `公告日期順序錯誤：${announcement.id}`);
  assert(announcement.href?.startsWith("#"), `公告必須使用頁內錨點：${announcement.id}`);
}

for (const match of html.matchAll(/data-value="([^"]+)"/g)) {
  const key = match[1];
  assert(Object.prototype.hasOwnProperty.call(config, key), `HTML 使用了不存在的資料欄位：${key}`);
}

for (const requiredText of [
  "校內會員專屬康樂費",
  "本次收費明細",
  "工會款由財務長統一匯款",
  "手機與列印快速入口",
  "最新公告與歷史宣導",
  "只包含公開頁面連結",
  "data-render-list=\"activity-schedule\"",
  "data-render-list=\"activity-reminders\"",
  "data-render-list=\"workshops\"",
  "data-render-list=\"quick-entries\"",
  "data-render-list=\"announcements\""
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
assert(operationsCode.includes(`'${versionData.version}'`), "GAS 支援版本清單缺少本次網站版本；請先更新後端再發布前端");
assert(sw.includes(`const BUILD_VERSION = '${versionData.version}';`), "sw.js 版本與 version.json 不一致");
assert(html.includes(`window.SITE_VERSION = '${versionData.version}';`), "index.html SITE_VERSION 與 version.json 不一致");

const versionedAssetNames = ["styles.css", "site-data.js", "usage-stats.js", "app.js", "sw-register.js", "assets/og-image.png"];
for (const assetName of versionedAssetNames) {
  assert(html.includes(`${assetName}?v=${versionData.version}`), `資源缺少版本參數：${assetName}`);
}

const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
assert(ogImageMatch && ogImageMatch[1].startsWith("https://"), "og:image 必須使用絕對 HTTPS 網址");
assert(ogImageMatch?.[1].includes(`?v=${versionData.version}`), "og:image 缺少目前版本快取參數");
assert(html.includes('<meta property="og:image:width" content="1200">'), "OG 圖缺少 1200 寬度標記");
assert(html.includes('<meta property="og:image:height" content="630">'), "OG 圖缺少 630 高度標記");
assert(html.includes(`usage-stats.js?v=${versionData.version}`), "首頁缺少版本化 usage-stats.js");

assert(pwaHealth.includes(`window.SITE_VERSION = '${versionData.version}';`), "pwa-health.html 版本與 version.json 不一致");
assert(usageStatsPage.includes(`usage-stats.js?v=${versionData.version}`), "usage-stats.html 缺少版本化 usage-stats.js");
assert(usageStatsPage.includes(`site-data.js?v=${versionData.version}`), "usage-stats.html 缺少版本化 site-data.js");
assert(offlinePage.includes("返回會員服務首頁"), "offline.html 缺少回首頁入口");
assert(sw.includes("'./offline.html'") && sw.includes("'./pwa-health.html'") && sw.includes("'./usage-stats.html'"), "Service Worker 缺少 PWA／離線頁預快取");
assert(sw.includes("caches.match('./offline.html')"), "Service Worker 缺少離線 fallback");
assert(usageStatsSource.includes("navigator.sendBeacon") && usageStatsSource.includes("mode: \"no-cors\""), "中央匿名統計必須使用非阻塞傳輸");
assert(!usageStatsSource.includes("document.cookie") && !usageStatsSource.includes("navigator.userAgent") && !usageStatsSource.includes("location.href"), "匿名統計不可讀取 Cookie、User-Agent 或完整網址");
assert(usageStatsSource.includes("event: eventName") && usageStatsSource.includes("siteVersion"), "中央匿名統計 payload 只能包含固定事件與網站版本");
assert(usageStatsPage.includes("不等同於去重後的老師人數"), "統計頁必須說明事件次數不等同於老師人數");
assert(brandAssets.officialLogoAuthorized === false, "尚未取得正式 logo 授權時，brand-assets.json 必須保持 provisional");
assert(brandAssets.assets?.favicon === "assets/favicon.svg", "品牌資產 manifest 必須指向既有 favicon");
assert(gasManifest.webapp?.executeAs === "USER_DEPLOYING" && gasManifest.webapp?.access === "ANYONE_ANONYMOUS", "GAS Web App manifest 必須以部署者執行並允許匿名寫入");
assert(gasCode.includes("ALLOWED_EVENTS") && gasCode.includes("initializeBackend") && gasCode.includes("LockService"), "GAS 後端缺少固定事件白名單、初始化或並發鎖");
assert(!gasCode.includes("Session.getActiveUser") && !gasCode.includes("Session.getEffectiveUser") && !gasCode.includes("e.parameter.userAgent") && !gasCode.includes("e.parameter.ip"), "匿名接收程式不可讀取訪客身分；管理登入限定 Operations.gs");
for (const stateLabel of ["尚未開放", "報名中", "報名已截止", "活動已結束"]) {
  assert(appSource.includes(stateLabel), `前端缺少活動狀態：${stateLabel}`);
}
assert(appSource.includes("Escape"), "選單必須支援 Escape 關閉並回復焦點");

const ogPath = resolve(root, "assets", "og-image.png");
assert(existsSync(ogPath), "找不到 assets/og-image.png");
if (existsSync(ogPath)) {
  const image = readFileSync(ogPath);
  assert(image.length < 8 * 1024 * 1024, "OG 圖檔案不可超過 8 MB");
  assert(image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), "OG 圖必須是 PNG");
  assert(image.readUInt32BE(16) === 1200 && image.readUInt32BE(20) === 630, "OG 圖尺寸必須是 1200×630");
}

const qrEntriesById = new Map((qrManifest.entries ?? []).map((entry) => [entry.id, entry]));
assert(qrManifest.entries?.length === config.quickEntries?.length, "QR manifest 與快速入口數量不一致");
for (const entry of config.quickEntries ?? []) {
  const qrEntry = qrEntriesById.get(entry.id);
  assert(qrEntry?.decoded === true, `QR 尚未完成解碼驗證：${entry.id}`);
  assert(qrEntry?.url === entry.qrUrl, `QR 內容與資料來源不一致：${entry.id}`);
  const qrPath = resolve(root, entry.qrAsset);
  assert(existsSync(qrPath), `找不到 QR 圖：${entry.qrAsset}`);
  if (existsSync(qrPath)) {
    const qrImage = readFileSync(qrPath);
    assert(qrImage.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `QR 必須是 PNG：${entry.id}`);
    const qrWidth = qrImage.readUInt32BE(16);
    const qrHeight = qrImage.readUInt32BE(20);
    assert(qrWidth === qrHeight && qrWidth >= 256, `QR 尺寸需為正方形且至少 256×256：${entry.id}`);
    assert(qrEntry.width === qrWidth && qrEntry.height === qrHeight, `QR manifest 尺寸不一致：${entry.id}`);
  }
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
