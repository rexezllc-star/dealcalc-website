# DealCalc Full Update V6

## What changed

V6 focuses on making the AI Deal Analyzer more presentable and more useful.

### Key improvements

- PDF upload is now the first step.
- Analysis starts automatically after upload.
- The analyzer no longer dumps a wall of extracted text as the main output.
- Results are displayed as a concise investor-style deal brief.
- Strategy comparison is shown in score cards.
- Output includes:
  - Deal Score
  - Best-fit strategy
  - Key financial metrics
  - What the numbers mean
  - Next diligence checks
- Extracted PDF details are summarized separately.
- Raw extracted text is hidden inside an optional details section.
- Manual input edits auto-refresh the analysis after a short delay.

## Files to replace

Upload the full folder contents to your GitHub repository root and replace existing files.

Most important files:

- `tools/ai-deal-analyzer.html`
- `assets/js/main.js`
- `assets/css/styles.css`

Then commit and push. Vercel should redeploy automatically.
