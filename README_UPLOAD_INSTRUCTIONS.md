# DealCalc Full Update V15 — Cleanup + Feature Stabilization

Upload/replace the full contents of this folder into the GitHub repository root.

## Primary fixes
- Removes duplicate Login buttons.
- Removes public version labels like V12/V14 from live pages.
- Standardizes global navigation.
- Hides Dashboard from the static nav until auth script resolves user state.
- Improves dashboard logged-out state instead of showing indefinite loading.
- Keeps calculator form above other-calculator navigation.
- Keeps `calculator/` and `calculators/` folders synced.
- Updates calculator scripts to `assets/js/calculators-v15.js` for cache busting.
- Adds basic Vercel security headers.

## Important files to replace
- `index.html`
- `calculators.html`
- `contact.html`
- `dashboard.html`
- `tools/ai-deal-analyzer.html`
- `calculator/`
- `calculators/`
- `assets/css/styles.css`
- `assets/js/auth.js`
- `assets/js/calculators-v15.js`
- `vercel.json`

## Supabase
Keep using your existing Supabase setup. If you have not configured it yet, update:

`assets/js/supabase-config.js`

and run:

`SUPABASE_SETUP.sql`

in Supabase SQL Editor.
