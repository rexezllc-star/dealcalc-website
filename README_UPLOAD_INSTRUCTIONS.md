# DealCalc Full Update V20

Upload the full contents of this folder to the GitHub repository root and overwrite existing files.

V20 focuses on underwriting accuracy and trust:

- Extraction Engine 2.0 with confidence-scored fields
- Correct property-level rent extraction
- Correct current listing status extraction
- Correct condition logic: Distressed: No + updated listing text = Updated / Retail-Ready
- Transparent underwriting value stack
- Deal Verdict card at top of report
- DealCalc Score breakdown
- Best Strategy Ranking
- Extraction Audit / source-confidence table
- Contact page email/dropdown improvements
- Keeps V19 calculators, dashboard, auth, saved deals, and routing

Critical files:
- tools/ai-deal-analyzer.html
- assets/js/main.js
- assets/css/styles.css
- contact.html
- vercel.json

Test case used for V20:
- 4313 Polk St Houston CMA should extract Pending status, Monthly Rent $2,162, Distressed: No, Updated/Retail-Ready condition, and a value stack rather than a single blind value.
