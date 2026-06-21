# DealCalc Full Update V16

Upload the full contents of this folder to the GitHub repository root and overwrite existing files.

V16 includes:
- Cleanup of public version labels and duplicate login behavior
- Shorter homepage/directory/analyzer hero sections
- Homepage primary CTA toward PDF upload
- Dashboard deal tracker pipeline
- Saved deal status updates
- Saved report view with export/print
- Related guide links on every calculator page
- Calculator folders synced: `calculator/` and `calculators/`
- Cache-busted calculator script: `assets/js/calculators-v16.js`
- Vercel apex-domain redirect from `dealcalc.io` to `www.dealcalc.io`
- Security headers

After upload:
1. Commit and push to GitHub.
2. Confirm Vercel deploy succeeds.
3. Open `/calculators.html`, `/calculator/land-flip-calculator.html`, `/tools/ai-deal-analyzer.html`, and `/dashboard.html`.
4. If Supabase is connected, run the updated `SUPABASE_SETUP.sql` so the `status` column exists.
