# DealCalc.io Full Update V9 — Accounts + Saved Deals

Upload/replace the full contents of this folder into your GitHub repository root, then commit and push.

## What V9 Adds

- Login / Create Account page: `/auth.html`
- Dashboard page: `/dashboard.html`
- Supabase configuration file: `/assets/js/supabase-config.js`
- Supabase authentication logic: `/assets/js/auth.js`
- Save Deal button in AI Deal Analyzer results
- Saved deal history in Dashboard
- Local browser fallback if Supabase is not configured yet
- Contact page email link: `info@dealcalc.io`
- Contact reason dropdown
- Footer email link across pages

## Important Supabase Setup

1. Create a free Supabase project.
2. Go to Project Settings → API.
3. Copy:
   - Project URL
   - anon public key
4. Open:

```text
assets/js/supabase-config.js
```

5. Replace:

```text
REPLACE_WITH_SUPABASE_PROJECT_URL
REPLACE_WITH_SUPABASE_ANON_PUBLIC_KEY
```

6. In Supabase SQL Editor, run:

```text
SUPABASE_SETUP.sql
```

7. In Supabase Auth settings, add these redirect URLs:

```text
https://www.dealcalc.io/dashboard.html
https://dealcalc.io/dashboard.html
http://localhost:3000/dashboard.html
```

8. Optional: enable Google provider in Supabase Auth Providers.

## Files to Confirm After Upload

```text
auth.html
dashboard.html
assets/js/auth.js
assets/js/supabase-config.js
SUPABASE_SETUP.sql
tools/ai-deal-analyzer.html
assets/js/main.js
assets/css/styles.css
contact.html
sitemap.xml
```

## How It Works Before Supabase Is Configured

If Supabase is not configured yet, users can still click Save Deal and the deal will save locally in their browser. Once Supabase is configured and users log in, deals save to the cloud.
