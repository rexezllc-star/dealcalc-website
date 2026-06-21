# DealCalc Full Update V12

This is the one-upload fix for the calculator folder issue.

## What changed

- Rebuilt the live `/calculator/` folder with 10 unique calculator pages.
- Mirrored the same fixed pages into `/calculators/` so the duplicate folder no longer causes confusion.
- Updated `calculators.html` as the main calculator directory.
- Added `/calculator/index.html` and `/calculators/index.html` directory pages.
- Added `assets/js/calculators-v12.js` with unique formulas for every calculator.
- Updated styling for calculator navigation links and result insight boxes.

## Important upload instruction

Upload the CONTENTS of this folder to the GitHub repository root and choose replace/overwrite when prompted.

After upload, the live page:
`/calculator/cap-rate-calculator.html`
should show fields for:
- Property Value / Purchase Price
- Annual Gross Rent
- Vacancy %
- Annual Operating Expenses
- Target Cap Rate %

It should NOT show ARV / Repair Costs / Assignment Fee / Rule %.

## Files/folders that must be replaced

- `calculator/`
- `calculators/`
- `calculators.html`
- `assets/js/calculators-v12.js`
- `assets/css/styles.css`

## Verification markers

Each fixed calculator page contains this marker near the top:
`DEALCALC CALCULATOR V12`
