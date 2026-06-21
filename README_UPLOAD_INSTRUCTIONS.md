# DealCalc.io Full Update V3

This folder fixes the current live-site issues and includes the latest platform updates.

## What this update fixes

1. Restores `index.html` as the homepage.
2. Adds `calculators.html` so all calculators show on one hub page.
3. Keeps calculator files in `/calculator/`.
4. Keeps the Learn Hub in `/learn/index.html` and also adds `learn.html` for compatibility.
5. Adds the V2 multi-strategy AI Deal Analyzer at `/tools/ai-deal-analyzer.html`.
6. Updates navigation so “Calculators” points to `/calculators.html`, not only the MAO calculator.

## Upload Instructions

Upload/replace everything in this folder into the root of your GitHub repository.

Important paths:

- `index.html` = homepage
- `calculators.html` = all calculators hub
- `calculator/` = individual calculator pages
- `tools/ai-deal-analyzer.html` = V2 analyzer
- `learn/index.html` = Learn Hub
- `learn.html` = backup Learn Hub for old links
- `assets/css/styles.css` = styling
- `assets/js/main.js` = calculator/analyzer logic

After upload:

1. Commit changes.
2. Push to GitHub.
3. Wait for Vercel deployment.
4. Visit `/`, `/calculators.html`, and `/tools/ai-deal-analyzer.html`.

## Contact Form Note

Replace `REPLACE_WITH_YOUR_FORMSPREE_ID` inside `contact.html` with your actual Formspree endpoint ID.
