# 後端管理更新驗收

日期：2026-09-08。已選 BACKEND-01、02、03、04；BACKEND-05 未選。

## 目前狀態

- 網站版本：2026.09.08-5，管理後端 2.0.0，GAS 正式 deployment 更新為 version 4；沿用同一 `/exec`。
- Google 補充授權及 `initializeOperations` 已成功。
- 首份私人備份包含 9 列（包含統計／稽核），SHA-256 `0beeb1ad792c9b19e720f62cf5010dbcebdfca4dd6e82f98b74620859e05baaf`。
- 雲端隔離復原成功，比對同一 SHA-256，回傳 `productionUntouched: true`，正式資料未覆寫。
- 觸發條件頁確認只有 1 個 `dailyMaintenance_` 時間觸發條件；尚未等到隔日首次自動執行，備份函式已經手動初始化實測。
- 正式管理頁：學校擁有者身分可驗證，報表可讀；未登入 HTTP 請求只收到登入提示，不含報表內容。
- 正式 CSV／JSON 皆成功下載、解析，共 9 筆資料、事件總次數均 9（驗證時點）。後續使用會繼續增加。
- 正式 health 回 `ok:true`、`backendVersion:2.0.0`、`storage:ready`。
- 正式單次 `section_view_quick_entry` 冒煙測試寫入成功，重送相同 requestId 回 `duplicate:true`，無效事件回 `invalid_request`；驗收流量不是教師人數。
- 其他角色與停權的行為以隔離 mock 測試驗證；未借用或新增真實教師帳號進行跨帳號測試。

## 已完成本機驗證

`npm run test:backend`：17 項通過；`npm run check:site` 與 `git diff --check` 通過。

涵蓋未登入／非白名單／停權拒絕、管理 RPC 權限、不可冒用 email、同網域角色增修與即時停權、不能降級自身擁有者、schema／版本／事件白名單、個資額外欄位與過大本文拒絕、短期重複請求去重、每分鐘上限、隱去內部錯誤、儲存故障健康狀態、日期區間彙總、損壞備份拒絕、保存門檻範圍、快速入口事件正規化、備份先私人再寫入、模擬完整備份復原比對，以及請求碼不保存為訪客識別碼。

## 後續重跑驗收順序

1. 確認 Google 補充授權已完成，必要時重新執行 `initializeOperations`。此函式僅接受 Google 確認的部署者本人，不使用公開初始化密鑰。
2. 取得成功結果：私人備份 ID／SHA-256、隔離復原試算表網址與 `productionUntouched: true`。私有網址與帳號名單不得寫入公開 repository。
3. 查詢觸發條件，確認只有一個 `dailyMaintenance_`；觸發條件約在台灣時間 03 時執行，Google 不保證整點。
4. 核對 `clasp show-authorized-user -u school` 與 `list-deployments`；先推送任何後續修正，再建立版本，使用原 deployment ID 執行 `update-deployment`。
5. 驗證 health ready、匿名錯誤事件不寫入、管理頁未登入拒絕、學校擁有者登入可查看報表／下載 CSV、私人備份與演練可用。
6. 如需製造事件驗收，記錄明確測試事件及次數；不要把驗收流量當教師閱覽數，不刪除混有正式資料的紀錄。
7. 再發布前端 2026.09.08-5，驗證 Pages 與 SW 更新提示，從使用統計頁可前往管理入口。
8. 完成後更新此文件及 PROJECT-PROGRESS；不能預先標記雲端備份、角色跨帳號或復原演練成功。

## 採用預設與限制

- 預設保存門檻：統計及管理稽核 365 天、備份 30 天；只列出到期數量，沒有自動刪除。演練副本另由管理者檢視與清理。
- 只有初始化部署者有 owner 權限；operator 可備份／演練，viewer 僅查閱／匯出；技術角色不自動代表校內職稱。
- GAS 的同網域 Session 身分可用性受 Workspace 政策影響，沒有可信 email 時拒絕登入；外部帳號另需設計驗證方式。
- 匿名端點有總量限制與短期請求去重，不保證一人一次，也不保證 Google 平台執行配額不被消耗。
- 每日排程錯誤先記錄管理頁；尚未設定 Email、LINE 或 Chat 寄送通知。
