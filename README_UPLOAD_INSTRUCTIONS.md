# DealCalc Full Update V13

Upload the full contents of this folder into the GitHub repository root and overwrite existing files.

## What V13 fixes

- Places the Other Calculators navigation strip directly between the hero message and calculator form.
- Keeps both `/calculator/` and `/calculators/` folders synchronized, but the public navigation uses `/calculator/`.
- Updates every calculator page to V13 markers and cache-busted `assets/js/calculators-v13.js`.
- Adds dedicated formulas, dedicated input fields, current-tool highlighting, and internal links across all 10 calculators.
- Improves mobile layout, focus states, sticky results, footer consistency, and calculator page SEO schema.

## Upload checklist

Replace these folders/files:

```text
calculator/
calculators/
assets/js/calculators-v13.js
assets/css/styles.css
calculators.html
README_UPLOAD_INSTRUCTIONS.md
```

After Vercel deploys, open:

```text
https://www.dealcalc.io/calculator/land-flip-calculator.html
https://www.dealcalc.io/calculator/cap-rate-calculator.html
```

You should see an Other Calculators card strip between the hero and the calculator form.
