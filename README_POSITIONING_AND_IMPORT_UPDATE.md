# DealCalc Positioning + Calculator Import Update

This update revises the site narrative away from “underwriting” as the primary homepage language and toward clearer “AI real estate deal analysis.”

## Implemented

- Homepage headline changed to “Analyze real estate deals in minutes.”
- Homepage eyebrow changed to “AI Real Estate Deal Analysis.”
- Copy revised to explain extraction, metrics, strategy comparison, risk flags, and buy/negotiate/pass decision support.
- Feature bullets revised away from generic “10 calculators” toward outcome-based value.
- AI Analyzer copy revised from “underwriting brief” to “investment analysis.”
- Calculator directory now explains when to use AI extraction vs manual calculators.
- Calculator pages now include an “AI Import Option” section linking users to the AI Analyzer when they have a CMA, MLS sheet, flyer, or seller packet.
- Cash Flow page labeling softened toward “Rental Property Analyzer.”

## Recommendation on extraction

Do not duplicate PDF extraction logic inside every calculator. The better architecture is:

1. User uploads the document in the AI Analyzer.
2. DealCalc extracts and validates the key numbers once.
3. The user can then save the deal, compare strategies, or manually test calculator scenarios.

This release implements the user-facing bridge. A later release can add true cross-page prefill from AI Analyzer into individual calculators using saved deal data or URL/localStorage parameters.

## Files included

- index.html
- calculators.html
- tools/ai-deal-analyzer.html
- calculator/*.html

Upload contents to the repository root. Use Replace for matching files and Merge for folders.
