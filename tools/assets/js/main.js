
function trackEvent(name,params={}){try{if(window.gtag){gtag('event',name,params)}}catch(e){console.warn(e)}}
function money(n){return Number(n||0).toLocaleString(undefined,{style:'currency',currency:'USD',maximumFractionDigits:0})}
function calcMAO(){const arv=+document.getElementById('arv')?.value||0, repairs=+document.getElementById('repairs')?.value||0, fee=+document.getElementById('fee')?.value||0, pct=(+document.getElementById('rule')?.value||70)/100; const mao=arv*pct-repairs-fee; document.getElementById('maoResult').innerHTML=`<h3>Maximum Allowable Offer</h3><div class="score">${money(mao)}</div><p class="muted">Formula: ARV × ${Math.round(pct*100)}% − Repairs − Assignment Fee.</p>`; trackEvent('calculator_completed',{calculator:'mao'});}
function analyzeDeal(){const pp=+document.getElementById('purchasePrice').value||0, arv=+document.getElementById('analyzerArv').value||0, repairs=+document.getElementById('analyzerRepairs').value||0, fee=+document.getElementById('assignmentFee').value||0, closing=+document.getElementById('closingCosts').value||0, holding=+document.getElementById('holdingCosts').value||0; const mao=arv*.70-repairs-fee; const profit=arv-pp-repairs-closing-holding-fee; const spread=mao-pp; let score=50; if(profit>30000)score+=20; else if(profit>15000)score+=12; else if(profit>5000)score+=5; else score-=15; if(spread>15000)score+=15; else if(spread>0)score+=8; else score-=18; const repairRatio=arv?repairs/arv:1; if(repairRatio<.15)score+=10; else if(repairRatio>.30)score-=10; score=Math.max(0,Math.min(100,Math.round(score))); let rec=score>=80?'Strong deal candidate':score>=65?'Workable deal, verify comps and costs':score>=50?'Borderline deal, renegotiate price':'Pass or renegotiate hard'; let risk=score>=80?'Low':score>=65?'Moderate':score>=50?'High':'Very High'; document.getElementById('analysisResult').innerHTML=`<div class="score">${score}</div><h3>${rec}</h3><p><span class="pill">Risk: ${risk}</span><span class="pill">MAO: ${money(mao)}</span><span class="pill">Estimated Profit: ${money(profit)}</span><span class="pill">Spread to MAO: ${money(spread)}</span></p><h4>AI-style deal notes</h4><ul><li>${spread>=0?'Purchase price is inside the MAO range.':'Purchase price is above the MAO range.'}</li><li>${profit>0?'Projected profit is positive before financing/tax effects.':'Projected profit is negative or too tight.'}</li><li>${repairRatio<.2?'Repair ratio appears manageable.':'Repair ratio may create execution risk.'}</li></ul>`; trackEvent('deal_analyzed',{score:score,risk:risk});}
document.addEventListener('submit',e=>{if(e.target.matches('[data-track-form]'))trackEvent('contact_submit',{form:e.target.dataset.trackForm})});

