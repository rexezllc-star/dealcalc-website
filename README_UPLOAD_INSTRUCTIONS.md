# DealCalc Full Update V22

Upload the full contents of this folder to the GitHub repository root and overwrite existing files.

V22 is an extraction reliability release. It fixes the V21.1 analyzer field-sliding issue where rent, mortgage balance, listing price, and value stack could be misread from CMA PDFs.

Critical files:
- assets/js/main.js
- tools/ai-deal-analyzer.html

Expected Houston CMA test output:
- Listing Price: $395,000
- Listing Status: Pending
- Monthly Rent: $2,162
- Mortgage Balance: $247,681
- Estimated Equity: $35,319
- DealCalc Value: about $280,000
- Underwriting Range: about $267,500–$313,000
