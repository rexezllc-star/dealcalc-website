# DealCalc Full Update V21.1 Hotfix

Upload the full contents of this folder to the GitHub repository root and overwrite existing files.

This hotfix fixes the V21 AI Analyzer PDF upload failure.

What happened:
- V21 introduced an underwriting interpretation wrapper.
- Because JavaScript function declarations are hoisted, the wrapper accidentally captured itself and caused infinite recursion when a PDF was analyzed.
- The result was that PDF analysis could fail immediately after upload.

V21.1 fixes:
- Removes recursive PDF extraction wrapper.
- Restores PDF upload analysis flow.
- Keeps the V21 investor-intelligence sections.
- Improves current-listing-status detection.
- Prioritizes property-level rent.
- Preserves Updated / Retail-Ready condition detection.
- Keeps seller motivation, hidden signals, negotiation framework, renovation premium, equity reality, and best-use ranking.

Critical files:
- tools/ai-deal-analyzer.html
- assets/js/main.js
- assets/css/styles.css
