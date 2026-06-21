function trackEvent(name,params={}){try{if(window.gtag){gtag('event',name,params)}}catch(e){console.warn(e)}}
function money(n){return Number(n||0).toLocaleString(undefined,{style:'currency',currency:'USD',maximumFractionDigits:0})}
function pct(n){return Number(n||0).toLocaleString(undefined,{style:'percent',maximumFractionDigits:1})}
function val(id){return +document.getElementById(id)?.value||0}
function textVal(id){return (document.getElementById(id)?.value||'').trim()}
function setVal(id,v,force=false){const el=document.getElementById(id); if(el && (force || !el.value) && Number.isFinite(+v) && +v!==0){el.value=Math.round(+v)}}
function setText(id,v,force=false){const el=document.getElementById(id); if(el && (force || !el.value) && v){el.value=v}}
function clampScore(n){return Math.max(0,Math.min(100,Math.round(n)))}
function baseRisk(score){return score>=80?'Low':score>=65?'Moderate':score>=50?'High':'Very High'}
function safeDiv(a,b){return b? a/b : 0}
function escapeHtml(str=''){return String(str).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]))}

function calcMAO(){const arv=+document.getElementById('arv')?.value||0, repairs=+document.getElementById('repairs')?.value||0, fee=+document.getElementById('fee')?.value||0, pctRule=(+document.getElementById('rule')?.value||70)/100; const mao=arv*pctRule-repairs-fee; const r=document.getElementById('maoResult'); if(r)r.innerHTML=`<h3>Maximum Allowable Offer</h3><div class="score">${money(mao)}</div><p class="muted">Formula: ARV × ${Math.round(pctRule*100)}% − Repairs − Assignment Fee.</p>`; trackEvent('calculator_completed',{calculator:'mao'});}
function analyzeDeal(){return analyzeDealV6 ? analyzeDealV6(true) : null}
function analyzeDealV2(){return analyzeDealV6(true)}
function analyzeDealV5(){return analyzeDealV6(true)}

function updateAnalyzerMode(){
  const analysis=document.getElementById('analysisType')?.value||'auto';
  const property=document.getElementById('propertyType')?.value||'auto';
  const effective = analysis==='auto' ? (property==='land'?'land':property==='auto'?'retail':'retail') : analysis;
  document.querySelectorAll('.mode').forEach(el=>el.classList.add('hidden-field'));
  document.querySelectorAll('.'+effective+'-mode').forEach(el=>el.classList.remove('hidden-field'));
  const fee=document.getElementById('assignmentFee');
  if(fee && fee.previousElementSibling){
    const labels={auto:'Desired Profit / Cash Invested / Fee',wholesale:'Assignment Fee / Desired Profit',flip:'Minimum Desired Profit',rental:'Cash Invested / Down Payment',land:'Target Profit / Resale Spread',homeowner:'Agent Commission / Selling Fee',retail:'Negotiation Cushion / Desired Discount'};
    fee.previousElementSibling.textContent=labels[effective]||labels.auto;
  }
}

