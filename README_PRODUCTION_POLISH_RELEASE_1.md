# DealCalc Production Polish Release 1

This package is designed to be uploaded over the existing DealCalc repository root.

## What this release improves

- Global typography scale: larger body text, labels, inputs, buttons, and cards.
- AI Deal Analyzer readability: larger upload/review/report sections and better spacing.
- Calculator consistency: improved calculator layout, form sizing, sticky result panels, and mobile behavior.
- Homepage positioning: stronger AI underwriting platform messaging.
- Dashboard polish: larger workspace cards and clearer visual hierarchy.
- Article readability: improved article font sizing, headings, and line spacing.
- Mobile polish: better tap targets, card spacing, calculator navigation, and form readability.

## Files included

- `assets/css/styles.css`
- `index.html`
- `calculators.html`
- `tools/ai-deal-analyzer.html`
- `dashboard.html`
- `learn/index.html`
- `calculator/*.html`
- `articles/*.html`
- supporting JS/config files copied from the current uploaded source set

## Upload instructions

1. Unzip this package.
2. Drag the contents into the root of `dealcalc-website`.
3. When Finder asks about folders, choose **Merge**.
4. Commit and push to GitHub.
5. Wait for Vercel deployment.

## QA checklist after deploy

Test these URLs:

- `/`
- `/tools/ai-deal-analyzer.html`
- `/calculators.html`
- `/calculator/mao-calculator.html`
- `/calculator/arv-calculator.html`
- `/calculator/cash-flow-calculator.html`
- `/calculator/rehab-calculator.html`
- `/learn/`
- `/dashboard.html`

Check desktop and mobile widths. The main expected changes are larger, easier-to-read text and cleaner spacing.

## Important note

This release is primarily visual/product polish. It does not yet fully implement the advanced Rental Property Analyzer, Room-by-Room Rehab Estimator logic, or backend-connected Investor Workspace. Those should be handled in the next feature release.
