# DealCalc.io Full Update V4 — Upload Instructions

This V4 package fixes the live-site issues where:

1. The homepage was showing the Learn Hub.
2. The Calculators navigation was going only to the MAO calculator.
3. The AI Deal Analyzer was still showing V1 instead of the Multi-Strategy V2 analyzer.

## Files that MUST be replaced

Upload/replace the full contents of this folder into the root of your GitHub repository.

Pay special attention to these exact files:

- `index.html` — must be the homepage, not Learn Hub.
- `calculators.html` — all calculators page.
- `calculator/index.html` — backup calculators directory page.
- `calculators/index.html` — backup calculators directory page.
- `learn.html` — Learn Hub page.
- `learn/index.html` — Learn Hub directory route.
- `tools/ai-deal-analyzer.html` — Multi-Strategy AI Deal Analyzer V2.
- `assets/js/main.js` — required for analyzer, calculator events, and PDF extraction.
- `assets/css/styles.css` — required styling updates.
- `sitemap.xml` — updated sitemap.

## Recommended GitHub upload workflow

1. Download and unzip this V4 package.
2. Open your GitHub repository.
3. Upload the full unzipped contents into the repository root.
4. When GitHub asks, choose to replace existing files.
5. Commit changes.
6. Push to GitHub.
7. Wait for Vercel to redeploy.
8. Hard refresh your browser:
   - Mac: `Command + Shift + R`
   - Windows: `Ctrl + Shift + R`

## Important verification after deploy

Open these URLs after Vercel finishes:

- `https://www.dealcalc.io/`
  - Should say: “Analyze better real estate deals in minutes.”
  - Should NOT say: “Learn Hub.”

- `https://www.dealcalc.io/calculators.html`
  - Should show all 10 calculators.

- `https://www.dealcalc.io/tools/ai-deal-analyzer.html`
  - Should say: “Multi-Strategy Deal Analyzer V2.”
  - Should show the analysis type dropdown.
  - Should show PDF upload.

## If the homepage still shows Learn Hub

That means the wrong file is still saved as `index.html` in GitHub.

Fix:

1. Open `index.html` in GitHub.
2. Confirm the file contains this phrase:
   `Analyze better real estate deals in minutes.`
3. If it instead contains `Learn Hub`, delete it and upload the V4 `index.html` again.

## Contact form note

The contact form still needs your real Formspree endpoint.
Replace:

`REPLACE_WITH_YOUR_FORMSPREE_ID`

with your actual Formspree ID.