function parseMoneyAfter(text, patterns){
  for(const p of patterns){
    const re = new RegExp(p+'\\s*:?\\s*\\$?\\s*([0-9][0-9,]*(?:\\.\\d+)?)','i');
    const m = text.match(re); if(m) return +m[1].replace(/,/g,'');
  }
  return 0;
}
function parseNumberAfter(text, patterns){
  for(const p of patterns){
    const re = new RegExp(p+'\\s*:?\\s*([0-9][0-9,]*(?:\\.\\d+)?)','i');
    const m = text.match(re); if(m) return +m[1].replace(/,/g,'');
  }
  return 0;
}
function parseAddress(text){
  const title = text.match(/Comparative Market Analysis\s+([^\n]+?\d{5})/i);
  if(title) return title[1].trim();
  const situs = text.match(/SITUS ADDRESS OF\s+(.+?\d{5}(?:-\d{4})?)/i);
  if(situs) return situs[1].replace(/\s+/g,' ').trim();
  return '';
}
function detectFromText(text){
  const t=text.replace(/\s+/g,' ');
  const lower=t.toLowerCase();
  const data={raw:text};
  data.address=parseAddress(text);
  data.estimatedValue=parseMoneyAfter(t,['Estimated Value','Market Value','Value']);
  data.listingPrice=parseMoneyAfter(t,['Current Listing Status.*?Price','List Price','Listing Price','Listed At','Price']);
  data.avgSalePrice=parseMoneyAfter(t,['Avg\\.? Sale Price','Average Sale Price']);
  data.mortgageBalance=parseMoneyAfter(t,['Mortgage Balance','Loan Balance']);
  data.estimatedEquity=parseMoneyAfter(t,['Estimated Equity','Equity']);
  data.monthlyRent=parseMoneyAfter(t,['Monthly Rent','Average Monthly Rent']);
  data.propertyTax=parseMoneyAfter(t,['Property Tax','Annual Tax','Taxes']);
  data.beds=parseNumberAfter(t,['Bedrooms','Beds']);
  data.baths=parseNumberAfter(t,['Bathrooms','Baths']);
  data.sqft=parseNumberAfter(t,['Square Feet','Living Area','Sq\\.?Ft\\.?']);
  data.lotSize=parseNumberAfter(t,['Lot Size']);
  data.yearBuilt=parseNumberAfter(t,['Year Built']);
  data.daysOnMarket=parseNumberAfter(t,['Days on Market','Average DOM','DOM']);
  data.compsCount=parseNumberAfter(t,['Comparables Properties','Properties']);
  data.propertyType='unknown';
  if(/Property Type\s*:?\s*Land|Residential-Vacant Land|Vacant Land|\bLot\b/i.test(t)) data.propertyType='land';
  if(/Single Family|SFR|Bedrooms\s*:?\s*\d|Bathrooms\s*:?\s*\d|Living Area\s*:?\s*\d/i.test(t)) data.propertyType='sfr';
  if(/Multifamily|Duplex|Triplex|Fourplex/i.test(t)) data.propertyType='multi';
  if(/Condo|Townhome|Townhouse/i.test(t)) data.propertyType='condo';
  data.status = (/Status\s*:?\s*Pending/i.test(t) ? 'Pending' : /Status\s*:?\s*On Market/i.test(t) ? 'On Market' : /Status\s*:?\s*Off Market/i.test(t) ? 'Off Market' : 'Unknown');
  data.distressed = /Distressed\s*:?\s*Yes|Foreclosure|Pre-Foreclosure|Auction/i.test(t) && !/There is no foreclosure data available/i.test(t);
  data.liens = parseMoneyAfter(t,['Liens']);
  const equityRatio = safeDiv(data.estimatedEquity, data.estimatedValue || data.listingPrice || data.avgSalePrice);
  let suggested='retail', why=[];
  if(data.propertyType==='land'){ suggested='land'; why.push('document reads as vacant land'); }
  else if(data.monthlyRent && data.estimatedValue){ suggested='rental'; why.push('rent estimate is available'); }
  else if(data.mortgageBalance || data.estimatedEquity){ suggested='homeowner'; why.push('equity and mortgage data are present'); }
  if(data.listingPrice && data.estimatedValue && data.listingPrice > data.estimatedValue*1.08){ suggested='retail'; why.push('listing price is above estimated value'); }
  if(data.status==='Off Market' && data.propertyType==='land') suggested='land';
  data.suggestedAnalysis=suggested;
  data.why=why;
  data.confidence = data.propertyType!=='unknown' ? (data.address && (data.estimatedValue||data.listingPrice)? 92:78) : 55;
  data.equityRatio=equityRatio;
  return data;
}
function applyDetectedData(data){
  setText('propertyLabel',data.address,true);
  setVal('listingPrice',data.listingPrice,true);
  setVal('purchasePrice',data.listingPrice || data.estimatedValue || data.avgSalePrice,true);
  setVal('analyzerArv',data.estimatedValue || data.avgSalePrice,true);
  setVal('loanBalance',data.mortgageBalance,true);
  setVal('monthlyRent',data.monthlyRent,true);
  const taxMonthly=data.propertyTax? data.propertyTax/12 : 0;
  if(data.monthlyRent && !val('monthlyExpenses')) setVal('monthlyExpenses', Math.round(data.monthlyRent*.38 + taxMonthly), true);
  const p=document.getElementById('propertyType'); if(p && data.propertyType) p.value=data.propertyType;
  const a=document.getElementById('analysisType'); if(a && data.suggestedAnalysis) a.value=data.suggestedAnalysis;
  updateAnalyzerMode();
  const summary=document.getElementById('extractionSummary');
  if(summary){
    summary.classList.remove('hidden-field');
    summary.innerHTML=`<div class="extract-top"><strong>Detected:</strong> ${escapeHtml(labelProperty(data.propertyType))} · ${escapeHtml(labelAnalysis(data.suggestedAnalysis))} <span class="pill">${data.confidence}% confidence</span></div>
    <div class="extract-grid">
      ${data.address?`<span>Address <strong>${escapeHtml(data.address)}</strong></span>`:''}
      ${data.estimatedValue?`<span>Est. Value <strong>${money(data.estimatedValue)}</strong></span>`:''}
      ${data.listingPrice?`<span>List Price <strong>${money(data.listingPrice)}</strong></span>`:''}
      ${data.monthlyRent?`<span>Rent <strong>${money(data.monthlyRent)}/mo</strong></span>`:''}
      ${data.mortgageBalance?`<span>Loan Balance <strong>${money(data.mortgageBalance)}</strong></span>`:''}
      ${data.estimatedEquity?`<span>Equity <strong>${money(data.estimatedEquity)}</strong></span>`:''}
    </div>`;
  }
}
function labelProperty(v){return ({auto:'Auto',land:'Vacant Land',sfr:'Single Family',multi:'Multifamily',condo:'Condo / Townhome',unknown:'Unknown'})[v]||v}
function labelAnalysis(v){return ({auto:'Auto',retail:'Retail / Overpay Check',homeowner:'Homeowner Equity',rental:'Rental',flip:'Fix & Flip',wholesale:'Wholesale',land:'Land Flip'})[v]||v}

