---
rdq_version: 1
edition: chatgpt-app
task: 執行已選 ROADMAP-01、ROADMAP-02、ROADMAP-03、ROADMAP-05、ROADMAP-09 第一階段
domain: dev
date: 2026-09-08
status: confirmed
telemetry:
  mode: lite
  rounds: 1
  questions: 0
  q4_adopted: 5
  revisions: 1
downstream: self
---

# RDQ 需求規格：TeacherGroup2026 已選路線第一階段

## 一句話任務
依會長已選定的五項 Roadmap，完成 TeacherGroup2026 靜態網站第一階段的資料單一來源、社群圖、發布防呆、活動模組化與無障礙／裝置檢查，並保留後續私有後台等功能的選擇權。

## 已確認
- 專案是 GitHub Pages 靜態網站 `TeacherGroup2026`，目前公開版本為 **2026.09.08-1**。
- 本次收費須呈現 **1,200 元工會會費／入會費＋300 元石門國小校內康樂費＝1,500 元**。
- 校內流程是教師小組代收、財務長處理工會匯款；新進／中斷會員由支會長協助建檔。
- 本輪已確認執行 `ROADMAP-01`、`ROADMAP-02`、`ROADMAP-03`、`ROADMAP-05`、`ROADMAP-09` 的靜態網站第一階段。

## 待確認假設
- 是否要做私有後台 → 預設先不做，等會長選定角色與資料權限。
- 是否公開公文附件 → 預設只公開不含個資且確認授權的文件。
- 是否導入第三方登入或資料庫 → 預設維持靜態網站，先完成需求與風險評估。

## 已採納建議
- `ROADMAP-01`：以 `site-data.js` 集中費用、活動流程、提醒與研習資料，搭配 HTML fallback 與欄位檢查。
- `ROADMAP-02`：以本機可重跑中文字型腳本產製實際 1200×630 PNG，並以版本化 OG URL 驗證。
- `ROADMAP-03`：以 `scripts/check-site.mjs` 與 GitHub Actions 阻擋高風險舊文案回歸。
- `ROADMAP-05`：以資料陣列渲染活動流程、活動提醒與三張研習卡片，保留無 JavaScript fallback。
- `ROADMAP-09`：先建立不需瀏覽器依賴的 HTML／CSS／manifest 靜態檢查，完整瀏覽器自動化列為第二階段選項。

## 本次不納入
- 不變更現行收費規則、不公開會員名冊、不建立公開自助入會表單。
- 不在會長選定功能前新增 API、Firebase、登入、付款或個資資料庫。

## 一段式需求規格
請以 **TeacherGroup2026** 現有靜態網站、**2026.09.08-1** 公開版本、**1,200＋300＝1,500 元**收費規則與石門國小校內分工為基礎，完成已選五項 Roadmap 的第一階段；網站仍不得公開會員名冊、不得引導一般會員個別匯款，並需讓未來活動與研習更新可追溯、可驗證、可回復。私有後台、登入、資料庫、付款與匿名統計等未選功能，必須另行確認資料權限與驗收條件後才可開發。

## 驗收條件
- [x] 對話中列出目前 P0、已完成 P1 與開放 P1。
- [x] 進度表可追溯至公開版本、GitHub `main` 與自動化驗證結果。
- [x] 候選功能有編號、優先級、使用情境、資料／權限風險、維護代價與驗收方式。
- [x] 會長已確認五項 Roadmap，本規格卡狀態由 `draft` 更新為 `confirmed`。
- [x] `npm run check:site` 通過，包含費用規則、OG PNG、版本一致性、禁止回歸文案、頁內連結與第一階段無障礙檢查。
