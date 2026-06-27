# DealCalc AI Analyzer Regression Suite

Use these uploaded test PDFs to validate the AI Deal Analyzer before public promotion.

## Uploaded test cases

1. `01_houston_cma_retail_overpay.pdf`
   - Should identify retail-ready / overpriced relative to closed comps.
2. `02_distressed_wholesale_seller_packet.pdf`
   - Should identify distressed wholesale / fix-and-flip strategy.
3. `03_duplex_rental_analysis_packet.pdf`
   - Should identify rental / buy-and-hold and extract unit count, rents, expenses, and debt.
4. `04_vacant_land_flyer_spring_hill.pdf`
   - Should identify vacant land, thin margin, and due diligence requirements.
5. `05_low_data_property_flyer.pdf`
   - Should flag low data quality and avoid hallucinated values.

## Pass/fail rules

A test passes when:
- Critical fields are extracted correctly.
- Missing values are not invented.
- Strategy selection matches the document context.
- Financial logic is directionally correct.
- Risk flags and next-diligence requests appear.

## Recommended scoring

- Field extraction accuracy: 40%
- Strategy selection: 20%
- Financial logic: 20%
- Risk flags and diligence: 10%
- No hallucinated values: 10%

Target: 90%+ before public promotion.
