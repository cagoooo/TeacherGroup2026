# TeacherGroup2026｜GAS 匿名統計後端

本後端使用 Google Apps Script Web App＋Google Sheets。匿名事件不建立老師帳號，也不儲存姓名、電話、電子郵件、會員名冊、付款資料、IP 或 User-Agent。管理功能另外使用 Google 登入身分，將管理者帳號與操作寫入私人稽核表。

## 資料內容

Google 試算表只會有：

- 台灣日期
- 固定事件名稱，例如 `section_view_workshops`
- 事件次數
- 最後更新時間

事件次數是使用量指標，不等同於去重後的老師人數。公開網站仍保留本機統計；中央統計啟用後，前端用 `sendBeacon` 或非阻塞 `fetch` 傳送固定事件，失敗時不影響網站閱讀。

## 管理與維運版本 2.0.1

- 管理入口：在既有 `/exec` 網址後加 `?action=admin`。Google 未回傳可驗證的登入帳號、帳號未列入白名單或遭停權時，一律拒絕。
- 目前採同學校 Workspace 網域白名單；跨網域帳號不能直接加入。不可把 `getEffectiveUser()` 的部署者身分當作網頁訪客，亦不接受前端傳入 email 取代身分驗證。
- 擁有者：報表、匯出、備份、復原演練、保存政策、角色設定及稽核；維運者：報表、匯出、備份、演練；檢視者：報表、匯出及健康資訊。
- 初始只有執行初始化的部署者具擁有者權限；沒有自動邀請其他帳號，也不直接分享統計試算表。
- 報表支援起訖日期（最多跨 366 天）、每日趨勢、事件排行、版本分布及 CSV／JSON 匯出。CSV 會處理公式注入與雙引號。
- 公開 health 會讀取試算表標頭確認連線，回傳後端版本與 ready／unavailable，不提供私有 ID、帳號與詳細錯誤。
- 每日約台灣時間 03 時建立私人 JSON 備份；備份先設私人再寫入內容，重新讀取驗證 SHA-256 後登錄索引。
- 復原演練只接受索引內已驗證備份，驗證 SHA-256 後建立獨立私人試算表並比對內容；不覆寫正式資料、不自動切換資料來源。
- 預設統計／管理稽核 365 天、備份 30 天；這是可調整的到期檢視門檻，非已啟用自動刪除。到期資料與演練副本仍保留，擁有者檢視後再決定刪除。
- 維護成功／失敗、最近寫入／備份／演練與今日固定錯誤分類可在管理頁查看；尚未啟用 Email、LINE 或 Chat 對外通知。

## 更新後首次啟用

1. `clasp push -f -u school` 只推 3 個 `.gs`、`Dashboard.html` 與 manifest。`Dashboard.html` 是 GAS HtmlService 管理模板，與 GitHub Pages 前端檔分開；刻意列入 `.claspignore` 白名單。
2. 執行 `initializeOperations`，由 Google 確認部署者本人。第一次需補充同意 Drive（私人備份）、ScriptApp（每日排程）與 email（管理登入）權限；不新增 Gmail 寄信權限。
3. 初始化會設定擁有者、確認原試算表為私人、建立管理工作表及單一每日排程，並實做一次備份與隔離復原演練。重跑不重複安裝觸發器，但會多產生一份備份及演練副本。
4. 初始化成功後，建立不可變版本並 `update-deployment` 至既有正式 deployment。OAuth 尚未完成時，保留既有正式部署版本。
5. 使用學校帳號打開 `?action=admin`，驗證報表、匯出及維運；未登入的請求須只見登入提示。

## 事件版本、反灌量及統計限制

