# Design QA

## Comparison target

- Source visual truth: `G:\Agent\教師會會長要做的事情\152615.jpg`
- Source pixels: 1024 × 1536
- Implementation: browser-rendered local static site at `http://127.0.0.1:49215/`
- Desktop CSS viewport: 1440 × 1024; rendered screenshot: `qa/desktop.png` (1425 × 1013)
- Mobile CSS viewport: 390 × 844; rendered screenshot: `qa/mobile-top.png` (375 × 812)
- Full desktop capture: `qa/desktop-full.png` (1425 × 4050)
- Public GitHub Pages capture: `qa/live-desktop.png` (1425 × 1013) at `https://cagoooo.github.io/TeacherGroup2026/`
- Same-input comparison: `qa/comparison-hero.png` (1482 × 720), containing the source poster at left and the desktop website hero at right. The comparison normalizes both images to 700 px tall; the source is 467 × 700 and the implementation is 984 × 700 within that canvas.

## Scope and intentional adaptation

The source is a 2:3 vertical print poster. The implementation is an accessible, responsive, long-form web page, so it intentionally does not reproduce the print grid or QR-code blocks one-for-one. It preserves the information hierarchy and visual tokens: cream background, navy renewal section, green new-member section, warm yellow notice bar, red monetary emphasis, prominent call-to-action, and staged eligibility information.

The source poster's weekday labels were not used because they are incorrect for ROC year 115. The implementation uses date-only wording, avoiding the inherited error.

The activity section is grounded in the supplied `活動宣導內容\公文.pdf` and `桃園市教育產業工會 115 年度 928 教師節活動計畫.pdf`. The PDFs remain source material outside the public repository; the website publishes a concise, accessible summary with the official registration and activity-information links.

The workshop section is grounded in `活動宣導內容\3\公文內容.pdf` and its three attached plans. The website publishes the three workshop dates, venues, audience, limits, training hours, registration deadlines, course codes, and the supplied Google Form link without copying the source PDFs into the public repository.

## Findings

- [P2, fixed] Mobile deadline message wrapped with isolated words at the 390 px test width.
  - Evidence: initial mobile capture split the deadline sentence around the inline date and voucher amount.
  - Fix: wrapped the sentence content in `index.html` and updated `.hero-note` alignment in `styles.css`.
  - Post-fix evidence: `qa/mobile-top.png` shows the complete sentence on one readable line at the mobile test width.

- [P1, fixed] 校內實際收費流程與原先公開文案不一致，可能誤導會員個別匯款或自行填寫官方表單。
  - Fix: 首頁、續會、新進老師、辦理流程、FAQ 與聯絡區統一改為校內支會流程：舊會員將會費交給教師小組成員，由財務長統合後一次匯款；新進及中斷會員洽支會長，由支會長協助入會與後台建檔。
  - Guardrail: 帳戶資訊保留供財務長對帳使用，但明確標示一般會員請勿個別匯款；網站不再提供官方線上入會表單的自助入口。
  - Post-fix evidence: 桌面與手機畫面均顯示「本校辦理方式」及「免個別匯款，工會款由財務長統一匯款」，且頁面未出現官方表單連結。

- [P1, fixed] 本次收費若只顯示 1,200 元，會漏掉石門國小校內會員專屬康樂費，造成實際收款金額不一致。
  - Fix: 新增 `recreationFee` 與 `currentCollectionTotal` 資料欄位，並在首頁、續會、新進／中斷會員、校內辦理流程與 FAQ 明確呈現「工會會費／入會費 1,200 元＋校內康樂費 300 元＝本次合計 1,500 元」。
  - Guardrail: 工會帳戶說明只對應財務長匯入工會的款項，另註明 300 元康樂費依校內通知辦理並留作石門國小支會會員活動使用。
  - Post-fix evidence: 頁面資料欄位與公開文案均可檢查到 `1,200`、`300`、`1,500` 及「校內會員專屬康樂費」，且移除原先「免收 1,200 元入會費」的易誤解標題。

- [P1, fixed] 新公文活動資訊需要獨立入口，避免與會員續會流程混在一起，也避免遺漏報名期限、名額、流程與活動提醒。
  - Fix: 新增「活動宣導」導覽與獨立專區，分成活動摘要、報名資格、當日流程、出發提醒四個層次，並保留兩個公文指定外部連結。
  - Post-fix evidence: 桌面與手機畫面均可看到「陽光親子 928 健行活動」、報名期間、活動地點、會員資格、3 小時研習時數與四段流程；手機寬度 390 px 無水平溢位。

