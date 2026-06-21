# DealCalc Full Update V5 — AI Analyzer Optimization

Upload/replace the full contents of this folder into the GitHub repository root.

## Main V5 Changes

- AI Analyzer now separates **Property Type** from **Analysis Goal**.
- PDF upload now attempts to auto-detect whether the document is vacant land, SFR/residential, multifamily, condo, or unknown.
- PDF upload now suggests the best analysis path automatically:
  - Vacant Land Analysis
  - Homeowner Equity Analysis
  - Rental / Buy & Hold Analysis
  - Retail Listing / Overpay Check
  - Fix & Flip Analysis
  - Wholesale Assignment Analysis
- Optimized for CMA reports like the uploaded examples:
  - `Property Type: Land` triggers land analysis.
  - `Single Family (SFR)`, beds/baths/sq ft, rent, mortgage balance, and equity trigger residential/rental/equity analysis.
- Adds extraction summary after PDF upload.
- Adds listing price field and retail overpay check.
- Preserves manual override: users can change property type or analysis goal after PDF detection.

## Files Most Important to Replace

- `tools/ai-deal-analyzer.html`
- `assets/js/main.js`
- `assets/css/styles.css`
- `README_UPLOAD_INSTRUCTIONS.md`

After upload:

1. Commit changes.
2. Push to GitHub.
3. Wait for Vercel deployment.
4. Test with the two CMA PDFs.
