---
rdq_version: 1
edition: chatgpt-app
task: 執行已選 ROADMAP-01、ROADMAP-02、ROADMAP-03、ROADMAP-05、ROADMAP-07、ROADMAP-08、ROADMAP-09、ROADMAP-10、ROADMAP-11、ROADMAP-12 第一階段
domain: dev
date: 2026-09-08
status: confirmed
telemetry:
  mode: lite
  rounds: 1
  questions: 0
  q4_adopted: 10
  revisions: 1
downstream: self
---

# RDQ 需求規格：TeacherGroup2026 已選路線第一階段

## 一句話任務
依會長已選定的十項 Roadmap，完成 TeacherGroup2026 靜態網站第一階段的資料單一來源、社群圖、發布防呆、活動模組化、無障礙／裝置檢查、QR 導覽、公告生命週期、PWA 離線備援、本機匿名統計與品牌資產治理，並保留後續私有後台等功能的選擇權。

## 已確認
- 專案是 GitHub Pages 靜態網站 `TeacherGroup2026`，目前公開版本為 **2026.09.08-2**。
- 本次收費須呈現 **1,200 元工會會費／入會費＋300 元石門國小校內康樂費＝1,500 元**。
- 校內流程是教師小組代收、財務長處理工會匯款；新進／中斷會員由支會長協助建檔。
- 本輪已確認執行 `ROADMAP-01`、`ROADMAP-02`、`ROADMAP-03`、`ROADMAP-05`、`ROADMAP-07`、`ROADMAP-08`、`ROADMAP-09`、`ROADMAP-10`、`ROADMAP-11`、`ROADMAP-12` 的靜態網站第一階段。

## 待確認假設
- 是否要做私有後台 → 預設先不做，等會長選定角色與資料權限。
- 是否公開公文附件 → 預設只公開不含個資且確認授權的文件。
- 是否導入第三方登入或資料庫 → 預設維持靜態網站，先完成需求與風險評估。
- 使用統計 → 本階段限定瀏覽器本機 localStorage 匿名計數，不跨裝置彙整、不送至第三方服務，日後若需集中統計須重新確認告知、保存期限與服務設定。
- 正式品牌素材 → 目前不宣稱網站圖示、QR 或海報為工會正式授權素材；取得正式 Logo／QR／新版海報與授權紀錄後再替換。

## 已採納建議
- `ROADMAP-01`：以 `site-data.js` 集中費用、活動流程、提醒與研習資料，搭配 HTML fallback 與欄位檢查。
- `ROADMAP-02`：以本機可重跑中文字型腳本產製實際 1200×630 PNG，並以版本化 OG URL 驗證。
- `ROADMAP-03`：以 `scripts/check-site.mjs` 與 GitHub Actions 阻擋高風險舊文案回歸。
- `ROADMAP-05`：以資料陣列渲染活動流程、活動提醒與三張研習卡片，保留無 JavaScript fallback。
- `ROADMAP-09`：先建立不需瀏覽器依賴的 HTML／CSS／manifest 靜態檢查，完整瀏覽器自動化列為第二階段選項。
- `ROADMAP-07`：新增續會、加入、活動、聯絡四個手機友善入口與列印版 QR 導覽；QR 只指向公開錨點，產製後逐張解碼驗證。
- `ROADMAP-08`：以 `startsAt`、`archiveAt`、`pinned` 與 `priority` 管理公告的 upcoming／active／archived 狀態，首頁頂端只呈現目前有效公告。
- `ROADMAP-10`：新增 PWA 健康頁與離線 fallback，Service Worker 預載狀態頁、QR 與品牌資產，並保留版本更新提示。
- `ROADMAP-11`：新增本機匿名使用統計頁與 JSON 匯出／清除功能，不傳送姓名、電話、名冊或付款資訊。
- `ROADMAP-12`：建立 `brand-assets.json`，統一 favicon、PWA icon、OG 圖與配色的資產索引；正式 Logo／QR／海報尚待授權。

## 本次不納入
- 不變更現行收費規則、不公開會員名冊、不建立公開自助入會表單。
- 不在會長選定功能前新增 API、Firebase、登入、付款或個資資料庫。

## 一段式需求規格
請以 **TeacherGroup2026** 現有靜態網站、**2026.09.08-2** 公開版本、**1,200＋300＝1,500 元**收費規則與石門國小校內分工為基礎，完成已選十項 Roadmap 的第一階段；網站仍不得公開會員名冊、不得引導一般會員個別匯款，QR 只能指向公開頁面，使用統計只能在本機保存匿名計數，正式品牌素材則須有授權紀錄。網站需讓未來活動與研習更新可追溯、可驗證、可回復。私有後台、登入、資料庫、付款與跨裝置統計等功能，必須另行確認資料權限與驗收條件後才可開發。

## 驗收條件
- [x] 對話中列出目前 P0、已完成 P1 與開放 P1。
- [x] 進度表可追溯至公開版本、GitHub `main` 與自動化驗證結果。
- [x] 候選功能有編號、優先級、使用情境、資料／權限風險、維護代價與驗收方式。
- [x] 會長已確認五項 Roadmap，本規格卡狀態由 `draft` 更新為 `confirmed`。
- [x] `npm run check:site` 通過，包含費用規則、OG PNG、版本一致性、禁止回歸文案、頁內連結與第一階段無障礙檢查。
- [x] `npm run generate:qr` 通過，四張 QR 以高容錯率產製並逐張解碼，內容均為公開頁面錨點且不含會員資料。
- [x] `pwa-health.html`、`offline.html`、Service Worker 預載清單與版本查詢流程已建立；PWA 快取涵蓋快速入口 QR 與品牌資產。
- [x] `usage-stats.html` 僅讀寫本機匿名統計，未使用 Cookie、`fetch`、`sendBeacon`、XHR 或外部分析服務。
- [x] `brand-assets.json` 明確記錄目前為 provisional site brand，未宣稱正式工會 Logo／QR／海報已取得授權。