- [P1, fixed] 115 年 9、10 月學校多元研習需要獨立宣導入口，且不同研習的報名方式不同。
  - Fix: 新增「115 年度學校多元研習」專區，將電影欣賞、學習共同體進階、蜜蜂生態與造型黏土 DIY 分成三張資訊卡；電影研習保留 Google 表單按鈕，另外兩場以研習系統課程編號提示報名。
  - Post-fix evidence: 三張卡片均顯示日期、時間、地點、對象／名額、研習時數與報名截止資訊，且不虛構未提供的研習系統網址。

- [P1, fixed] 社群分享圖的費用視覺已同步本次 1,500 元收費明細。
  - Fix: 以 `scripts/generate-og-image.mjs` 搭配本機繁中文字型重新產製 `assets/og-image.png`，明確呈現「工會會費／入會費 1,200 元＋校內康樂費 300 元＝1,500 元」。
  - Post-fix evidence: 檔案為真正 PNG，尺寸 1200×630、檔案大小約 581 KB；`index.html` 的 `og:image`、`secure_url` 與 Twitter image 均使用目前版本化參數，`npm run check:site` 通過。

- [P2, fixed] 發布前內容、版本與第一階段無障礙護欄已自動化。
  - Fix: 新增 `scripts/check-site.mjs` 與 `.github/workflows/site-check.yml`，檢查 1,200＋300＝1,500 元、角色分工、錯誤校名、舊名冊說明、版本一致性、OG 圖格式、頁內連結、語系、viewport、skip link、main landmark、h1、圖片替代文字、focus-visible 與手機斷點。
  - Post-fix evidence: 本機 `npm run check:site` 通過；GitHub Actions 會在 push／pull request 執行相同檢查。

- [P2, fixed] 快速入口需要同時適合手機操作與紙本導覽，且 QR 不得攜帶會員資料。
  - Fix: 新增續會、加入、活動、聯絡四個公開錨點入口；QR 由腳本產製並逐張解碼驗證，列印樣式只保留快速入口區，保留鍵盤 focus 與可讀文字連結。
  - Post-fix evidence: `npm run generate:qr` 產製 4 張 QR，`qr-manifest.json` 記錄公開網址與解碼結果；`npm run check:site` 會阻擋個人 query 參數與失效入口。

- [P2, fixed] 活動與公告若長期留在首頁，可能讓使用者誤讀已過期日期。
  - Fix: 公告資料加入開始／封存日期、置頂與優先序，畫面分為即將開始、進行中與已封存，頂端通知只取目前有效公告。
  - Post-fix evidence: `app.js` 的狀態函式可依測試日期產生 upcoming／active／archived，靜態檢查會驗證日期順序與對應頁內錨點。

- [P2, fixed] 網路不穩時需要知道目前內容與快取版本，並能在新版可用時更新。
  - Fix: 新增 `pwa-health.html`、`offline.html` 與 Service Worker 快取健康資訊；預載首頁、狀態頁、QR 與品牌資產，保留更新提示與版本查詢。
  - Post-fix evidence: `sw.js` 的 `PRECACHE_ASSETS` 包含離線頁、快速入口 QR、`brand-assets.json`；版本檔仍採 no-store 網路優先。

- [P2, fixed] 使用量需求不得變成會員追蹤或第三方個資外洩。
  - Fix: `usage-stats.js` 只在瀏覽器 localStorage 保存頁面／入口的匿名次數，提供匯出與清除，不使用 Cookie、外部分析服務、姓名、電話、名冊或付款資訊。
  - Post-fix evidence: `usage-stats.html` 顯示資料範圍與清除操作；`npm run check:site` 會檢查統計程式沒有 `fetch`、`sendBeacon` 或 XHR。

- [P3, fixed for provisional phase] 品牌圖示需要有可追溯的資產索引，避免把未授權素材當作正式工會 Logo。
  - Fix: 新增 `brand-assets.json`，索引 favicon、PWA icon 與 OG 圖，並明確記錄 `officialLogoAuthorized: false`。
  - Post-fix evidence: 靜態檢查驗證 manifest 狀態與資產路徑；正式 Logo／QR／新版海報仍待取得授權後再更新。

- [P1, fixed] 活動與研習報名入口需要隨日期轉換，避免活動已截止時仍顯示可報名按鈕。
  - Fix: 在 `site-data.js` 為活動與三場研習加入報名開始／截止／活動結束時間；`app.js` 統一渲染尚未開放、報名中、報名已截止與活動已結束狀態，並在時間邊界自動刷新。
  - Post-fix evidence: 電影研習以表單按鈕呈現開放狀態；非開放期間會顯示停用按鈕，日期欄位與順序由 `npm run check:site` 驗證。

