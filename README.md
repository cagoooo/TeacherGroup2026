# TeacherGroup2026

> 📌 **建置版本：2026.09.08-5**（依據 `version.json`）｜管理後端 **2.0.1**

桃園市教育產業工會石門國小支會的 116 年度會員服務暨活動宣導靜態網站。

🌐 **線上網站**：https://cagoooo.github.io/TeacherGroup2026/

## 內容依據

- 桃園市教育產業工會 115 年 8 月 28 日公文
- 116 年度桃園市教育產業工會會費優惠案
- 桃園市教育產業工會新進會員入會申請表
- 桃園市教育產業工會 115 年 9 月 3 日公文（桃市教工字第 1150000075 號）
- 桃園市教育產業工會 115 年度 928 教師節活動計畫
- 桃園市教師會 115 年 9 月 4 日公文（桃市教師字第 1150000065 號）及三份 9、10 月學校多元研習計畫

## 維護方式

年度、費用、匯款帳戶、聯絡資訊與官方連結集中於 `site-data.js`；目前本次石門國小會員收費為工會會費／入會費 1,200 元，加上校內會員專屬康樂費 300 元，合計 1,500 元。更新年度活動時，先以工會最新正式文件與校內通知核對，再修改該檔與相應文案。

本 repository 不收錄含收件人資料的原始公文，也不在網站蒐集會員個資。石門國小支會由教師小組代收會員本次費用，再由財務長統合匯入工會會費；校內康樂費留作石門國小支會會員活動使用。新進及中斷會員由支會長協助入會與後台建檔。

活動宣導區的報名連結與活動專屬頁均以最新工會公文為準；活動報名採外部表單或桃園市教師研習系統，網站不代收報名資料。學校多元研習區以課程編號提供查詢入口，活動日期、報名期間與注意事項更新前，請先核對工會最新正式文件。

## 網站圖示與社群分享

`assets/` 已包含 favicon、Apple Touch icon、Android maskable icon 與 1200×630 的 `og-image.png`。`index.html` 使用 GitHub Pages 的絕對 OG 圖網址，並附版本參數；日後替換 OG 圖時，請同步更新該參數，協助 LINE、Facebook 重新抓取新版預覽。

社群分享圖可用 `npm run generate:og` 依目前素材與 `site-data.js` 重新產製；`npm run check:site` 會檢查 PNG 格式、1200×630 尺寸、1,200＋300＝1,500 元文字、OG 版本參數與禁止回歸文案。兩項檢查也已納入 GitHub Actions 的 `site-check` workflow。

網站已加入 Service Worker 版本更新提示：新版會先在背景下載，使用者按下「立即更新」後才套用並重新整理。日後部署內容更新前，請執行 `powershell -ExecutionPolicy Bypass -File scripts/bump-version.ps1 -Notes "更新說明"`，同步提升 `version.json`、`sw.js`、`index.html` 與資源版本字串。

本輪已新增四個手機友善快速入口（續會、加入、活動、聯絡）與可列印 QR 導覽。QR 只包含公開頁面錨點，產製與 `jsQR` 解碼驗證可用 `npm run generate:qr` 重跑；`npm run check:site` 會檢查 QR manifest、公開網址與圖檔完整性。公告區依開始／封存日期、置頂與優先序排序，過期內容會移入歷史狀態。

PWA 維運頁面為 [`pwa-health.html`](pwa-health.html)，網路中斷時由 [`offline.html`](offline.html) 提供 fallback；Service Worker 會預載首頁、狀態頁、QR 資產與品牌資產，並保留新版提示。使用統計頁 [`usage-stats.html`](usage-stats.html) 永遠保留本機匿名明細；目前已啟用中央匿名彙整，也只傳送固定事件名稱、網站版本及只供短期去重的單次隨機請求碼，不使用 Cookie、不收集姓名、電話、名冊或付款資訊。

網站後端位於 [`gas/`](gas/)，採 Google Apps Script Web App＋Google Sheets 每日彙總。前端只會傳送固定事件名稱、網站版本及只供短期去重的單次隨機請求碼；後端不儲存原始訪客紀錄、不讀取 IP／User-Agent，也不建立老師身分。中央試算表已由學校管理帳號初始化並維持私人權限；部署與後續更新方式請參考 [`GAS-BACKEND.md`](GAS-BACKEND.md)。

品牌資產治理記錄在 [`brand-assets.json`](brand-assets.json)。目前使用網站專用圖示與既有配色，正式工會 Logo、QR 或新版海報素材尚未標示為已授權；取得正式素材與授權紀錄後，再依同一份 manifest 更新 favicon、PWA icon、OG 圖與社群視覺。

## 專案進度與未來規劃

已完成 BACKEND-01～04 管理更新：私人報表、CSV／JSON 匯出、備份復原、角色權限、管理稽核與匿名端點治理。GAS 已部署後端 2.0.1，備份復原、登入、匯出與匿名拒絕存取已實測。網站「本機使用統計」頁提供管理報表入口；使用與部署說明見 [`GAS-BACKEND.md`](GAS-BACKEND.md)，驗收紀錄見 [`BACKEND-VERIFICATION.md`](BACKEND-VERIFICATION.md)。

目前完成項目、P0／P1 狀態、開放問題與後續候選功能，請參閱 [`PROJECT-PROGRESS.md`](PROJECT-PROGRESS.md)。本輪 RDQ 規格卡位於 [`rdq/RDQ-spec-teachergroup-roadmap-20260908.md`](rdq/RDQ-spec-teachergroup-roadmap-20260908.md)；會長已選定 ROADMAP-01、02、03、05、07、08、09、10、11、12，已完成第一階段的靜態網站實作與驗收護欄。