function getInputs(){
  return {property:textVal('propertyLabel'),propertyType:document.getElementById('propertyType')?.value||'auto',analysisType:document.getElementById('analysisType')?.value||'auto',listing:val('listingPrice'),price:val('purchasePrice'),value:val('analyzerArv'),repairs:val('analyzerRepairs'),fee:val('assignmentFee'),closing:val('closingCosts'),holding:val('holdingCosts'),loan:val('loanBalance'),rent:val('monthlyRent'),expenses:val('monthlyExpenses'),prep:val('salePrepCosts')};
}
function scoreRetail(x){const price=x.listing||x.price, value=x.value||x.price, premium=safeDiv(price-value,value), equity=x.value-x.loan; let score=70-premium*180; if(price && value && price<=value*.95)score+=20; if(x.rent){const rtp=safeDiv(x.rent*12,price); score+=rtp>.08?15:rtp>.06?5:-8} return {type:'retail',score:clampScore(score),metrics:[['Value Gap',money(value-price)],['Price vs Value',pct(premium)],['Owner Equity',money(equity)],['Rent-to-Price',x.rent?pct(safeDiv(x.rent*12,price)):'N/A']],headline:premium>.15?'Likely overpriced against the extracted value.':premium>0?'Price appears above estimated value.':premium>-0.08?'Near fair value.':'Potentially below value.',risk:premium>.15?'High':premium>0?'Moderate':'Low'} }
function scoreHomeowner(x){const value=x.value||x.price||x.listing, loan=x.loan, selling=(x.fee||0)+(x.prep||0)+(x.closing||0), equity=value-loan, proceeds=equity-selling; const er=safeDiv(equity,value); let score=50+er*100; if(proceeds>50000)score+=10; if(er<.1)score-=18; return {type:'homeowner',score:clampScore(score),metrics:[['Estimated Equity',money(equity)],['Equity %',pct(er)],['Net Sale Proceeds',money(proceeds)],['Loan Balance',money(loan)]],headline:er>.25?'Strong equity position.':er>.12?'Moderate equity position.':'Thin equity after selling costs.',risk:er>.25?'Low':er>.12?'Moderate':'High'} }
function scoreRental(x){const price=x.price||x.listing||x.value, rent=x.rent, expenses=x.expenses||rent*.4, cash=x.fee||Math.max(price*.25,0), noi=(rent-expenses)*12, cap=safeDiv(noi,price), coc=safeDiv(noi,cash), monthly=rent-expenses; let score=50+cap*350+coc*70; if(monthly>500)score+=12; if(monthly<0)score-=25; return {type:'rental',score:clampScore(score),metrics:[['Monthly Cash Flow',money(monthly)],['Annual NOI',money(noi)],['Cap Rate',pct(cap)],['Cash-on-Cash',cash?pct(coc):'N/A']],headline:monthly>400?'Positive rental candidate based on extracted rent.':monthly>0?'Rental may work, but margin is not large.':'Rental cash flow appears weak from current numbers.',risk:monthly>400?'Low':monthly>0?'Moderate':'High'} }
function scoreFlip(x){const price=x.price||x.listing, resale=x.value||x.listing, repairs=x.repairs, total=price+repairs+x.closing+x.holding, profit=resale-total, roi=safeDiv(profit,total), margin=safeDiv(profit,resale); let score=45+roi*160+margin*80; if(profit>50000)score+=15; if(profit<15000)score-=18; return {type:'flip',score:clampScore(score),metrics:[['Projected Profit',money(profit)],['Total Project Cost',money(total)],['ROI',pct(roi)],['Profit Margin',pct(margin)]],headline:profit>50000?'Strong flip spread if repair budget is accurate.':profit>20000?'Possible flip, but verify comps and repairs.':'Flip margin appears too thin.',risk:profit>50000?'Moderate':profit>20000?'High':'Very High'} }
function scoreWholesale(x){const resale=x.value||x.listing, repairs=x.repairs, fee=x.fee||15000, mao=resale*.70-repairs-fee, price=x.price||x.listing, spread=mao-price; let score=50+safeDiv(spread,resale)*220; if(spread>20000)score+=20; if(spread<0)score-=25; return {type:'wholesale',score:clampScore(score),metrics:[['MAO',money(mao)],['Spread to MAO',money(spread)],['Target Fee',money(fee)],['Repair Ratio',pct(safeDiv(repairs,resale))]],headline:spread>0?'Wholesale numbers are inside MAO.': 'Seller price appears above wholesale MAO.',risk:spread>20000?'Low':spread>0?'Moderate':'Very High'} }
function scoreLand(x){const price=x.price||x.listing, resale=x.value||0, costs=x.closing+x.holding, profit=resale-price-costs, roi=safeDiv(profit,price+costs), discount=safeDiv(resale-price,resale); let score=45+roi*120+discount*60; if(!resale)score=45; if(profit>30000)score+=15; if(profit<10000)score-=15; return {type:'land',score:clampScore(score),metrics:[['Resale Spread',money(profit)],['Land ROI',pct(roi)],['Discount to Value',pct(discount)],['Estimated Resale',resale?money(resale):'Needs comp']],headline:profit>25000?'Land flip has meaningful spread if comp value is reliable.':profit>0?'Land spread exists, but diligence matters.':'Land pricing looks weak or resale value is missing.',risk:profit>25000?'Moderate':profit>0?'High':'Very High'} }
function recommendationFromScores(scores, selected){return selected==='auto'? scores.slice().sort((a,b)=>b.score-a.score)[0] : scores.find(s=>s.type===selected) || scores[0]}
function insightBullets(x,best,scores){
  const bullets=[];
  if(x.listing && x.value){const gap=x.listing-x.value; if(gap>0)bullets.push(`Asking price is ${money(gap)} above extracted value; negotiate or verify the valuation source before proceeding.`); else bullets.push(`Asking price is ${money(Math.abs(gap))} below extracted value; this may create room for equity or spread.`)}
  if(x.loan && x.value){const e=x.value-x.loan; bullets.push(`Estimated equity is about ${money(e)}, which matters most for homeowner, seller-finance, or distressed seller outreach.`)}
  if(x.rent && (x.listing||x.price)){const rtp=safeDiv(x.rent*12,(x.listing||x.price)); bullets.push(`Rent-to-price is ${pct(rtp)}; generally stronger rental candidates show higher income yield before expenses.`)}
  if(x.propertyType==='land') bullets.push('Because this appears to be land, verify buildability, access, utilities, zoning, flood/wetland risk, HOA restrictions, and recent land-only comps.');
  if(best.score<60) bullets.push('Deal score is weak; the next move is price negotiation, not deeper underwriting.');
  if(!x.value) bullets.push('No reliable value/ARV was detected. Add a resale value before relying on the score.');
  return bullets.slice(0,5);
}
function nextSteps(x,best){
  const steps=['Verify the extracted numbers against the original document and public records.'];
  if(best.type==='retail') steps.push('Pull 3-5 closest sold comps and confirm whether the list price is justified.');
  if(best.type==='rental') steps.push('Confirm rent with active rentals and replace estimated expenses with taxes, insurance, vacancy, repairs, and management.');
  if(best.type==='flip') steps.push('Get a contractor repair estimate and use conservative resale comps.');
  if(best.type==='land') steps.push('Check zoning, utilities, road access, flood/wetlands, title, and buyer demand before making an offer.');
  if(best.type==='wholesale') steps.push('Calculate buyer-facing spread and confirm assignment or double-close requirements.');
  if(best.type==='homeowner') steps.push('Estimate agent commissions, closing costs, payoff amount, and sale-prep costs for net proceeds.');
  return steps.slice(0,4);
}
function analyzeDealV6(manual=false){
  const box=document.getElementById('analysisResult'); if(!box)return;
  const x=getInputs(); const selected=x.analysisType;
  const scores=[scoreRetail(x),scoreHomeowner(x),scoreRental(x),scoreFlip(x),scoreWholesale(x),scoreLand(x)];
  const best=recommendationFromScores(scores, selected==='land'?'land':selected);
  const sorted=scores.slice().sort((a,b)=>b.score-a.score);
  const label=labelAnalysis(best.type); const risk=best.risk||baseRisk(best.score);
  const metrics=best.metrics.map(([k,v])=>`<div class="metric"><span class="muted">${k}</span><strong>${v}</strong></div>`).join('');
  const compCards=sorted.slice(0,4).map(s=>`<div class="strategy-card ${s.type===best.type?'active':''}"><span>${labelAnalysis(s.type)}</span><strong>${s.score}</strong><small>${s.risk||baseRisk(s.score)} risk</small></div>`).join('');
  const bullets=insightBullets(x,best,scores).map(b=>`<li>${escapeHtml(b)}</li>`).join('');
  const steps=nextSteps(x,best).map(s=>`<li>${escapeHtml(s)}</li>`).join('');
  const action=best.score>=80?'Pursue / Underwrite Further':best.score>=65?'Proceed Carefully':best.score>=50?'Renegotiate First':'Pass or Reprice';
  box.innerHTML=`
    <div class="report-header">
      <div><p class="eyebrow">Deal Brief</p><h2>${escapeHtml(x.property||'Uploaded Property')}</h2><p class="muted">Best fit: ${label} · Property: ${labelProperty(x.propertyType)}</p></div>
      <div class="score-badge"><strong>${best.score}</strong><span>/100</span></div>
    </div>
    <div class="verdict ${best.score>=75?'good':best.score>=55?'watch':'bad'}"><strong>${action}</strong><span>${escapeHtml(best.headline)}</span></div>
    <div class="metric-grid">${metrics}</div>
    <h3>Strategy Comparison</h3><div class="strategy-grid">${compCards}</div>
    <h3>What this means</h3><ul class="small-list">${bullets}</ul>
    <h3>Next checks</h3><ol class="small-list">${steps}</ol>
    <p class="muted tiny-note">Educational estimate only. DealCalc does not replace professional appraisal, inspection, legal, tax, financing, or title review.</p>
    <p><button class="btn secondary" onclick="window.print()">Print / Save Report</button></p>`;
  trackEvent('deal_analyzed',{analysis_type:best.type,property_type:x.propertyType,score:best.score,risk:risk,manual:manual});
}

