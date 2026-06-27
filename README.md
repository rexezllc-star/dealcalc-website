# DealCalc AI Analyzer Test Suite

Use these PDFs to regression-test the AI Deal Analyzer. Upload each PDF, compare extracted fields and verdicts against `expected_results.json`, and log discrepancies.

## Pass/Fail Rules

A test passes when:
- Critical fields are extracted correctly: address, property type, price/status/value/rent when present.
- The analyzer does not invent missing values.
- Strategy selection matches the document context.
- The recommendation is directionally correct.
- Confidence/data-quality warnings appear when data is thin or conflicting.

## Recommended scoring

- Field extraction accuracy: 40%
- Strategy selection: 20%
- Financial logic: 20%
- Risk flags and next diligence: 10%
- No hallucinated values: 10%

Target: 90%+ before public promotion.

## How to use

1. Upload each PDF to `/tools/ai-deal-analyzer.html`.
2. Save screenshots or copy the resulting extracted fields/report.
3. Compare to `expected_results.json`.
4. Fix extraction rules, scoring, and strategy logic.
5. Re-run the same PDFs after every analyzer change.
