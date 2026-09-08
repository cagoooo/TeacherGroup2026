#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const source = readFileSync(resolve(root, "site-data.js"), "utf8");
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: "site-data.js" });
const entries = sandbox.window.SITE_CONFIG?.quickEntries;

if (!Array.isArray(entries) || entries.length === 0) {
  throw new Error("site-data.js 缺少 quickEntries，無法產製 QR Code。");
}

const assetsDir = resolve(root, "assets");
mkdirSync(assetsDir, { recursive: true });
const manifest = [];

for (const entry of entries) {
  if (!entry.qrUrl.startsWith("https://cagoooo.github.io/TeacherGroup2026/")) {
    throw new Error(`QR 連結不是本站公開網址：${entry.id}`);
  }
  if (/[?&](name|email|phone|member|account|roster)=/i.test(entry.qrUrl)) {
    throw new Error(`QR 連結疑似含有會員或個資參數：${entry.id}`);
  }

  const outputPath = resolve(root, entry.qrAsset);
  const buffer = await QRCode.toBuffer(entry.qrUrl, {
    type: "png",
    width: 512,
    margin: 4,
    errorCorrectionLevel: "H",
    color: { dark: "#063b84", light: "#fffaf0" }
  });
  writeFileSync(outputPath, buffer);

  const image = await loadImage(buffer);
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, image.width, image.height);
  const decoded = jsQR(pixels.data, image.width, image.height, { inversionAttempts: "attemptBoth" });
  if (!decoded || decoded.data !== entry.qrUrl) {
    throw new Error(`QR 解碼驗證失敗：${entry.id}`);
  }

  manifest.push({
    id: entry.id,
    title: entry.title,
    url: entry.qrUrl,
    asset: entry.qrAsset,
    width: image.width,
    height: image.height,
    errorCorrectionLevel: "H",
    decoded: true
  });
}

const manifestPath = resolve(assetsDir, "qr-manifest.json");
writeFileSync(manifestPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), entries: manifest }, null, 2)}\n`, "utf8");
console.log(`✅ QR 已產製並逐張解碼驗證：${manifest.length} 張；manifest：${manifestPath}`);