async function handleDealPdfUpload(event){
  const file=event.target.files?.[0]; const status=document.getElementById('pdfStatus'); const notes=document.getElementById('documentNotes'); const result=document.getElementById('analysisResult');
  if(!file)return;
  if(status)status.textContent='Reading PDF and starting analysis...';
  if(result) result.innerHTML='<div class="loading-state"><div class="loader"></div><h3>Analyzing document...</h3><p class="muted">Extracting price, value, rent, equity, property type, and strategy signals.</p></div>';
  try{
    if(!window.pdfjsLib){ if(status)status.textContent='PDF reader did not load. Paste the deal details manually.'; return; }
    pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const buf=await file.arrayBuffer(); const pdf=await pdfjsLib.getDocument({data:buf}).promise; let out='';
    for(let i=1;i<=Math.min(pdf.numPages,14);i++){const page=await pdf.getPage(i); const content=await page.getTextContent(); out+=content.items.map(item=>item.str).join(' ')+'\n\n';}
    if(notes)notes.value=out.slice(0,25000);
    const data=detectFromText(out); applyDetectedData(data);
    if(status)status.textContent=`PDF analyzed: ${file.name}. You can adjust inputs and the report will refresh.`;
    analyzeDealV6(false);
    trackEvent('deal_pdf_uploaded',{pages:pdf.numPages,property_type:data.propertyType,suggested_analysis:data.suggestedAnalysis});
  }catch(err){console.error(err); if(status)status.textContent='Could not read this PDF. It may be scanned/protected. Paste the key numbers manually.'; if(result)result.innerHTML='<h3>Could not analyze this PDF.</h3><p class="muted">Try another PDF or paste the property details into the notes field.</p>'; trackEvent('deal_pdf_upload_failed',{});}
}
function clearAnalyzer(){['propertyLabel','listingPrice','purchasePrice','analyzerArv','analyzerRepairs','assignmentFee','closingCosts','holdingCosts','loanBalance','monthlyRent','monthlyExpenses','salePrepCosts','documentNotes'].forEach(id=>{const el=document.getElementById(id); if(el)el.value=''}); const a=document.getElementById('analysisType'); if(a)a.value='auto'; const p=document.getElementById('propertyType'); if(p)p.value='auto'; const box=document.getElementById('extractionSummary'); if(box){box.innerHTML=''; box.classList.add('hidden-field');} const r=document.getElementById('analysisResult'); if(r)r.innerHTML='<div class="empty-state"><p class="eyebrow">Ready</p><h3>Upload a PDF and DealCalc will start automatically.</h3><p class="muted">The result will be a clean deal brief, not a wall of extracted text.</p></div>'; const s=document.getElementById('pdfStatus'); if(s)s.textContent='No PDF uploaded yet.'; updateAnalyzerMode();}

document.addEventListener('input',e=>{if(e.target.closest('.compact-input-card')){clearTimeout(window.__dcTimer); window.__dcTimer=setTimeout(()=>analyzeDealV6(false),350)}});
document.addEventListener('submit',e=>{if(e.target.matches('[data-track-form]'))trackEvent('contact_submit',{form:e.target.dataset.trackForm})});
document.addEventListener('DOMContentLoaded',updateAnalyzerMode);
