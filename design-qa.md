# Design QA

## Comparison target

- Source visual truth: `G:\Agent\教師會會長要做的事情\152615.jpg`
- Source pixels: 1024 × 1536
- Implementation: browser-rendered local static site at `http://127.0.0.1:4174/`
- Desktop CSS viewport: 1440 × 1024; rendered screenshot: `qa/desktop.png` (1425 × 1013)
- Mobile CSS viewport: 390 × 844; rendered screenshot: `qa/mobile-top.png` (375 × 812)
- Full desktop capture: `qa/desktop-full.png` (1425 × 4050)
- Public GitHub Pages capture: `qa/live-desktop.png` (1425 × 1013) at `https://cagoooo.github.io/TeacherGroup2026/`
- Same-input comparison: `qa/comparison-hero.png` (1482 × 720), containing the source poster at left and the desktop website hero at right. The comparison normalizes both images to 700 px tall; the source is 467 × 700 and the implementation is 984 × 700 within that canvas.

## Scope and intentional adaptation

The source is a 2:3 vertical print poster. The implementation is an accessible, responsive, long-form web page, so it intentionally does not reproduce the print grid or QR-code blocks one-for-one. It preserves the information hierarchy and visual tokens: cream background, navy renewal section, green new-member section, warm yellow notice bar, red monetary emphasis, prominent call-to-action, and staged eligibility information.

The source poster's weekday labels were not used because they are incorrect for ROC year 115. The implementation uses date-only wording, avoiding the inherited error.

The activity section is grounded in the supplied `活動宣導內容\公文.pdf` and `桃園市教育產業工會 115 年度 928 教師節活動計畫.pdf`. The PDFs remain source material outside the public repository; the website publishes a concise, accessible summary with the official registration and activity-information links.

## Findings

- [P2, fixed] Mobile deadline message wrapped with isolated words at the 390 px test width.
  - Evidence: initial mobile capture split the deadline sentence around the inline date and voucher amount.
  - Fix: wrapped the sentence content in `index.html` and updated `.hero-note` alignment in `styles.css`.
  - Post-fix evidence: `qa/mobile-top.png` shows the complete sentence on one readable line at the mobile test width.

- [P1, fixed] 校內實際收費流程與原先公開文案不一致，可能誤導會員個別匯款或自行填寫官方表單。
  - Fix: 首頁、續會、新進老師、辦理流程、FAQ 與聯絡區統一改為校內支會流程：舊會員將會費交給教師小組成員，由支會長統合後一次匯款；新進及中斷會員洽支會長，由支會長協助入會與後台建檔。
  - Guardrail: 帳戶資訊保留供支會長對帳使用，但明確標示一般會員請勿個別匯款；網站不再提供官方線上入會表單的自助入口。
  - Post-fix evidence: 桌面與手機畫面均顯示「本校辦理方式」及「免個別匯款，支會長統一辦理」，且頁面未出現官方表單連結。

- [P1, fixed] 新公文活動資訊需要獨立入口，避免與會員續會流程混在一起，也避免遺漏報名期限、名額、流程與活動提醒。
  - Fix: 新增「活動宣導」導覽與獨立專區，分成活動摘要、報名資格、當日流程、出發提醒四個層次，並保留兩個公文指定外部連結。
  - Post-fix evidence: 桌面與手機畫面均可看到「陽光親子 928 健行活動」、報名期間、活動地點、會員資格、3 小時研習時數與四段流程；手機寬度 390 px 無水平溢位。

No actionable P0, P1, or P2 findings remain.

## Fidelity surfaces

- Fonts and typography: Traditional-Chinese system font stack renders the large navy headline, supporting copy, amounts, and small labels with clear hierarchy. No clipping or truncation in desktop or mobile captures.
- Spacing and layout rhythm: desktop uses open hero space and two-column decision cards; mobile collapses to one column. Both captures show consistent card padding, readable vertical rhythm, and no overlap.
- Colors and visual tokens: navy is used for renewal and navigation, green for new-member actions, warm yellow for the urgency notice, and red for monetary amounts. Contrast remains strong on cream, white, navy, and green surfaces.
- Image and icon fidelity: the supplied poster is used only as visual reference and is not republished. The site has no recreated poster illustrations, CSS art, inline SVG, or placeholder imagery. Standard Bootstrap Icons load as a consistent icon library after `document.fonts.ready`.
- Copy and content: annual fee, deadlines, discounts, transfer account, contact channels, and the supplied secretary message are retained as source references；公開操作文案則以石門國小支會實際代收、統合匯款與後台建檔流程為準。新增活動專區依 115 年 9 月 3 日公文與活動計畫整理，包含報名時間、活動地點、名額、流程、研習時數與注意事項。116/1/1 的費用例外說明仍保留於 FAQ。
- Responsiveness and accessibility: tested at 1440 × 1024 and 390 × 844. No horizontal overflow was detected. Keyboard focus styles, semantic headings, real buttons, details/summary FAQ controls, a skip link, named navigation, and clear external-link labels are present.

## Interaction checks

- Desktop and mobile rendering loaded with no browser console errors.
- Mobile menu opens and closes correctly.
- Desktop anchor navigation reaches the intended sections with the visible heading below the sticky header.
- 「活動宣導」導覽與首頁最新活動連結可正確導向 `#activities`；活動報名與活動專屬頁兩個公文連結均可開啟。
- FAQ disclosure opens correctly.
- 活動專區呈現四段當日流程與五項出發提醒，並清楚區分活動報名與研習時數登錄說明。
- 校內流程 CTA 可正確導向 `#payment`；新進及中斷會員文案均導向支會長，沒有個別匯款或自行填寫官方表單的操作入口。
- Official union website live HTTP check returned 200.
- GitHub Pages public site returned HTTP 200 for `/`、`/version.json`、`/sw.js`、`/styles.css` 與 OG image；browser-rendered public page has the updated title、活動專區、校內辦理流程與 footer，且沒有官方會員表單 URL 與水平溢位。

## Follow-up polish

- Replace the generic people mark with the official union logo if an authorized source SVG/PNG is provided.
- Add official QR-code artwork only if the current original assets are supplied or specifically authorized for reuse; direct, accessible web links remain the primary action.

final result: passed
