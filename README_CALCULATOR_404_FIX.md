# DealCalc Calculator 404 Fix

## Issue
The site links point to calculator pages under:

`/calculator/<calculator-name>.html`

Example:

`https://www.dealcalc.io/calculator/mao-calculator.html`

If the calculator HTML files are uploaded at the repository root instead of inside a `calculator/` folder, Vercel returns `404 Not Found`.

## Fix
Upload the included `calculator/` folder to the root of the GitHub repository.

Your repository should look like this:

```text
repo-root/
  index.html
  calculators.html
  tools/
    ai-deal-analyzer.html
  calculator/
    mao-calculator.html
    arv-calculator.html
    assignment-fee-calculator.html
    double-close-calculator.html
    land-flip-calculator.html
    rehab-calculator.html
    roi-calculator.html
    cash-flow-calculator.html
    cap-rate-calculator.html
    wholesale-deal-calculator.html
```

## After Upload
Redeploy on Vercel, then test:

- `/calculator/mao-calculator.html`
- `/calculator/arv-calculator.html`
- `/calculator/assignment-fee-calculator.html`
- `/calculator/double-close-calculator.html`
- `/calculator/land-flip-calculator.html`
- `/calculator/rehab-calculator.html`
- `/calculator/roi-calculator.html`
- `/calculator/cash-flow-calculator.html`
- `/calculator/cap-rate-calculator.html`
- `/calculator/wholesale-deal-calculator.html`

## Do Not Delete
Do not delete the root calculator files yet if they exist. They are harmless. The important thing is that the `/calculator/` directory exists because the internal site links and sitemap use that path.
