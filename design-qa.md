# Design QA

## Comparison target

- Source visual truth: `G:\Agent\教師會會長要做的事情\152615.jpg`
- Source pixels: 1024 × 1536
- Implementation: browser-rendered local static site at `http://127.0.0.1:4173/`
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

No actionable P0, P1, or P2 findings remain.

## Fidelity surfaces

- Fonts and typography: Traditional-Chinese system font stack renders the large navy headline, supporting copy, amounts, and small labels with clear hierarchy. No clipping or truncation in desktop or mobile captures.
- Spacing and layout rhythm: desktop uses open hero space and two-column decision cards; mobile collapses to one column. Both captures show consistent card padding, readable vertical rhythm, and no overlap.
- Colors and visual tokens: navy is used for renewal and navigation, green for new-member actions, warm yellow for the urgency notice, and red for monetary amounts. Contrast remains strong on cream, white, navy, and green surfaces.
- Image and icon fidelity: the supplied poster is used only as visual reference and is not republished. The site has no recreated poster illustrations, CSS art, inline SVG, or placeholder imagery. Standard Bootstrap Icons load as a consistent icon library after `document.fonts.ready`.
- Copy and content: annual fee, deadlines, discounts, transfer account, contact channels, and online-form URL match the verified local source documents and supplied secretary message. The 116/1/1 fee exception is present in the FAQ.
- Responsiveness and accessibility: tested at 1440 × 1024 and 390 × 844. No horizontal overflow was detected. Keyboard focus styles, semantic headings, real buttons, details/summary FAQ controls, a skip link, named navigation, and clear external-link labels are present.

## Interaction checks

- Desktop and mobile rendering loaded with no browser console errors.
- Mobile menu opens and closes correctly.
- Desktop anchor navigation reaches the intended sections with the visible heading below the sticky header.
- FAQ disclosure opens correctly.
- Online application links resolve to `https://www.teu.org.tw/google_form.php`; live HTTP check returned 200.
- Official union website live HTTP check returned 200.
- GitHub Pages public site returned HTTP 200 for both `/` and `/styles.css`; the browser-rendered public page has the correct title, visible hero, form URL, and no console errors.

## Follow-up polish

- Replace the generic people mark with the official union logo if an authorized source SVG/PNG is provided.
- Add official QR-code artwork only if the current original assets are supplied or specifically authorized for reuse; direct, accessible web links remain the primary action.

final result: passed
