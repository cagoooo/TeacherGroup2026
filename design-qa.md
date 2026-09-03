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

## Findings

- [P2, fixed] Mobile deadline message wrapped with isolated words at the 390 px test width.
  - Evidence: initial mobile capture split the deadline sentence around the inline date and voucher amount.
  - Fix: wrapped the sentence content in `index.html` and updated `.hero-note` alignment in `styles.css`.
  - Post-fix evidence: `qa/mobile-top.png` shows the complete sentence on one readable line at the mobile test width.

- [P1, fixed] 校內實際收費流程與原先公開文案不一致，可能誤導會員個別匯款或自行填寫官方表單。
  - Fix: 首頁、續會、新進老師、辦理流程、FAQ 與聯絡區統一改為校內支會流程：舊會員將會費交給教師小組成員，由支會長統合後一次匯款；新進及中斷會員洽支會長，由支會長協助入會與後台建檔。
  - Guardrail: 帳戶資訊保留供支會長對帳使用，但明確標示一般會員請勿個別匯款；網站不再提供官方線上入會表單的自助入口。
  - Post-fix evidence: 桌面與手機畫面均顯示「本校辦理方式」及「免個別匯款，支會長統一辦理」，且頁面未出現官方表單連結。

No actionable P0, P1, or P2 findings remain.

## Fidelity surfaces

- Fonts and typography: Traditional-Chinese system font stack renders the large navy headline, supporting copy, amounts, and small labels with clear hierarchy. No clipping or truncation in desktop or mobile captures.
- Spacing and layout rhythm: desktop uses open hero space and two-column decision cards; mobile collapses to one column. Both captures show consistent card padding, readable vertical rhythm, and no overlap.
- Colors and visual tokens: navy is used for renewal and navigation, green for new-member actions, warm yellow for the urgency notice, and red for monetary amounts. Contrast remains strong on cream, white, navy, and green surfaces.
- Image and icon fidelity: the supplied poster is used only as visual reference and is not republished. The site has no recreated poster illustrations, CSS art, inline SVG, or placeholder imagery. Standard Bootstrap Icons load as a consistent icon library after `document.fonts.ready`.
- Copy and content: annual fee, deadlines, discounts, transfer account, contact channels, and the supplied secretary message are retained as source references；公開操作文案則以石門國小支會實際代收、統合匯款與後台建檔流程為準。116/1/1 的費用例外說明仍保留於 FAQ。
- Responsiveness and accessibility: tested at 1440 × 1024 and 390 × 844. No horizontal overflow was detected. Keyboard focus styles, semantic headings, real buttons, details/summary FAQ controls, a skip link, named navigation, and clear external-link labels are present.

## Interaction checks

- Desktop and mobile rendering loaded with no browser console errors.
- Mobile menu opens and closes correctly.
- Desktop anchor navigation reaches the intended sections with the visible heading below the sticky header.
- FAQ disclosure opens correctly.
- 校內流程 CTA 可正確導向 `#payment`；新進及中斷會員文案均導向支會長，沒有個別匯款或自行填寫官方表單的操作入口。
- Official union website live HTTP check returned 200.
- GitHub Pages public site returned HTTP 200 for both `/` and `/styles.css`; the browser-rendered public page has the correct title、校內辦理流程與 footer，且沒有官方表單 URL 與水平溢位。

## Follow-up polish

- Replace the generic people mark with the official union logo if an authorized source SVG/PNG is provided.
- Add official QR-code artwork only if the current original assets are supplied or specifically authorized for reuse; direct, accessible web links remain the primary action.

final result: passed