function val(id){return +document.getElementById(id)?.value||0}
function textVal(id){return (document.getElementById(id)?.value||'').trim()}
function pct(n){return Number(n||0).toLocaleString(undefined,{style:'percent',maximumFractionDigits:1})}
function updateAnalyzerMode(){
  const type=document.getElementById('analysisType')?.value||'wholesale';
  document.querySelectorAll('.mode').forEach(el=>el.classList.add('hidden-field'));
  document.querySelectorAll('.'+type+'-mode').forEach(el=>el.classList.remove('hidden-field'));
  const fee=document.getElementById('assignmentFee');
  if(!fee)return;
  if(type==='wholesale')fee.previousElementSibling.textContent='Assignment Fee / Desired Profit';
  if(type==='flip')fee.previousElementSibling.textContent='Target Profit';
  if(type==='land')fee.previousElementSibling.textContent='Target Profit / Spread';
  if(type==='rental')fee.previousElementSibling.textContent='Initial Cash Invested / Down Payment';
  if(type==='homeowner')fee.previousElementSibling.textContent='Agent Commission / Selling Fee';
  trackEvent('analyzer_mode_selected',{analysis_type:type});
}
function baseRisk(score){return score>=80?'Low':score>=65?'Moderate':score>=50?'High':'Very High'}
function clampScore(n){return Math.max(0,Math.min(100,Math.round(n)))}
function analyzeDealV2(){
  const type=textVal('analysisType')||'wholesale', label=textVal('propertyLabel')||'Deal Analysis';
  const price=val('purchasePrice'), arv=val('analyzerArv'), repairs=val('analyzerRepairs'), fee=val('assignmentFee'), closing=val('closingCosts'), holding=val('holdingCosts'), loan=val('loanBalance'), rent=val('monthlyRent'), expenses=val('monthlyExpenses'), prep=val('salePrepCosts');
  let score=50, metrics=[], notes=[], rec='Review numbers and verify comps.', title='Deal Analysis', profit=0;
  const resale=arv||price;
  const mao=resale*.70-repairs-fee;
  if(type==='wholesale'){
    title='Wholesale Assignment Analysis'; profit=resale-price-repairs-closing-holding-fee; const spread=mao-price; const repairRatio=resale?repairs/resale:1;
    score+=profit>30000?20:profit>15000?12:profit>5000?5:-15; score+=spread>15000?15:spread>0?8:-18; score+=repairRatio<.15?10:repairRatio>.30?-10:0;
    rec=score>=80?'Strong wholesale candidate. Lock terms, verify buyer appetite, and confirm assignability.':score>=65?'Workable wholesale deal. Verify comps, title, access, and buyer spread.':score>=50?'Borderline. Renegotiate purchase price or reduce fee expectations.':'Pass or renegotiate hard before contracting.';
    metrics=[['MAO',money(mao)],['Est. Profit / Spread',money(profit)],['Spread to MAO',money(spread)],['Repair Ratio',pct(repairRatio)]];
    notes=[spread>=0?'Purchase price is inside the MAO range.':'Purchase price is above the MAO range.', profit>0?'Projected spread is positive before taxes.':'Projected spread is negative or too tight.', repairRatio<.2?'Repair ratio appears manageable.':'Repair ratio may create execution risk.'];
  }
  if(type==='flip'){
    title='Fix & Flip Analysis'; profit=resale-price-repairs-closing-holding; const roi=(price+repairs+closing+holding)?profit/(price+repairs+closing+holding):0; const margin=resale?profit/resale:0;
    score+=profit>50000?25:profit>25000?15:profit>10000?6:-18; score+=roi>.25?15:roi>.15?8:roi<.08?-12:0; score+=margin>.18?10:margin<.08?-10:0;
    rec=score>=80?'Strong flip candidate if comps, contractor bids, and timeline are reliable.':score>=65?'Potentially workable flip. Tighten repair estimate and resale comps.':score>=50?'Borderline flip. Profit may not justify execution risk.':'Weak flip candidate unless purchase price improves.';
    metrics=[['Projected Flip Profit',money(profit)],['ROI on Project Cost',pct(roi)],['Profit Margin',pct(margin)],['Total Project Cost',money(price+repairs+closing+holding)]];
    notes=[profit>0?'Projected flip profit is positive.':'Projected flip profit is negative.', roi>.15?'ROI clears a reasonable flip screen.':'ROI may be too thin for flip risk.', repairs/resale>.3?'Repair load is heavy relative to resale value.':'Repair load appears manageable.'];
  }
  if(type==='rental'){
    title='Rental / Buy & Hold Analysis'; const cashInvested=fee||Math.max(0,price-loan)+repairs+closing; const monthlyCashFlow=rent-expenses; const annualCashFlow=monthlyCashFlow*12; const coc=cashInvested?annualCashFlow/cashInvested:0; const equity=resale-price-repairs;
    score+=monthlyCashFlow>500?20:monthlyCashFlow>200?10:monthlyCashFlow>0?4:-15; score+=coc>.12?18:coc>.08?10:coc<.04?-10:0; score+=equity>20000?10:equity<0?-10:0;
    rec=score>=80?'Strong rental candidate based on cash flow and return. Verify rent comps, taxes, insurance, and repairs.':score>=65?'Potentially workable rental. Confirm operating expenses and financing terms.':score>=50?'Borderline rental. Cash flow or cash-on-cash return may be thin.':'Weak rental based on current assumptions.';
    metrics=[['Monthly Cash Flow',money(monthlyCashFlow)],['Annual Cash Flow',money(annualCashFlow)],['Cash-on-Cash Return',pct(coc)],['Estimated Equity Position',money(equity)]];
    notes=[monthlyCashFlow>0?'Rental appears cash-flow positive.':'Rental appears cash-flow negative.', coc>.08?'Cash-on-cash return is attractive.':'Cash-on-cash return may be low.', equity>0?'Estimated equity cushion is positive.':'Little or no equity cushion based on inputs.'];
  }
  if(type==='land'){
    title='Vacant Land Flip Analysis'; profit=resale-price-closing-holding-fee; const margin=resale?profit/resale:0; const markup=price?profit/price:0;
    score+=profit>30000?25:profit>15000?15:profit>5000?6:-15; score+=margin>.3?18:margin>.15?10:margin<.08?-10:0; score+=holding<5000?5:-5;
    rec=score>=80?'Strong land flip candidate if zoning, access, utilities, flood/wetlands, and title check out.':score>=65?'Workable land opportunity. Verify buildability and buyer demand.':score>=50?'Borderline land deal. You likely need a lower purchase price or clearer exit.':'Weak land flip unless terms improve materially.';
    metrics=[['Projected Land Profit',money(profit)],['Profit Margin',pct(margin)],['Markup on Cost',pct(markup)],['Total Costs',money(price+closing+holding+fee)]];
    notes=[profit>0?'Resale spread is positive.':'Resale spread is negative.', margin>.15?'Margin gives some room for negotiation.':'Margin is thin for land liquidity risk.', 'Verify access, zoning, utilities, flood zone, wetlands, and title before relying on the score.'];
  }
  if(type==='homeowner'){
    title='Homeowner Equity Analysis'; const commission=fee; const estimatedSaleCosts=commission+closing+prep; const grossEquity=resale-loan; const netEquity=resale-loan-estimatedSaleCosts; const ltv=resale?loan/resale:0;
    score+=netEquity>100000?25:netEquity>50000?15:netEquity>10000?5:-15; score+=ltv<.6?15:ltv<.8?8:ltv>.95?-15:0;
    rec=score>=80?'Strong equity position. Selling, refinancing, or using equity may be worth comparing.':score>=65?'Healthy equity position. Review net proceeds and market timing.':score>=50?'Some equity, but transaction costs matter. Confirm payoff and sale costs.':'Limited equity based on inputs. Be careful with sale costs, liens, or payoff amounts.';
    metrics=[['Gross Equity',money(grossEquity)],['Estimated Net Equity',money(netEquity)],['Loan-to-Value',pct(ltv)],['Estimated Sale Costs',money(estimatedSaleCosts)]];
    notes=[netEquity>0?'Estimated net equity is positive after sale costs.':'Estimated net equity may be low or negative after sale costs.', ltv<.8?'Loan-to-value appears manageable.':'Loan-to-value is high.', 'Confirm payoff amount, taxes, liens, agent fees, concessions, and repair credits.'];
  }
  score=clampScore(score); const risk=baseRisk(score);
  const metricHtml=metrics.map(([k,v])=>`<div class="metric"><span class="muted">${k}</span><strong>${v}</strong></div>`).join('');
  const noteHtml=notes.map(n=>`<li>${n}</li>`).join('');
  document.getElementById('analysisResult').innerHTML=`<p class="eyebrow">${label}</p><div class="score">${score}</div><h3>${title}</h3><p><span class="pill">Risk: ${risk}</span><span class="pill">Type: ${type}</span></p><div class="metric-grid">${metricHtml}</div><div class="recommendation"><strong>Recommendation:</strong><br>${rec}</div><h4>Analysis Notes</h4><ul class="small-list">${noteHtml}</ul><p class="muted">Educational estimate only. Verify comps, title, taxes, repairs, financing, insurance, local rules, and transaction costs before making a decision.</p><p><button class="btn secondary" onclick="window.print()">Print / Save PDF</button></p>`;
  trackEvent('deal_analyzed',{analysis_type:type,score:score,risk:risk});
}
function clearAnalyzer(){['propertyLabel','purchasePrice','analyzerArv','analyzerRepairs','assignmentFee','closingCosts','holdingCosts','loanBalance','monthlyRent','monthlyExpenses','salePrepCosts','documentNotes'].forEach(id=>{const el=document.getElementById(id); if(el)el.value=''}); const r=document.getElementById('analysisResult'); if(r)r.innerHTML='<h3>Deal analysis will appear here.</h3><p class="muted">Enter your numbers or upload a PDF to begin.</p>'; const s=document.getElementById('pdfStatus'); if(s)s.textContent='No PDF uploaded yet.';}
function parseFirstMoney(text,patterns){for(const pat of patterns){const m=text.match(pat); if(m&&m[1])return Number(m[1].replace(/[$,]/g,''))||0}return 0}
function applyExtractedNumbers(text){const clean=text.replace(/\s+/g,' '); const lower=clean.toLowerCase(); const map={purchasePrice:parseFirstMoney(clean,[/purchase price[:\s$]*([\d,]+)/i,/list price[:\s$]*([\d,]+)/i,/asking price[:\s$]*([\d,]+)/i,/price[:\s$]*([\d,]+)/i]), analyzerArv:parseFirstMoney(clean,[/arv[:\s$]*([\d,]+)/i,/after repair value[:\s$]*([\d,]+)/i,/resale value[:\s$]*([\d,]+)/i,/estimated value[:\s$]*([\d,]+)/i]), analyzerRepairs:parseFirstMoney(clean,[/repair(?:s)?[:\s$]*([\d,]+)/i,/rehab[:\s$]*([\d,]+)/i,/renovation[:\s$]*([\d,]+)/i]), monthlyRent:parseFirstMoney(clean,[/monthly rent[:\s$]*([\d,]+)/i,/rent[:\s$]*([\d,]+)/i]), loanBalance:parseFirstMoney(clean,[/loan balance[:\s$]*([\d,]+)/i,/mortgage balance[:\s$]*([\d,]+)/i,/payoff[:\s$]*([\d,]+)/i])}; Object.entries(map).forEach(([id,v])=>{const el=document.getElementById(id); if(el&&v&&!el.value)el.value=v}); if(lower.includes('rent')){const t=document.getElementById('analysisType'); if(t){t.value='rental'; updateAnalyzerMode();}} trackEvent('pdf_numbers_extracted',{});}
async function handleDealPdfUpload(event){const file=event.target.files?.[0]; const status=document.getElementById('pdfStatus'); const notes=document.getElementById('documentNotes'); if(!file)return; if(status)status.textContent='Reading PDF locally...'; try{if(window.pdfjsLib){pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; const buf=await file.arrayBuffer(); const pdf=await pdfjsLib.getDocument({data:buf}).promise; let out=''; for(let i=1;i<=Math.min(pdf.numPages,10);i++){const page=await pdf.getPage(i); const content=await page.getTextContent(); out+=content.items.map(item=>item.str).join(' ')+'\n\n';} if(notes)notes.value=out.slice(0,12000); applyExtractedNumbers(out); if(status)status.textContent=`PDF loaded: ${file.name}. Extracted text from ${Math.min(pdf.numPages,10)} page(s).`; trackEvent('deal_pdf_uploaded',{pages:pdf.numPages});}else{if(status)status.textContent='PDF reader did not load. Paste the deal details manually.';}}catch(err){console.error(err); if(status)status.textContent='Could not read this PDF. It may be scanned or protected. Paste the key numbers manually.'; trackEvent('deal_pdf_upload_failed',{});}}
document.addEventListener('DOMContentLoaded',updateAnalyzerMode);