- `schema: 1`；僅接受 `schema`、`event`、`siteVersion` 與選用 `requestId`，本文上限 1024 字元。
- `requestId` 為每次事件新產生的隨機 UUID，僅存 GAS 暫存最多 600 秒；不寫入試算表、不跨事件辨識人。Cache 可能提前清除，無法保證絕對去重。
- `OPS.acceptedVersions` 列出支援的網站版本。每次前端升版先更新 GAS 清單並部署；網站 CI 會阻擋缺少新版本的後端設定。保留前版以兼容 PWA 使用者。
- 全站有效處理請求上限每分鐘 120 次、每日 20,000 次（含驗證失敗的處理請求）；超過回 `rate_limited`。這不是每人限流，也不能阻擋 Google 平台層執行配額遭濫用。
- `sendBeacon` 接受傳送或 `no-cors` 完成並不代表寫入成功；前端不顯示虛假的成功回執。寫入確認應從私人報表查證。
- 試算表多次寫入不具資料庫交易語意，極端中途故障可能使事件與版本彙總不一致；版本分布僅輔助診斷。
- 本機 `page_view` 每個分頁 session 計一次；區塊閱覽每次頁面載入首次進入可見範圍計一次，快速滑過也可能觸發，不能推論已仔細閱讀。
- 尚未加入週期性自動復原或正式資料刪除；下一階段若需要，應先以本次備份驗證流程演練。

## 回復前一版

正式 GAS 原版本為 3；部署異常時，以 `clasp update-deployment <既有deploymentId> -u school -V 3 -d "回復原匿名統計"` 回復。新增管理工作表可保留；每日排程由專案的觸發條件管理，停用時只移除 `dailyMaintenance_`，不影響其他排程。前端匿名傳送的 requestId 是選用欄位，原版接收器可忽略。

## 官方技術依據

- [Google Session 登入身分限制](https://developers.google.com/apps-script/reference/base/session)
- [HtmlService RPC 與私有函式](https://developers.google.com/apps-script/guides/html/communication)
- [Drive 分享權限](https://developers.google.com/apps-script/reference/drive/file)
- [時間觸發條件](https://developers.google.com/apps-script/guides/triggers/installable)

## 第一次建立與部署（目前已完成）

1. 以學校管理帳號登入 CLASP；若 Apps Script API 尚未啟用，先至 <https://script.google.com/home/usersettings> 開啟。
2. 在 `gas/` 建立或取得 `.clasp.json`（該檔案已加入 `.gitignore`，不可提交）。
3. 確認 `gas/.claspignore` 只允許 `Code.gs` 與 `appsscript.json` 上傳。
4. 執行 `clasp push -f`，建立 Web App 部署；存取權需設定為任何人，才能讓 GitHub Pages 匿名送出固定事件。
5. 部署後在 Apps Script 編輯器執行一次 `initializeBackend`，完成 Google 試算表建立與首次授權。
6. 將同一個 `/exec` 網址填入 `site-data.js` 的 `usageAnalytics.endpoint`，並將 `enabled` 設為 `true`。
7. 執行版本更新、網站檢查與 GitHub Pages 部署。

本專案目前已完成上述啟用流程：Web App 健康檢查回應 HTTP 200、匿名事件 POST 回應 HTTP 200，且已建立私人試算表。後續若變更 GAS 程式，請保留同一個 deployment ID 並依下方「後續更新」流程重新部署。

## 後續更新

所有 CLASP 指令請先切換到本專案 `gas/` 目錄執行；不要在 repository 根目錄以空 `rootDir` 的 `.clasp.json` 推送，避免遠端檔名意外多出 `gas/` 前綴，導致 HtmlService 無法找到 `Dashboard`。`clasp status` 應顯示 `Admin.gs`、`Code.gs`、`Operations.gs`、`Dashboard.html` 與 `appsscript.json`。

既有 Web App 更新時，先用 `clasp list-deployments <scriptId>` 確認 deployment ID 屬於同一支 script，再依序執行：

```text
clasp push -f
clasp create-version "更新說明"
clasp update-deployment <deploymentId> -V <versionNumber> -d "更新說明"
```

不可用 `create-deployment` 取代既有部署，否則會產生新的 `/exec` 網址。

## 維運界線

- 統計試算表維持私人分享權限，只提供必要管理者查看。
- 不新增原始訪客列、不儲存識別碼、不使用第三方追蹤服務。
- 公開匿名端點可能遭到灌量，因此統計適合作為趨勢參考；若未來要做正式人數統計，需另行設計登入、反濫用與個資告知機制。