- [P2, fixed] 手機使用者需要在長頁面中快速回到續會、入會、活動與聯絡區塊。
  - Fix: 新增手機固定快速操作列與回到頁首按鈕；沿用既有公開錨點，不新增會員資料或特殊 URL 參數。
  - Post-fix evidence: 390 px 版面保留底部安全間距，快速入口與 PWA 更新提示不互相遮蔽；桌機與列印 CSS 會隱藏固定操作列。

- [P2, fixed] 手機選單與頁內跳轉需要更完整的鍵盤及輔助技術行為。
  - Fix: 選單開啟後將焦點移至第一個連結，Escape 可關閉並將焦點送回按鈕；頁內 hash 跳轉會將焦點移到目標，並尊重 `prefers-reduced-motion`。
  - Post-fix evidence: `npm run check:site` 驗證 Escape、focus、錨點間距與減少動態效果護欄；完整 Lighthouse 報告仍屬後續可選自動化。

目前沒有已知的 P0、P1 或 P2 開放發現；ROADMAP-09 的完整 Lighthouse 自動化仍是可選的後續工作，不是目前公開版本的阻塞問題。

## Fidelity surfaces

- Fonts and typography: Traditional-Chinese system font stack renders the large navy headline, supporting copy, amounts, and small labels with clear hierarchy. No clipping or truncation in desktop or mobile captures.
- Spacing and layout rhythm: desktop uses open hero space and two-column decision cards; mobile collapses to one column. Both captures show consistent card padding, readable vertical rhythm, and no overlap.
- Colors and visual tokens: navy is used for renewal and navigation, green for new-member actions, warm yellow for the urgency notice, and red for monetary amounts. Contrast remains strong on cream, white, navy, and green surfaces.
- Image and icon fidelity: the supplied poster is used only as visual reference and is not republished. The site has no recreated poster illustrations, CSS art, inline SVG, or placeholder imagery. Standard Bootstrap Icons load as a consistent icon library after `document.fonts.ready`.
- Copy and content: annual fee, current collection split (1,200 元工會會費／入會費＋300 元石門國小校內康樂費＝1,500 元), deadlines, discounts, transfer account, contact channels, and the supplied secretary message are retained as source references；公開操作文案則以石門國小支會實際代收、統合匯款與後台建檔流程為準。新增活動專區依 115 年 9 月 3 日公文與活動計畫整理，包含報名時間、活動地點、名額、流程、研習時數與注意事項；新增多元研習專區依 115 年 9 月 4 日公文及三份附件計畫整理，包含三場研習的報名期限、課程編號與不同報名方式。116/1/1 的工會端費用例外說明仍保留於 FAQ，並與校內康樂費分開標示。
- Responsiveness and accessibility: tested at 1440 × 1024 and 390 × 844. No horizontal overflow was detected. Keyboard focus styles, semantic headings, real buttons, details/summary FAQ controls, a skip link, named navigation, clear external-link labels, mobile quick actions and reduced-motion handling are present.

## Interaction checks

- Desktop and mobile rendering loaded with no browser console errors.
- Mobile menu opens and closes correctly.
- Desktop anchor navigation reaches the intended sections with the visible heading below the sticky header.
- 「活動宣導」導覽與首頁最新活動連結可正確導向 `#activities`；活動報名與活動專屬頁兩個公文連結均可開啟。
- 首頁最新公告可導向 `#workshops`；電影研習 Google 表單連結可開啟，另外兩場顯示正確課程編號與研習系統報名提示。
- FAQ disclosure opens correctly.
- 活動與研習卡片會依目前日期顯示報名狀態；報名截止後不再提供可點擊的表單按鈕。
- 手機快速操作列可導向續會、入會、活動與聯絡錨點；回到頁首按鈕在捲動後出現，並可用鍵盤操作。
- 手機選單開啟後焦點移入第一個連結，按 Escape 關閉後焦點回到選單按鈕；頁內錨點跳轉會將焦點送到目標區塊。
- 活動專區呈現四段當日流程與五項出發提醒，並清楚區分活動報名與研習時數登錄說明；多元研習專區呈現三張研習卡片。
- 校內流程 CTA 可正確導向 `#payment`；新進及中斷會員文案均導向支會長，沒有個別匯款或自行填寫官方表單的操作入口。
- Official union website live HTTP check returned 200.
- GitHub Pages public site returned HTTP 200 for `/`、`/version.json`、`/sw.js`、`/styles.css` 與 OG image；browser-rendered public page has the updated title、活動專區、校內辦理流程與 footer，且沒有官方會員表單 URL 與水平溢位。

## Follow-up polish

- Replace the generic people mark with the official union logo if an authorized source SVG/PNG is provided.
- Add official QR-code artwork only if the current original assets are supplied or specifically authorized for reuse; direct, accessible web links remain the primary action.

final result: passed
