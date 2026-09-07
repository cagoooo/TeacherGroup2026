#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const inputPath = resolve(root, process.env.OG_INPUT ?? "assets/og-image.png");
const outputPath = resolve(root, process.env.OG_OUTPUT ?? "assets/og-image.png");
const siteDataSource = readFileSync(resolve(root, "site-data.js"), "utf8");
const sandbox = { window: {} };
vm.runInNewContext(siteDataSource, sandbox, { filename: "site-data.js" });
const config = sandbox.window.SITE_CONFIG;

const fontCandidates = [
  process.env.OG_FONT_PATH,
  resolve(root, "scripts/fonts/NotoSansTC-Subset.ttf"),
  "C:/Windows/Fonts/msjhbd.ttc",
  "C:/Windows/Fonts/msjh.ttc"
].filter(Boolean);
const fontPath = fontCandidates.find((candidate) => existsSync(candidate));

if (!fontPath) {
  throw new Error("找不到繁中文字型；請設定 OG_FONT_PATH，或提供 scripts/fonts/NotoSansTC-Subset.ttf。\n" + fontCandidates.join("\n"));
}

if (!existsSync(inputPath)) throw new Error(`找不到輸入圖片：${inputPath}`);

GlobalFonts.registerFromPath(fontPath, "JhengHei");
GlobalFonts.registerFromPath(fontPath, "JhengHeiBold");

const source = await loadImage(inputPath);
if (source.width !== 1200 || source.height !== 630) {
  throw new Error(`輸入圖片尺寸必須是 1200×630，目前是 ${source.width}×${source.height}`);
}

const canvas = createCanvas(1200, 630);
const ctx = canvas.getContext("2d");
ctx.drawImage(source, 0, 0, 1200, 630);

// 先清除原圖兩行較長的舊說明，避免費用區重排後留下殘字。
ctx.fillStyle = "#fffaf0";
ctx.fillRect(54, 284, 670, 58);
ctx.fillStyle = "#163f79";
ctx.font = '700 24px "JhengHei"';
ctx.fillText("116 年度會員服務與校內收費說明", 70, 320);

// 原始海報的左側費用區保持同一個奶油色背景，只替換成目前校內實收拆分。
ctx.fillStyle = "#fffaf0";
ctx.fillRect(54, 337, 548, 111);

ctx.fillStyle = "#163f79";
ctx.font = '700 20px "JhengHei"';
ctx.fillText("本次石門國小會員收費", 70, 365);

ctx.fillStyle = "#273a4d";
ctx.font = '700 22px "JhengHei"';
ctx.fillText("工會會費／入會費", 70, 400);
ctx.fillStyle = "#cf3b2f";
ctx.font = '900 34px "JhengHeiBold"';
ctx.fillText(`${config.joinFee} 元`, 315, 401);

ctx.fillStyle = "#16764c";
ctx.font = '700 22px "JhengHei"';
ctx.fillText("＋校內康樂費", 70, 436);
ctx.fillStyle = "#cf3b2f";
ctx.font = '900 30px "JhengHeiBold"';
ctx.fillText(`${config.recreationFee} 元 ＝ ${config.currentCollectionTotal} 元`, 260, 437);

const output = canvas.toBuffer("image/png");
writeFileSync(outputPath, output);
console.log(`✅ OG 圖已產生：${outputPath}`);
console.log(`   尺寸：1200×630；大小：${output.length} bytes；字型：${fontPath}`);
console.log(`   費用：${config.joinFee}＋${config.recreationFee}＝${config.currentCollectionTotal}`);
