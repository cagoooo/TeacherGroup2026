# TeacherGroup2026｜GAS 匿名統計後端

本後端使用 Google Apps Script Web App＋Google Sheets，僅彙整網站使用事件，不建立老師帳號，也不收集姓名、電話、電子郵件、會員名冊、付款資料、IP 或 User-Agent。

## 資料內容

Google 試算表只會有：

- 台灣日期
- 固定事件名稱，例如 `section_view_workshops`
- 事件次數
- 最後更新時間

事件次數是使用量指標，不等同於去重後的老師人數。公開網站仍保留本機統計；中央統計啟用後，前端用 `sendBeacon` 或非阻塞 `fetch` 傳送固定事件，失敗時不影響網站閱讀。

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
