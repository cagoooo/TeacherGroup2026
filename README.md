# TeacherGroup2026

桃園市教育產業工會石門國小支會的 116 年度會員服務暨活動宣導靜態網站。

🌐 **線上網站**：https://cagoooo.github.io/TeacherGroup2026/

## 內容依據

- 桃園市教育產業工會 115 年 8 月 28 日公文
- 116 年度桃園市教育產業工會會費優惠案
- 桃園市教育產業工會新進會員入會申請表
- 桃園市教育產業工會 115 年 9 月 3 日公文（桃市教工字第 1150000075 號）
- 桃園市教育產業工會 115 年度 928 教師節活動計畫

## 維護方式

年度、費用、匯款帳戶、聯絡資訊與官方連結集中於 `site-data.js`；更新年度活動時，先以工會最新正式文件核對，再修改該檔與相應文案。

本 repository 不收錄含收件人資料的原始公文，也不在網站蒐集會員個資。石門國小支會由教師小組代收舊會員會費，再由財務長統合匯款；新進及中斷會員由支會長協助入會與後台建檔。

活動宣導區的報名連結與活動專屬頁均以最新工會公文為準；活動報名採外部表單，網站不代收報名資料。活動日期、報名期間與注意事項更新前，請先核對工會最新正式文件。

## 網站圖示與社群分享

`assets/` 已包含 favicon、Apple Touch icon、Android maskable icon 與 1200×630 的 `og-image.png`。`index.html` 使用 GitHub Pages 的絕對 OG 圖網址，並附版本參數；日後替換 OG 圖時，請同步更新該參數，協助 LINE、Facebook 重新抓取新版預覽。

網站已加入 Service Worker 版本更新提示：新版會先在背景下載，使用者按下「立即更新」後才套用並重新整理。日後部署內容更新前，請執行 `powershell -ExecutionPolicy Bypass -File scripts/bump-version.ps1 -Notes "更新說明"`，同步提升 `version.json`、`sw.js`、`index.html` 與資源版本字串。
