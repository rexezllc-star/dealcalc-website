DealCalc.io V25 Upload Instructions

1. Upload all files/folders in this ZIP to the GitHub repository root.
2. Overwrite existing files.
3. Commit changes to main.
4. Let Vercel redeploy.
5. Hard-refresh the AI Analyzer page.

V25 fixes:
- Gross Rent Yield now uses Monthly Rent + Listing Price with metadata fallback.
- Retail score card shows Gross Rent Yield instead of N/A when rent exists.
- Rental strategy uses the same rent/price fallback.
- Best Use Ranking now sorts visibly by displayed score to avoid inconsistent ordering.
- Cache-busted analyzer script: assets/js/main-v25.js.
