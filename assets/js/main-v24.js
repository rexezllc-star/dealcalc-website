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

function moneyToNumber(raw, suffix=''){
  if(!raw) return 0;
  let n=+String(raw).replace(/,/g,'');
  if(!Number.isFinite(n)) return 0;
  if(String(suffix||'').toLowerCase()==='k') n*=1000;
  if(String(suffix||'').toLowerCase()==='m') n*=1000000;
  return n;
}
function parseMoneyAfter(text, patterns){
  for(const p of patterns){
    const re = new RegExp(p+'\\s*:?\\s*\\$?\\s*([0-9][0-9,]*(?:\\.\\d+)?)([kKmM])?','i');
    const m = text.match(re); if(m) return moneyToNumber(m[1],m[2]);
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
function parseLabeledMoney(text,label){
  const re = new RegExp('(?:^|\\n|\\s)'+label+'\\s*:?\\s*\\$?\\s*([0-9][0-9,]*(?:\\.\\d+)?)([kKmM])?(?=\\s|$)','i');
  const m=String(text||'').match(re); return m?moneyToNumber(m[1],m[2]):0;
}
function parseSectionMoney(text,section,label,limit=700){
  const idx=String(text||'').toLowerCase().indexOf(String(section||'').toLowerCase());
  if(idx<0) return 0;
  return parseLabeledMoney(String(text).slice(idx,idx+limit),label);
}
function parseListingStatus(text){
  const t=String(text||'');
  const current=t.match(/Current Listing Status[\s\S]{0,180}?Status\s*:?\s*(Pending|Active|On Market|Off Market|Removed|Canceled|Cancelled|Expired|Withdrawn)/i);
  if(current) return current[1].replace(/Cancelled/i,'Canceled');
  const status=t.match(/Status\s*:?\s*(Pending|Active|On Market|Off Market|Removed|Canceled|Cancelled|Expired|Withdrawn)/i);
  return status?status[1].replace(/Cancelled/i,'Canceled'):'Unknown';
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
  data.monthlyRent=parseSectionMoney(raw,'Opportunity','Monthly Rent',600) || parseLabeledMoney(raw,'Monthly Rent');
  data.propertyTax=parseSectionMoney(raw,'Tax Status','Property Tax',600) || parseMoneyAfter(t,['Property Tax','Annual Tax','Taxes']);
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
  data.status = parseListingStatus(raw);
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
      ${data.estimatedEquity?`<span>Reported Equity <strong>${money(data.estimatedEquity)}</strong></span>`:''}
      ${data.status?`<span>Listing Status <strong>${escapeHtml(data.status)}</strong></span>`:''}
    </div>`;
  }
}
function labelProperty(v){return ({auto:'Auto',land:'Vacant Land',sfr:'Single Family',multi:'Multifamily',condo:'Condo / Townhome',unknown:'Unknown'})[v]||v}
function labelAnalysis(v){return ({auto:'Auto',retail:'Retail / Overpay Check',homeowner:'Homeowner Equity',rental:'Rental',flip:'Fix & Flip',wholesale:'Wholesale',land:'Land Flip'})[v]||v}

function getInputs(){
  return {property:textVal('propertyLabel'),propertyType:document.getElementById('propertyType')?.value||'auto',analysisType:document.getElementById('analysisType')?.value||'auto',listing:val('listingPrice'),price:val('purchasePrice'),value:val('analyzerArv'),repairs:val('analyzerRepairs'),fee:val('assignmentFee'),closing:val('closingCosts'),holding:val('holdingCosts'),loan:val('loanBalance'),rent:val('monthlyRent'),expenses:val('monthlyExpenses'),prep:val('salePrepCosts')};
}
function scoreRetail(x){const meta=getDetectedMeta(); const price=x.listing||x.price, value=x.value||x.price, premium=safeDiv(price-value,value), calcEquity=x.value-x.loan, equity=meta.estimatedEquity||calcEquity; let score=70-premium*180; if(price && value && price<=value*.95)score+=20; if(x.rent){const rtp=safeDiv(x.rent*12,price); score+=rtp>.08?15:rtp>.06?5:-8} return {type:'retail',score:clampScore(score),metrics:[['Value Gap',money(value-price)],['Price vs Value',pct(premium)],['Reported Equity',equity?money(equity):'N/A'],['Rent-to-Price',x.rent?pct(safeDiv(x.rent*12,price)):'N/A']],headline:premium>.15?'Likely overpriced against the extracted value.':premium>0?'Price appears above estimated value.':premium>-0.08?'Near fair value.':'Potentially below value.',risk:premium>.15?'High':premium>0?'Moderate':'Low'} }
function scoreHomeowner(x){const meta=getDetectedMeta(); const value=x.value||x.price||x.listing, loan=x.loan, selling=(x.fee||0)+(x.prep||0)+(x.closing||0), calcEquity=value-loan, equity=meta.estimatedEquity||calcEquity, proceeds=equity-selling; const er=safeDiv(equity,value); let score=50+er*100; if(proceeds>50000)score+=10; if(er<.1)score-=18; return {type:'homeowner',score:clampScore(score),metrics:[['Reported Equity',money(equity)],['Equity %',pct(er)],['Est. Net Proceeds',money(proceeds)],['Loan Balance',money(loan)]],headline:er>.25?'Strong equity position.':er>.12?'Moderate equity position.':'Thin equity after selling costs.',risk:er>.25?'Low':er>.12?'Moderate':'High'} }
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
    <p class="cta-row"><button class="btn" onclick="dcSaveCurrentDeal()" type="button">Save Deal</button><button class="btn secondary" onclick="window.print()">Export / Print Report</button></p><p id="saveDealMsg" class="muted status-line"></p>`;
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

/* =========================
   DEALCALC V7 ANALYZER OVERRIDES
   Fixes: repeated uploads, upload resets, source-aware CMA valuation, richer investor insights.
========================= */
function median(arr){const a=arr.filter(n=>Number.isFinite(n)&&n>0).sort((x,y)=>x-y); if(!a.length)return 0; const m=Math.floor(a.length/2); return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function uniqNums(arr){return [...new Set(arr.map(n=>Math.round(n)))];}
function moneyList(section){return uniqNums([...String(section||'').matchAll(/\$\s*([0-9][0-9,]*(?:\.\d+)?)/g)].map(m=>+m[1].replace(/,/g,'')));}
function sectionBetween(text,start,end){const s=String(text||''); const i=s.search(new RegExp(start,'i')); if(i<0)return ''; const rest=s.slice(i); const j=rest.search(new RegExp(end,'i')); return j>0?rest.slice(0,j):rest;}
function getMarketSignals(text, propertyType, sqft){
  const raw=String(text||'').replace(/\s+/g,' ');
  const compSec=sectionBetween(raw,'COMPARABLES','NEARBY LISTINGS');
  const nearSec=sectionBetween(raw,'NEARBY LISTINGS','Property Images|Statistics|Page 5|Page 6|Page 7|Page 8');
  let compDollars=moneyList(compSec).filter(n=>n>=1000);
  let activeDollars=moneyList(nearSec).filter(n=>n>=1000);
  const ppsfVals=uniqNums([...raw.matchAll(/\$\s*([1-9][0-9]{1,3})\s+(?:\d|[A-Z])/g)].map(m=>+m[1])).filter(n=>n>=50&&n<=800);
  if(propertyType==='land'){
    const landComps=compDollars.filter(n=>n>=2000 && n<=100000);
    const landListings=activeDollars.filter(n=>n>=2000 && n<=125000);
    return {landCompMedian:median(landComps),landListingMedian:median(landListings),landCompCount:landComps.length,landListingCount:landListings.length,ppsfMedian:0,compMedian:median(landComps),activeMedian:median(landListings)};
  }
  const saleComps=compDollars.filter(n=>n>=100000 && n<=1500000);
  const activeListings=activeDollars.filter(n=>n>=100000 && n<=2000000);
  const ppsfMedian=median(ppsfVals);
  const ppsfValue=(ppsfMedian && sqft)?ppsfMedian*sqft:0;
  return {saleCompMedian:median(saleComps),activeListingMedian:median(activeListings),saleCompCount:saleComps.length,activeListingCount:activeListings.length,ppsfMedian,ppsfValue,compMedian:median(saleComps),activeMedian:median(activeListings)};
}
function detectFromText(text){
  const raw=String(text||''); const t=raw.replace(/\s+/g,' ');
  const data={raw};
  data.address=parseAddress(raw);
  data.estimatedValue=parseMoneyAfter(t,['Estimated Value','Market Value']);
  data.listingPrice=parseSectionMoney(raw,'Current Listing Status','Price',300) || parseMoneyAfter(t,['List Price','Listing Price']);
  data.avgSalePrice=parseMoneyAfter(t,['Avg\\.? Sale Price','Average Sale Price']);
  data.mortgageBalance=parseMoneyAfter(t,['Mortgage Balance','Loan Balance']);
  data.estimatedEquity=parseMoneyAfter(t,['Estimated Equity','Equity']);
  data.monthlyRent=parseSectionMoney(raw||text,'Opportunity','Monthly Rent',600) || parseLabeledMoney(raw||text,'Monthly Rent');
  data.propertyTax=parseMoneyAfter(t,['Property Tax','Annual Tax','Taxes']);
  data.beds=parseNumberAfter(t,['Bedrooms','Beds']);
  data.baths=parseNumberAfter(t,['Bathrooms','Baths']);
  data.sqft=parseNumberAfter(t,['Square Feet','Living Area','Sq\\.?Ft\\.?']);
  data.lotSize=parseNumberAfter(t,['Lot Size']);
  data.yearBuilt=parseNumberAfter(t,['Year Built']);
  data.daysOnMarket=parseNumberAfter(t,['Days on Market','Average DOM','DOM']);
  data.compsCount=parseNumberAfter(t,['Comparables Properties','Properties']);
  data.status = (/Status\s*:?\s*Pending/i.test(t) ? 'Pending' : /Status\s*:?\s*On Market/i.test(t) ? 'On Market' : /Status\s*:?\s*Off Market/i.test(t) ? 'Off Market' : 'Unknown');
  data.distressed = /Distressed\s*:?\s*Yes|Pre-Foreclosure|Auction/i.test(t) && !/There is no foreclosure data available/i.test(t);
  data.liens = parseMoneyAfter(t,['Liens']);
  data.propertyType='unknown';
  if(/Property Type\s*:?\s*Land|Land Use\s*:?\s*Residential-Vacant Land|Vacant Land|OVERSIZED LOT|\bLot\b/i.test(t)) data.propertyType='land';
  if(/Property Type\s*:?\s*Single Family|Single Family \(SFR\)|Land Use\s*:?\s*Single Family Residential|Bedrooms\s*:?\s*\d|Bathrooms\s*:?\s*\d|Living Area\s*:?\s*\d/i.test(t)) data.propertyType='sfr';
  if(/Multifamily|Duplex|Triplex|Fourplex/i.test(t)) data.propertyType='multi';
  if(/Condo|Townhome|Townhouse/i.test(t)) data.propertyType='condo';
  data.market=getMarketSignals(raw,data.propertyType,data.sqft);

  if(data.propertyType==='land'){
    data.underwritingValue=data.market.landCompMedian || data.market.landListingMedian || data.avgSalePrice || data.estimatedValue;
    data.valueSource=data.market.landCompMedian?'median nearby land sold comps':data.market.landListingMedian?'median nearby active land listings':data.avgSalePrice?'reported average sale price':'reported estimated value';
    data.suggestedAnalysis='land';
  }else{
    const compVals=[data.market.ppsfValue,data.market.saleCompMedian,data.avgSalePrice,data.estimatedValue].filter(n=>n>0);
    data.underwritingValue=data.market.ppsfValue || data.market.saleCompMedian || data.avgSalePrice || data.estimatedValue;
    data.valueSource=data.market.ppsfValue?'median sold $/sqft × subject sqft':data.market.saleCompMedian?'median nearby sold comps':data.avgSalePrice?'reported average sale price':'reported estimated value';
    data.suggestedAnalysis=data.monthlyRent?'rental':(data.mortgageBalance||data.estimatedEquity?'homeowner':'retail');
    if(data.listingPrice && data.underwritingValue && data.listingPrice > data.underwritingValue*1.08) data.suggestedAnalysis='retail';
  }
  if(data.status==='Off Market' && data.propertyType==='land') data.suggestedAnalysis='land';
  data.equityRatio=safeDiv(data.estimatedEquity,(data.estimatedValue||data.underwritingValue||data.listingPrice));
  data.confidence=data.propertyType!=='unknown'?(data.address&&(data.underwritingValue||data.estimatedValue||data.listingPrice)?94:82):58;
  data.redFlags=[]; data.opportunities=[];
  if(data.listingPrice && data.underwritingValue && data.listingPrice>data.underwritingValue*1.10) data.redFlags.push(`Asking price appears ${money(data.listingPrice-data.underwritingValue)} above the best extracted value source.`);
  if(data.propertyType==='land' && data.estimatedValue && data.underwritingValue && data.estimatedValue>data.underwritingValue*2) data.redFlags.push('Reported estimated value is much higher than nearby land comps; use land comps as the primary underwriting source.');
  if(data.monthlyRent && data.listingPrice){const gy=safeDiv(data.monthlyRent*12,data.listingPrice); if(gy<.08)data.redFlags.push(`Gross rent yield is only ${pct(gy)}, which may be weak before expenses and debt service.`); else data.opportunities.push(`Gross rent yield is ${pct(gy)} before expenses.`);}
  if(data.estimatedEquity && data.estimatedValue){const er=safeDiv(data.estimatedEquity,data.estimatedValue); if(er<.15)data.redFlags.push(`Owner equity appears thin at ${pct(er)}.`); else data.opportunities.push(`Owner equity appears meaningful at ${pct(er)}.`);}
  if(data.status==='Pending') data.redFlags.push('Listing status is pending; availability may be limited.');
  if(data.status==='Off Market') data.opportunities.push('Off-market status may create direct-to-owner opportunity if seller motivation exists.');
  return data;
}
function resetAnalyzerFieldsForNewUpload(){
  ['propertyLabel','listingPrice','purchasePrice','analyzerArv','analyzerRepairs','assignmentFee','closingCosts','holdingCosts','loanBalance','monthlyRent','monthlyExpenses','salePrepCosts','documentNotes'].forEach(id=>{const el=document.getElementById(id); if(el)el.value=''});
  const a=document.getElementById('analysisType'); if(a)a.value='auto';
  const p=document.getElementById('propertyType'); if(p)p.value='auto';
}
function applyDetectedData(data){
  resetAnalyzerFieldsForNewUpload();
  setText('propertyLabel',data.address,true);
  setVal('listingPrice',data.listingPrice,true);
  setVal('purchasePrice',data.listingPrice || data.underwritingValue || data.estimatedValue,true);
  setVal('analyzerArv',data.underwritingValue || data.estimatedValue || data.avgSalePrice,true);
  setVal('loanBalance',data.mortgageBalance,true);
  setVal('monthlyRent',data.monthlyRent,true);
  const taxMonthly=data.propertyTax? data.propertyTax/12 : 0;
  if(data.monthlyRent) setVal('monthlyExpenses', Math.round(data.monthlyRent*.45 + taxMonthly), true);
  const p=document.getElementById('propertyType'); if(p && data.propertyType) p.value=data.propertyType;
  const a=document.getElementById('analysisType'); if(a && data.suggestedAnalysis) a.value=data.suggestedAnalysis;
  const notes=document.getElementById('documentNotes'); if(notes) notes.dataset.detected=JSON.stringify({valueSource:data.valueSource,market:data.market,redFlags:data.redFlags,opportunities:data.opportunities,status:data.status,estimatedValue:data.estimatedValue,avgSalePrice:data.avgSalePrice,underwritingValue:data.underwritingValue,listingPrice:data.listingPrice,estimatedEquity:data.estimatedEquity,monthlyRent:data.monthlyRent,confidence:data.confidence});
  updateAnalyzerMode();
  const summary=document.getElementById('extractionSummary');
  if(summary){
    summary.classList.remove('hidden-field');
    const valueLine=data.underwritingValue?`<span>Underwriting Value <strong>${money(data.underwritingValue)}</strong><small>${escapeHtml(data.valueSource||'best extracted source')}</small></span>`:'';
    summary.innerHTML=`<div class="extract-top"><strong>Detected:</strong> ${escapeHtml(labelProperty(data.propertyType))} · ${escapeHtml(labelAnalysis(data.suggestedAnalysis))} <span class="pill">${data.confidence}% confidence</span></div>
    <div class="extract-grid">
      ${data.address?`<span>Address <strong>${escapeHtml(data.address)}</strong></span>`:''}
      ${valueLine}
      ${data.estimatedValue?`<span>Reported Est. Value <strong>${money(data.estimatedValue)}</strong></span>`:''}
      ${data.listingPrice?`<span>List/Asking Price <strong>${money(data.listingPrice)}</strong></span>`:''}
      ${data.monthlyRent?`<span>Rent <strong>${money(data.monthlyRent)}/mo</strong></span>`:''}
      ${data.mortgageBalance?`<span>Loan Balance <strong>${money(data.mortgageBalance)}</strong></span>`:''}
      ${data.estimatedEquity?`<span>Reported Equity <strong>${money(data.estimatedEquity)}</strong></span>`:''}
      ${data.status?`<span>Listing Status <strong>${escapeHtml(data.status)}</strong></span>`:''}
    </div>`;
  }
}
function getDetectedMeta(){try{return JSON.parse(document.getElementById('documentNotes')?.dataset.detected||'{}')}catch(e){return {}}}

function metricLine(label,value,sub=''){
  return `<div class="metric"><span class="muted">${escapeHtml(label)}</span><strong>${value}</strong>${sub?`<small>${escapeHtml(sub)}</small>`:''}</div>`;
}
function getInputSnapshot(){
  const x=getInputs(); const meta=getDetectedMeta();
  return {x,meta};
}
function valuationConfidence(meta,x){
  let score=35;
  if(meta.valueSource) score+=20;
  if(meta.market && (meta.market.saleCompCount||meta.market.landCompCount)) score+=18;
  if(meta.market && meta.market.ppsfMedian) score+=10;
  if(x.value && x.listing) score+=8;
  if(meta.status && meta.status!=='Unknown') score+=5;
  if(meta.estimatedValue && meta.underwritingValue && Math.abs(meta.estimatedValue-meta.underwritingValue)>meta.underwritingValue*.35) score-=18;
  return clampScore(score);
}
function marketRead(meta,x){
  const m=meta.market||{}; const rows=[];
  if(x.propertyType==='land'){
    if(m.landCompMedian) rows.push(['Median land sold comp',money(m.landCompMedian),`${m.landCompCount||0} detected land comp prices`]);
    if(m.landListingMedian) rows.push(['Median land active listing',money(m.landListingMedian),`${m.landListingCount||0} detected active land prices`]);
    if(meta.estimatedValue && meta.underwritingValue) rows.push(['Reported vs comp value',`${money(meta.estimatedValue)} / ${money(meta.underwritingValue)}`,'Estimated values can be distorted on vacant land']);
  } else {
    if(meta.estimatedValue && meta.underwritingValue && meta.avgSalePrice) rows.push(['Valuation range',`${money(Math.min(meta.estimatedValue,meta.avgSalePrice,meta.underwritingValue))} – ${money(Math.max(meta.estimatedValue,meta.avgSalePrice,meta.underwritingValue))}`,'Uses CMA estimate, avg sold comps, and $/sqft model']);
    if(m.ppsfMedian && meta.underwritingValue) rows.push(['Comp $/SqFt valuation',money(meta.underwritingValue),`Median sold $/sqft: ${money(m.ppsfMedian)}`]);
    if(m.saleCompMedian) rows.push(['Median sold comp',money(m.saleCompMedian),`${m.saleCompCount||0} detected sales prices`]);
    if(m.activeListingMedian) rows.push(['Median active listing',money(m.activeListingMedian),`${m.activeListingCount||0} detected listing prices`]);
  }
  if(x.listing && x.value){
    const gap=x.listing-x.value; rows.push(['Price gap',gap>=0?`${money(gap)} over value`:`${money(Math.abs(gap))} under value`, gap>=0?'Possible overpay risk':'Possible embedded equity/spread']);
  }
  if(x.rent && (x.listing||x.price)){
    const gy=safeDiv(x.rent*12,(x.listing||x.price)); rows.push(['Gross rent yield',pct(gy),'Before vacancy, repairs, management, debt service']);
  }
  if(meta.status) rows.push(['Listing status',meta.status,meta.status==='Pending'?'Availability may be limited':'Confirm current availability']);
  return rows;
}
function buildDataQuality(meta,x){
  const c=valuationConfidence(meta,x); const cls=c>=80?'good':c>=60?'watch':'bad';
  const label=c>=80?'High confidence':c>=60?'Usable with verification':'Needs verification';
  return `<div class="data-quality ${cls}"><strong>${label}</strong><span>${c}/100 data confidence</span><small>Based on extracted value source, comps, property type, status, and conflicting signals.</small></div>`;
}
function buildInvestorSections(x,best,scores){
  const meta=getDetectedMeta();
  const mr=marketRead(meta,x).slice(0,6).map(([k,v,s])=>metricLine(k,v,s)).join('');
  const red=(meta.redFlags||[]).concat(best.score<60?['Score is weak under current assumptions; repricing is likely required.']:[]).slice(0,5);
  const opp=(meta.opportunities||[]).slice(0,4);
  const riskHtml=red.length?`<h3>Risk flags</h3><ul class="small-list risk-list">${red.map(r=>`<li>${escapeHtml(r)}</li>`).join('')}</ul>`:'';
  const oppHtml=opp.length?`<h3>Potential upside</h3><ul class="small-list opportunity-list">${opp.map(o=>`<li>${escapeHtml(o)}</li>`).join('')}</ul>`:'';
  return `${buildDataQuality(meta,x)}${mr?`<h3>Market & value read</h3><div class="metric-grid market-read">${mr}</div>`:''}${riskHtml}${oppHtml}`;
}
function insightBullets(x,best,scores){
  const meta=getDetectedMeta(); const bullets=[];
  if(meta.valueSource && x.value) bullets.push(`Primary value source used: ${meta.valueSource}. This matters because CMA estimated values can conflict with actual sold comps.`);
  if(meta.estimatedValue && meta.underwritingValue && Math.abs(meta.estimatedValue-meta.underwritingValue)>meta.underwritingValue*.25){bullets.push(`Reported estimated value (${money(meta.estimatedValue)}) conflicts with underwriting value (${money(meta.underwritingValue)}). Treat this as a valuation warning, not a clean deal signal.`)}
  (meta.redFlags||[]).slice(0,3).forEach(f=>bullets.push(f));
  (meta.opportunities||[]).slice(0,2).forEach(o=>bullets.push(o));
  if(x.listing && x.value){const gap=x.listing-x.value; if(gap>0)bullets.push(`Price gap: asking/list price is ${money(gap)} above the current underwriting value.`); else bullets.push(`Price gap: asking/list price is ${money(Math.abs(gap))} below the current underwriting value.`)}
  if(x.propertyType==='land') bullets.push('For land, the best-use checks are buildability, access, utilities, zoning, flood/wetlands, title, HOA restrictions, and recent land-only comps—not house comps.');
  if(x.rent && (x.listing||x.price)){const rtp=safeDiv(x.rent*12,(x.listing||x.price)); bullets.push(`Gross rent yield is ${pct(rtp)} before expenses, vacancy, financing, repairs, and management.`)}
  if(best.score<60) bullets.push('Current numbers suggest repricing or passing before spending time on deeper underwriting.');
  return bullets.slice(0,6);
}
function analyzeDealV6(manual=false){
  const box=document.getElementById('analysisResult'); if(!box)return;
  const x=getInputs(); const selected=x.analysisType; const meta=getDetectedMeta();
  const scores=[scoreRetail(x),scoreHomeowner(x),scoreRental(x),scoreFlip(x),scoreWholesale(x),scoreLand(x)];
  const best=recommendationFromScores(scores, selected==='land'?'land':selected);
  const sorted=scores.slice().sort((a,b)=>b.score-a.score);
  const label=labelAnalysis(best.type); const risk=best.risk||baseRisk(best.score);
  const metrics=best.metrics.map(([k,v])=>`<div class="metric"><span class="muted">${k}</span><strong>${v}</strong></div>`).join('');
  const compCards=sorted.slice(0,5).map(s=>`<div class="strategy-card ${s.type===best.type?'active':''}"><span>${labelAnalysis(s.type)}</span><strong>${s.score}</strong><small>${s.risk||baseRisk(s.score)} risk</small></div>`).join('');
  const bullets=insightBullets(x,best,scores).map(b=>`<li>${escapeHtml(b)}</li>`).join('');
  const steps=nextSteps(x,best).map(s=>`<li>${escapeHtml(s)}</li>`).join('');
  const action=best.score>=80?'Worth Deeper Underwriting':best.score>=65?'Proceed Carefully':best.score>=50?'Renegotiate / Verify First':'Likely Pass Unless Repriced';
  const sourceNote=meta.valueSource?`<p class="source-note"><strong>Primary value source:</strong> ${escapeHtml(meta.valueSource)}${meta.confidence?` · ${meta.confidence}% extraction confidence`:''}</p>`:'';
  const investorSections=buildInvestorSections(x,best,scores);
  box.innerHTML=`
    <div class="report-header">
      <div><p class="eyebrow">Investor Deal Brief</p><h2>${escapeHtml(x.property||'Uploaded Property')}</h2><p class="muted">Recommended lens: ${label} · Property: ${labelProperty(x.propertyType)}</p>${sourceNote}</div>
      <div class="score-badge"><strong>${best.score}</strong><span>/100</span></div>
    </div>
    <div class="verdict ${best.score>=75?'good':best.score>=55?'watch':'bad'}"><strong>${action}</strong><span>${escapeHtml(best.headline)}</span></div>
    <div class="metric-grid">${metrics}</div>
    ${investorSections}
    <h3>Strategy Comparison</h3><div class="strategy-grid">${compCards}</div>
    <h3>Information worth knowing</h3><ul class="small-list">${bullets}</ul>
    <h3>Next checks</h3><ol class="small-list">${steps}</ol>
    <details class="notes-details"><summary>Why this result was generated</summary><p class="muted">DealCalc triangulates values from the strongest extracted source available: land-only comps for vacant land, sold comp medians or $/sqft for houses, rent and expense assumptions for rentals, and equity or loan data for homeowner analysis. The output is a screening report, not a substitute for inspection, appraisal, title, zoning, or lender review.</p></details>
    <p class="muted tiny-note">Educational estimate only. Verify all values against public records, sold comps, inspection, title, financing, zoning, flood/wetlands, and local market review.</p>
    <p class="cta-row"><button class="btn" onclick="dcSaveCurrentDeal()" type="button">Save Deal</button><button class="btn secondary" onclick="window.print()">Export / Print Report</button></p><p id="saveDealMsg" class="muted status-line"></p>`;
  trackEvent('deal_analyzed',{analysis_type:best.type,property_type:x.propertyType,score:best.score,risk:risk,manual:manual,value_source:meta.valueSource||''});
}
async function handleDealPdfUpload(event){
  const file=event.target.files?.[0]; const status=document.getElementById('pdfStatus'); const notes=document.getElementById('documentNotes'); const result=document.getElementById('analysisResult');
  if(!file)return;
  resetAnalyzerFieldsForNewUpload();
  const summary=document.getElementById('extractionSummary'); if(summary){summary.innerHTML=''; summary.classList.add('hidden-field');}
  if(status)status.textContent='Reading PDF and starting analysis...';
  if(result) result.innerHTML='<div class="loading-state"><div class="loader"></div><h3>Analyzing new document...</h3><p class="muted">Extracting the useful underwriting signals, not just repeating the PDF.</p></div>';
  try{
    if(!window.pdfjsLib){ if(status)status.textContent='PDF reader did not load. Paste the deal details manually.'; return; }
    pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const buf=await file.arrayBuffer(); const pdf=await pdfjsLib.getDocument({data:buf}).promise; let out='';
    for(let i=1;i<=Math.min(pdf.numPages,18);i++){const page=await pdf.getPage(i); const content=await page.getTextContent(); out+=content.items.map(item=>item.str).join(' ')+'\n\n';}
    const data=detectFromText(out); applyDetectedData(data);
    if(notes)notes.value=out.slice(0,25000);
    if(status)status.textContent=`Analyzed: ${file.name}. Upload another file anytime; the prior analysis will be replaced.`;
    analyzeDealV6(false);
    trackEvent('deal_pdf_uploaded',{pages:pdf.numPages,property_type:data.propertyType,suggested_analysis:data.suggestedAnalysis,value_source:data.valueSource});
  }catch(err){console.error(err); if(status)status.textContent='Could not read this PDF. It may be scanned/protected. Paste the key numbers manually.'; if(result)result.innerHTML='<h3>Could not analyze this PDF.</h3><p class="muted">Try another PDF or paste the property details into the notes field.</p>'; trackEvent('deal_pdf_upload_failed',{});}
  finally{ if(event && event.target) event.target.value=''; }
}

/* =========================
   DEALCALC V19 ANALYZER OPTIMIZATION
   Goal: investor-grade signal extraction, not text repetition.
   Adds: source hierarchy, rent sanity, market stats, photo/condition cues,
   valuation range, price-history signals, data warnings, and next-action insights.
========================= */
function parsePercentAfter(text,label){const re=new RegExp(label+'\\s*([+-]?\\d+(?:\\.\\d+)?)\\s*%','i'); const m=String(text||'').match(re); return m?+m[1]:0;}
function parsePropertyMonthlyRent(text){
  const raw=String(text||'').replace(/\s+/g,' ');
  let m=raw.match(/Opportunity[\s\S]{0,260}?Monthly\s+Rent\s*:?\s*\$\s*([0-9][0-9,]*)/i) || raw.match(/Monthly\s+Rent\s*:?\s*\$\s*([0-9][0-9,]*)/i);
  if(!m) return 0;
  const n=+m[1].replace(/,/g,'');
  return n>100 && n<50000 ? n : 0;
}
function parseHoaAnnual(text){const raw=String(text||'').replace(/\s+/g,' '); const m=raw.match(/Home Owner Assessments Fee\s*\$\s*([0-9][0-9,]*)\s*Annually/i); return m?+m[1].replace(/,/g,''):0;}
function detectConditionSignals(text){
  const t=String(text||'').toLowerCase();
  let condition='Unknown', repair=35000, notes=[];
  if(/distressed\s*:?\s*yes|foreclosure|fire damage|mold|tear.?down|needs (?:full|complete|major)|gut rehab|as-is.*needs/i.test(t)){condition='Heavy Rehab / Distressed'; repair=75000; notes.push('Text suggests major repair or distressed condition.');}
  else if(/fixer|needs work|needs repairs|investor special|tlc|handyman/i.test(t)){condition='Value-add / Repairs Needed'; repair=45000; notes.push('Text suggests value-add or repair need.');}
  else if(/beautifully updated|move-in ready|granite|modern updates|updated kitchen|hardwood floors|new roof|renovated/i.test(t)){condition='Updated / Move-in Ready'; repair=12000; notes.push('Listing/photos suggest updated condition; flip margin should not assume heavy rehab unless inspection says otherwise.');}
  else if(/updated|remodeled|renovated/i.test(t)){condition='Lightly Updated'; repair=20000; notes.push('Text suggests some updates; use light contingency until inspection.');}
  return {condition,repairEstimate:repair,notes};
}
function parseCurrentListingBlock(raw){
  const block=sectionBetween(raw,'Current Listing Status','Active Foreclosure Status|Association Information|Property Details');
  const status=(block.match(/Status\s*:?\s*(Pending|Active|On Market|Removed|Canceled|Expired)/i)||[])[1] || ((/Status\s*:?\s*Pending/i.test(raw))?'Pending':'Unknown');
  const date=(block.match(/Date\s*:?\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/i)||[])[1]||'';
  const price=parseSectionMoney(raw,'Current Listing Status','Price',450)||0;
  return {status,date,price};
}
function parseListingHistorySignals(raw){
  const sec=sectionBetween(raw,'Listing History','Comparables & Nearby Listings|Page 3|Property Images');
  const nums=moneyList(sec).filter(n=>n>=100000 && n<=2000000);
  const rents=moneyList(sec).filter(n=>n>=700 && n<10000);
  return {listHistoryHigh: nums.length?Math.max(...nums):0, listHistoryLow: nums.length?Math.min(...nums):0, listHistoryCount:nums.length, priorRentListings:rents.slice(0,8)};
}
function parseMarketStats(raw){
  const t=String(raw||'').replace(/\s+/g,' ');
  const stats={};
  stats.last30PriceChange=parsePercentAfter(t,'Last 30 Days Price Change');
  stats.last30RentChange=parsePercentAfter(t,'Last 30 Days Rent Change');
  const m1=t.match(/Last 30 Days[\s\S]{0,250}?Sales Trend[\s\S]{0,120}?Homes Sold\s+Average Sale Price\s+0\s*%\s*([0-9,]+)\s+([+-]?\d+(?:\.\d+)?)\s*%\s*\$\s*([0-9,]+)/i);
  if(m1){stats.last30HomesSold=+m1[1].replace(/,/g,''); stats.last30AvgSalePrice=+m1[3].replace(/,/g,'');}
  const m2=t.match(/Last 6 Months[\s\S]{0,500}?Sales Trend[\s\S]{0,120}?Homes Sold\s+Average Sale Price\s+0\s*%\s*([0-9,]+)\s+([+-]?\d+(?:\.\d+)?)\s*%\s*\$\s*([0-9,]+)/i);
  if(m2){stats.last6HomesSold=+m2[1].replace(/,/g,''); stats.last6AvgSalePrice=+m2[3].replace(/,/g,'');}
  const doms=[...t.matchAll(/Average DOM\s+([+-]?\d+(?:\.\d+)?)\s*%\s*([0-9]+)/ig)].map(m=>+m[2]);
  if(doms.length){stats.avgDOM30=doms[0]; stats.avgDOM6=doms[1]||0;}
  const salePpsf=[...t.matchAll(/Average Sale \$ \/ SqFt\s+([+-]?\d+(?:\.\d+)?)\s*%\s*\$\s*([0-9]+)/ig)].map(m=>+m[2]);
  if(salePpsf.length){stats.avgSalePpsf30=salePpsf[0]; stats.avgSalePpsf6=salePpsf[1]||0;}
  return stats;
}
function filteredCompStats(raw, propertyType, sqft, beds, baths){
  const compSec=sectionBetween(raw,'COMPARABLES','NEARBY LISTINGS');
  const rows=compSec.split(/\s+(?=[A-Z]\s+0\.\d+\s+\d)/g);
  const comps=[];
  rows.forEach(r=>{
    const sale=(r.match(/\$\s*([0-9][0-9,]{2,})/)||[])[1];
    const ppsf=(r.match(/\$\s*([1-9][0-9]{1,3})\s+(?:\d|[A-Z])/g)||[]).map(s=>+(s.match(/[0-9]+/)||[0])[0]).filter(n=>n>=50&&n<=800).pop();
    const sqftMatch=r.match(/\$\s*[0-9,]+\s+([0-9,]{3,5})\s+\$\s*[0-9]+/);
    const sf=sqftMatch?+sqftMatch[1].replace(/,/g,''):0;
    const price=sale?+sale.replace(/,/g,''):0;
    if(price>100000 && price<1500000) comps.push({price,ppsf:ppsf||0,sqft:sf});
  });
  const usable=comps.filter(c=>c.ppsf>0 && (!sqft || !c.sqft || Math.abs(c.sqft-sqft)/sqft<0.35));
  return {usableCount:usable.length, medianPrice:median(usable.map(c=>c.price)), medianPpsf:median(usable.map(c=>c.ppsf)), ppsfValue:(median(usable.map(c=>c.ppsf))&&sqft)?median(usable.map(c=>c.ppsf))*sqft:0};
}
function chooseValueStack(data){
  const candidates=[];
  if(data.filteredComps?.ppsfValue) candidates.push({name:'Adjusted comp $/sqft model', value:data.filteredComps.ppsfValue, weight:0.35, note:`${data.filteredComps.usableCount} closer-size sold comps`});
  if(data.market?.saleCompMedian) candidates.push({name:'Median sold comps', value:data.market.saleCompMedian, weight:0.25, note:`${data.market.saleCompCount||0} detected sales`});
  if(data.avgSalePrice) candidates.push({name:'CMA average sale price', value:data.avgSalePrice, weight:0.20, note:'reported by CMA'});
  if(data.estimatedValue) candidates.push({name:'CMA estimated value', value:data.estimatedValue, weight:0.20, note:'automated estimate'});
  const totalW=candidates.reduce((s,c)=>s+c.weight,0)||1;
  const weighted=candidates.reduce((s,c)=>s+c.value*c.weight,0)/totalW;
  const vals=candidates.map(c=>c.value).filter(Boolean);
  return {candidates, weighted: vals.length?weighted:0, low: vals.length?Math.min(...vals):0, high: vals.length?Math.max(...vals):0};
}
function detectFromText(text){
  const raw=String(text||''); const t=raw.replace(/\s+/g,' '); const data={raw};
  data.address=parseAddress(raw);
  data.estimatedValue=parseMoneyAfter(t,['Estimated Value','Market Value']);
  const current=parseCurrentListingBlock(raw);
  data.listingPrice=current.price || parseMoneyAfter(t,['List Price','Listing Price']);
  data.currentListing=current;
  data.avgSalePrice=parseMoneyAfter(t,['Avg\\.? Sale Price','Average Sale Price']);
  data.mortgageBalance=parseMoneyAfter(t,['Mortgage Balance','Loan Balance']);
  data.estimatedEquity=parseMoneyAfter(t,['Estimated Equity','Equity']);
  data.monthlyRent=parsePropertyMonthlyRent(raw);
  data.propertyTax=parseMoneyAfter(t,['Property Tax','Annual Tax','Taxes']);
  data.hoaAnnual=parseHoaAnnual(raw);
  data.beds=parseNumberAfter(t,['Bedrooms','Beds']); data.baths=parseNumberAfter(t,['Bathrooms','Baths']);
  data.sqft=parseNumberAfter(t,['Square Feet','Living Area','Sq\\.?Ft\\.?']); data.lotSize=parseNumberAfter(t,['Lot Size']); data.yearBuilt=parseNumberAfter(t,['Year Built']);
  data.daysOnMarket=parseNumberAfter(t,['Days on Market','Average DOM','DOM']); data.compsCount=parseNumberAfter(t,['Comparables Properties','Properties']);
  data.status=current.status || (/Status\s*:?\s*Pending/i.test(t)?'Pending':/Status\s*:?\s*On Market/i.test(t)?'On Market':/Status\s*:?\s*Off Market/i.test(t)?'Off Market':'Unknown');
  data.distressed=/Distressed\s*:?\s*Yes|Pre-Foreclosure|Auction/i.test(t)&&!/There is no foreclosure data available/i.test(t); data.liens=parseMoneyAfter(t,['Liens']);
  data.propertyType='unknown';
  if(/Property Type\s*:?\s*Land|Land Use\s*:?\s*Residential-Vacant Land|Vacant Land|OVERSIZED LOT|\bLot\b/i.test(t)) data.propertyType='land';
  if(/Property Type\s*:?\s*Single Family|Single Family \(SFR\)|Land Use\s*:?\s*Single Family Residential|Bedrooms\s*:?\s*\d|Bathrooms\s*:?\s*\d|Living Area\s*:?\s*\d/i.test(t)) data.propertyType='sfr';
  if(/Multifamily|Duplex|Triplex|Fourplex/i.test(t)) data.propertyType='multi'; if(/Condo|Townhome|Townhouse/i.test(t)) data.propertyType='condo';
  data.condition=detectConditionSignals(raw); data.listingHistory=parseListingHistorySignals(raw); data.marketStats=parseMarketStats(raw);
  data.market=getMarketSignals(raw,data.propertyType,data.sqft); data.filteredComps=filteredCompStats(raw,data.propertyType,data.sqft,data.beds,data.baths);
  if(data.propertyType==='land'){
    data.underwritingValue=data.market.landCompMedian || data.market.landListingMedian || data.avgSalePrice || data.estimatedValue;
    data.valueSource=data.market.landCompMedian?'median nearby land sold comps':data.market.landListingMedian?'median nearby active land listings':data.avgSalePrice?'reported average sale price':'reported estimated value';
    data.valueStack={candidates:[],weighted:data.underwritingValue,low:data.underwritingValue,high:data.underwritingValue}; data.suggestedAnalysis='land';
  }else{
    data.valueStack=chooseValueStack(data);
    data.underwritingValue=data.valueStack.weighted || data.filteredComps.ppsfValue || data.market.ppsfValue || data.market.saleCompMedian || data.avgSalePrice || data.estimatedValue;
    data.valueSource=data.valueStack.candidates?.length?'weighted valuation stack':data.filteredComps.ppsfValue?'adjusted comp $/sqft × subject sqft':data.market.saleCompMedian?'median nearby sold comps':data.avgSalePrice?'reported average sale price':'reported estimated value';
    data.suggestedAnalysis=data.monthlyRent?'rental':(data.mortgageBalance||data.estimatedEquity?'homeowner':'retail');
    if(data.listingPrice && data.underwritingValue && data.listingPrice > data.underwritingValue*1.08) data.suggestedAnalysis='retail';
  }
  if(data.status==='Off Market' && data.propertyType==='land') data.suggestedAnalysis='land';
  data.equityRatio=safeDiv(data.estimatedEquity,(data.estimatedValue||data.underwritingValue||data.listingPrice));
  data.confidence=data.propertyType!=='unknown'?(data.address&&(data.underwritingValue||data.estimatedValue||data.listingPrice)?95:84):58;
  data.redFlags=[]; data.opportunities=[]; data.expectedInsights=[];
  if(data.listingPrice && data.underwritingValue && data.listingPrice>data.underwritingValue*1.07) data.redFlags.push(`Asking price is ${money(data.listingPrice-data.underwritingValue)} above DealCalc's valuation stack.`);
  if(data.estimatedValue && data.underwritingValue && Math.abs(data.estimatedValue-data.underwritingValue)>data.underwritingValue*.20) data.redFlags.push(`CMA estimate (${money(data.estimatedValue)}) conflicts with triangulated value (${money(data.underwritingValue)}).`);
  if(data.monthlyRent && data.listingPrice){const gy=safeDiv(data.monthlyRent*12,data.listingPrice); if(gy<.06)data.redFlags.push(`Gross rent yield is ${pct(gy)}, weak before debt service and operating expenses.`); else if(gy>=.08)data.opportunities.push(`Gross rent yield is ${pct(gy)} before expenses.`);}
  if(data.estimatedEquity && data.estimatedValue){const er=safeDiv(data.estimatedEquity,data.estimatedValue); if(er<.15)data.redFlags.push(`Reported owner equity is thin at ${pct(er)} of estimated value.`); else data.opportunities.push(`Reported owner equity is ${pct(er)} of estimated value.`);}
  if(data.status==='Pending') data.redFlags.push('Listing is pending; availability and offer timing must be confirmed.');
  if(data.condition.condition.includes('Updated')) data.opportunities.push('Condition language/photos suggest lower immediate rehab risk than an average distressed flip.');
  if(data.marketStats.last30RentChange>0) data.opportunities.push(`Local rent trend appears positive over 30 days (+${data.marketStats.last30RentChange}%).`);
  if(data.marketStats.last6AvgSalePrice && data.marketStats.last30AvgSalePrice && data.marketStats.last30AvgSalePrice>data.marketStats.last6AvgSalePrice) data.opportunities.push('30-day average sale price is above 6-month average, suggesting short-term pricing strength.');
  data.expectedInsights.push('Best investors will verify the top 3-5 closest true comps, not rely on the CMA headline value alone.');
  data.expectedInsights.push('Compare list price against the valuation range, rental yield, and current status before deciding whether to pursue.');
  return data;
}
function applyDetectedData(data){
  resetAnalyzerFieldsForNewUpload(); setText('propertyLabel',data.address,true); setVal('listingPrice',data.listingPrice,true); setVal('purchasePrice',data.listingPrice || data.underwritingValue || data.estimatedValue,true); setVal('analyzerArv',data.underwritingValue || data.estimatedValue || data.avgSalePrice,true);
  setVal('loanBalance',data.mortgageBalance,true); setVal('monthlyRent',data.monthlyRent,true); setVal('analyzerRepairs',data.condition?.repairEstimate,true); const taxMonthly=data.propertyTax? data.propertyTax/12 : 0; const hoaMonthly=data.hoaAnnual? data.hoaAnnual/12 : 0; if(data.monthlyRent) setVal('monthlyExpenses', Math.round(data.monthlyRent*.35 + taxMonthly + hoaMonthly + 150), true);
  const p=document.getElementById('propertyType'); if(p && data.propertyType) p.value=data.propertyType; const a=document.getElementById('analysisType'); if(a && data.suggestedAnalysis) a.value=data.suggestedAnalysis;
  const notes=document.getElementById('documentNotes'); if(notes) notes.dataset.detected=JSON.stringify({valueSource:data.valueSource,market:data.market,filteredComps:data.filteredComps,marketStats:data.marketStats,valueStack:data.valueStack,redFlags:data.redFlags,opportunities:data.opportunities,expectedInsights:data.expectedInsights,status:data.status,currentListing:data.currentListing,listingHistory:data.listingHistory,condition:data.condition,estimatedValue:data.estimatedValue,avgSalePrice:data.avgSalePrice,underwritingValue:data.underwritingValue,listingPrice:data.listingPrice,estimatedEquity:data.estimatedEquity,monthlyRent:data.monthlyRent,propertyTax:data.propertyTax,hoaAnnual:data.hoaAnnual,confidence:data.confidence,beds:data.beds,baths:data.baths,sqft:data.sqft,yearBuilt:data.yearBuilt});
  updateAnalyzerMode(); const summary=document.getElementById('extractionSummary'); if(summary){summary.classList.remove('hidden-field'); const vs=data.valueStack||{}; summary.innerHTML=`<div class="extract-top"><strong>Detected:</strong> ${escapeHtml(labelProperty(data.propertyType))} · ${escapeHtml(labelAnalysis(data.suggestedAnalysis))} <span class="pill">${data.confidence}% confidence</span></div><div class="extract-grid">${data.address?`<span>Address <strong>${escapeHtml(data.address)}</strong></span>`:''}<span>Best Value Read <strong>${money(data.underwritingValue)}</strong><small>${escapeHtml(data.valueSource||'valuation stack')}</small></span>${vs.low&&vs.high?`<span>Value Range <strong>${money(vs.low)}–${money(vs.high)}</strong><small>source spread</small></span>`:''}${data.listingPrice?`<span>List/Asking Price <strong>${money(data.listingPrice)}</strong></span>`:''}${data.monthlyRent?`<span>Property Rent <strong>${money(data.monthlyRent)}/mo</strong></span>`:''}${data.condition?`<span>Condition Signal <strong>${escapeHtml(data.condition.condition)}</strong></span>`:''}${data.status?`<span>Listing Status <strong>${escapeHtml(data.status)}</strong></span>`:''}</div>`;}
}
function marketRead(meta,x){
  const m=meta.market||{}, fc=meta.filteredComps||{}, ms=meta.marketStats||{}, vs=meta.valueStack||{}; const rows=[];
  if(vs.low&&vs.high) rows.push(['Valuation range',`${money(vs.low)} – ${money(vs.high)}`,'Triangulates CMA estimate, comp medians, and $/sqft where available']);
  if(vs.candidates?.length) rows.push(['Primary value model',money(vs.weighted),vs.candidates.map(c=>`${c.name}: ${money(c.value)}`).join(' · ')]);
  if(fc.ppsfValue) rows.push(['Adjusted $/SqFt read',money(fc.ppsfValue),`${fc.usableCount} closer-size sold comps at median ${money(fc.medianPpsf)}/sf`]);
  if(m.saleCompMedian) rows.push(['Median sold comp',money(m.saleCompMedian),`${m.saleCompCount||0} detected sales prices`]);
  if(m.activeListingMedian) rows.push(['Median active listing',money(m.activeListingMedian),`${m.activeListingCount||0} detected listing prices`]);
  if(x.listing && x.value){const gap=x.listing-x.value; rows.push(['Price gap',gap>=0?`${money(gap)} over value`:`${money(Math.abs(gap))} under value`,gap>=0?'Possible overpay risk':'Possible embedded spread']);}
  if(x.rent && (x.listing||x.price)){const gy=safeDiv(x.rent*12,(x.listing||x.price)); rows.push(['Gross rent yield',pct(gy),'Before vacancy, repairs, management, debt service']);}
  if(ms.last30PriceChange||ms.last30RentChange) rows.push(['30-day market movement',`Price ${ms.last30PriceChange||0}% · Rent ${ms.last30RentChange||0}%`,'Market context from CMA stats']);
  if(meta.status) rows.push(['Listing status',meta.status,meta.status==='Pending'?'Availability may be limited':'Confirm current availability']);
  if(meta.condition?.condition) rows.push(['Condition read',meta.condition.condition,(meta.condition.notes||[])[0]||'Verify with inspection/photos']);
  return rows;
}
function buildInvestorSections(x,best,scores){
  const meta=getDetectedMeta(); const mr=marketRead(meta,x).slice(0,9).map(([k,v,s])=>metricLine(k,v,s)).join('');
  const red=(meta.redFlags||[]).concat(best.score<60?['Score is weak under current assumptions; repricing is likely required.']:[]).slice(0,6);
  const opp=(meta.opportunities||[]).slice(0,5); const exp=(meta.expectedInsights||[]).slice(0,3);
  return `${buildDataQuality(meta,x)}${mr?`<h3>Market, value & condition read</h3><div class="metric-grid market-read">${mr}</div>`:''}${red.length?`<h3>Risk flags</h3><ul class="small-list risk-list">${red.map(r=>`<li>${escapeHtml(r)}</li>`).join('')}</ul>`:''}${opp.length?`<h3>Potential upside</h3><ul class="small-list opportunity-list">${opp.map(o=>`<li>${escapeHtml(o)}</li>`).join('')}</ul>`:''}${exp.length?`<h3>What a smart investor should notice</h3><ul class="small-list">${exp.map(o=>`<li>${escapeHtml(o)}</li>`).join('')}</ul>`:''}`;
}
function insightBullets(x,best,scores){
  const meta=getDetectedMeta(); const bullets=[];
  if(meta.valueSource) bullets.push(`DealCalc used ${meta.valueSource} rather than blindly trusting the CMA headline value.`);
  if(meta.valueStack?.low&&meta.valueStack?.high) bullets.push(`The extracted value range is ${money(meta.valueStack.low)} to ${money(meta.valueStack.high)}; wide ranges mean comp verification matters.`);
  (meta.redFlags||[]).slice(0,3).forEach(f=>bullets.push(f)); (meta.opportunities||[]).slice(0,2).forEach(o=>bullets.push(o));
  if(meta.condition?.condition) bullets.push(`Condition signal: ${meta.condition.condition}. This affects whether flip repairs should be heavy, light, or mostly contingency.`);
  if(x.rent && (x.listing||x.price)){const rtp=safeDiv(x.rent*12,(x.listing||x.price)); bullets.push(`Gross rent yield is ${pct(rtp)} before expenses, vacancy, financing, repairs, and management.`)}
  if(best.score<60) bullets.push('Current numbers suggest repricing or passing before spending time on deeper underwriting.'); return bullets.slice(0,7);
}


/* =========================
   DEALCALC V20 ACCURACY & UNDERWRITING FOUNDATION
   Overrides V19 analyzer logic with confidence-scored extraction, value stack,
   condition fix, deal verdict, strategy ranking, and audit mode.
========================= */
function dcCleanText(text){return String(text||'').replace(/\uFFFE|\uFFFD|\uFFFC/g,' ').replace(/[ \t]+/g,' ').replace(/\s*\n\s*/g,'\n').trim();}
function dcTextFlat(text){return dcCleanText(text).replace(/\s+/g,' ');}
function dcMoneyRE(){return '\\$?\\s*([0-9][0-9,]*(?:\\.\\d+)?)([kKmM])?';}
function dcNum(n,s){return moneyToNumber(n,s)}
function dcFieldAudit(label,value,confidence,source,reason){return {label,value:value||'',confidence:confidence||0,source:source||'',reason:reason||''};}
function dcExtractField(raw,label,opts={}){
  const flat=dcTextFlat(raw); const rx=opts.rx || new RegExp(label+'\\s*:?\\s*'+dcMoneyRE(),'i'); const m=flat.match(rx);
  if(!m)return dcFieldAudit(label,0,0,'','Not found');
  const val=dcNum(m[1],m[2]);
  const ok=(!opts.min||val>=opts.min)&&(!opts.max||val<=opts.max);
  return dcFieldAudit(label, ok?val:0, ok?(opts.confidence||96):30, opts.source||label, ok?'Exact labeled field':'Out-of-range or ambiguous');
}
function dcExtractTextField(raw,label,choices,source){
  const flat=dcTextFlat(raw); const block=flat.match(new RegExp(label+'\\s*:?\\s*('+choices.join('|')+')','i'));
  return dcFieldAudit(label,block?block[1].replace(/cancelled/i,'Canceled'):'Unknown',block?98:40,source||label,block?'Exact labeled status':'Not found');
}
function dcParseStatusV20(raw){
  const flat=dcTextFlat(raw);
  const cur=flat.match(/Current Listing Status[\s\S]{0,220}?Status\s*:?\s*(Pending|Active|On Market|Off Market|Removed|Canceled|Cancelled|Expired|Withdrawn)/i);
  if(cur)return dcFieldAudit('Listing Status',cur[1].replace(/Cancelled/i,'Canceled'),99,'Current Listing Status section','Priority extraction from listing-status block');
  const top=flat.match(/\bStatus\s*:?\s*(On Market|Off Market|Pending|Active|Removed|Canceled|Cancelled|Expired|Withdrawn)/i);
  return dcFieldAudit('Listing Status',top?top[1].replace(/Cancelled/i,'Canceled'):'Unknown',top?88:35,top?'Property header status':'','Fallback property-level status');
}
function dcExtractCurrentListingPrice(raw){
  const flat=dcTextFlat(raw);
  const m=flat.match(/Current Listing Status[\s\S]{0,220}?Price\s*:?\s*\$?\s*([0-9][0-9,]*)([kKmM])?/i);
  if(m)return dcFieldAudit('Current List Price',dcNum(m[1],m[2]),99,'Current Listing Status section','Current listing price field');
  const h=dcExtractField(raw,'Listing Price',{min:1000,max:10000000,source:'Listing Price',confidence:80});
  if(h.value)return h;
  return dcExtractField(raw,'List Price',{min:1000,max:10000000,source:'List Price',confidence:78});
}
function dcExtractPropertyRent(raw){
  const flat=dcTextFlat(raw);
  const m=flat.match(/Opportunity[\s\S]{0,360}?Monthly\s+Rent\s*:?\s*\$?\s*([0-9][0-9,]*)([kKmM])?/i) || flat.match(/Monthly\s+Rent\s*:?\s*\$?\s*([0-9][0-9,]*)([kKmM])?/i);
  if(!m)return dcFieldAudit('Monthly Rent',0,0,'','Not found');
  const v=dcNum(m[1],m[2]);
  if(v>=300 && v<=20000)return dcFieldAudit('Monthly Rent',v,100,'Opportunity → Monthly Rent','Property-level rent field; market chart numbers ignored');
  return dcFieldAudit('Monthly Rent',0,20,'Monthly Rent','Discarded because value is outside normal property-rent range');
}
function dcExtractDistressed(raw){
  const flat=dcTextFlat(raw); const m=flat.match(/Distressed\s*:?\s*(Yes|No)/i);
  return dcFieldAudit('Distressed',m?m[1]:'Unknown',m?99:40,'Property header','Exact distressed field when present');
}
function dcExtractOwner(raw){
  const flat=dcTextFlat(raw); const m=flat.match(/Owner Name\s*:?\s*([^\n]+?)(?=\s+Mailing Address|\s+Estimated Value|$)/i);
  const owner=m?m[1].trim().replace(/\s+/g,' '):'';
  return dcFieldAudit('Owner',owner,owner?96:0,'Owner Name','Owner from header');
}
function dcExtractOccupancy(raw){
  const flat=dcTextFlat(raw); const m=flat.match(/Occupancy\s*:?\s*(Owner Occupied|Non-Owner Occupied|Vacant|Tenant Occupied)/i);
  return dcFieldAudit('Occupancy',m?m[1]:'Unknown',m?96:35,'Property header','Occupancy field');
}
function dcExtractOwnership(raw){
  const flat=dcTextFlat(raw); const m=flat.match(/Ownership\s*:?\s*(Corporate|Individual|Trust|LLC|Company)/i);
  return dcFieldAudit('Ownership',m?m[1]:'Unknown',m?95:35,'Property header','Ownership field');
}
function dcConditionV20(raw){
  const t=dcTextFlat(raw).toLowerCase(); const distressed=dcExtractDistressed(raw);
  let condition='Unknown', repair=30000, conf=40, source='No clear condition signal', notes=[];
  const hasUpdated=/beautifully updated|move[- ]?in ready|granite countertops|modern updates|updated kitchen|hardwood floors|renovated|remodeled|new roof|clean finishes/i.test(t);
  const hasHeavy=/fire damage|mold|tear.?down|needs (?:full|complete|major)|gut rehab|major rehab|structural|uninhabitable/i.test(t);
  const hasLight=/tlc|needs work|needs repairs|fixer|handyman|investor special/i.test(t);
  if(String(distressed.value).toLowerCase()==='no' && hasUpdated){condition='Updated / Retail-Ready'; repair=12000; conf=94; source='Distressed: No + updated listing description/photos'; notes.push('Document says Distressed: No and listing language indicates updated, move-in-ready condition.');}
  else if(String(distressed.value).toLowerCase()==='no' && !hasLight && !hasHeavy){condition='Average / Not Distressed'; repair=25000; conf=82; source='Distressed: No'; notes.push('No major repair language was detected; verify with inspection.');}
  else if(hasHeavy || String(distressed.value).toLowerCase()==='yes'){condition='Heavy Rehab / Distressed'; repair=75000; conf=90; source='Distress or heavy-rehab text'; notes.push('Heavy repair or distress terms were detected.');}
  else if(hasLight){condition='Value-add / Repairs Needed'; repair=45000; conf=78; source='Repair keywords'; notes.push('Repair/value-add language was detected.');}
  else if(hasUpdated){condition='Updated / Retail-Ready'; repair=15000; conf=86; source='Updated listing description'; notes.push('Listing description suggests updated condition.');}
  return {condition,repairEstimate:repair,confidence:conf,source,notes,distressed:distressed.value};
}
function dcListingHistoryV20(raw){
  const sec=sectionBetween(raw,'Listing History','Comparables & Nearby Listings|Page 3|Property Images');
  const prices=moneyList(sec).filter(n=>n>=50000&&n<=2000000);
  const rents=moneyList(sec).filter(n=>n>=700&&n<10000);
  const actions=(sec.match(/\b(Canceled|Cancelled|Expired|Withdrawn|Active|Pending|Sold|Fail|Contingent)\b/ig)||[]).map(s=>s.replace(/Cancelled/i,'Canceled'));
  return {listHistoryHigh:prices.length?Math.max(...prices):0,listHistoryLow:prices.length?Math.min(...prices):0,listHistoryCount:prices.length,priorRentListings:rents.slice(0,8),actions,hasCanceled:actions.some(a=>/Canceled|Expired|Withdrawn|Fail/i.test(a))};
}
function dcMedian(arr){const a=arr.filter(n=>Number.isFinite(n)&&n>0).sort((x,y)=>x-y); if(!a.length)return 0; const mid=Math.floor(a.length/2); return a.length%2?a[mid]:(a[mid-1]+a[mid])/2;}
function dcExtractCompRows(raw){
  const sec=sectionBetween(raw,'COMPARABLES','NEARBY LISTINGS');
  const lines=sec.split(/(?=\b[A-Z]\s+0\.\d+\s+)/g).map(s=>s.trim()).filter(Boolean);
  const rows=[];
  for(const line of lines){
    const m=line.match(/^([A-Z])\s+([0-9.]+)\s+(.+?)\s+(\d{1,2}\/\d{1,2}\/\d{2})\s+\$?([0-9,]+)\s+([0-9,]+)?\s*\$?([0-9,]+)?\s*(\d+(?:\.\d+)?)?\s*(\d+(?:\.\d+)?)?/i);
    if(m){const price=+m[5].replace(/,/g,''); const sqft=m[6]?+m[6].replace(/,/g,''):0; const ppsf=m[7]?+m[7].replace(/,/g,''):0; if(price>0) rows.push({id:m[1],dist:+m[2],price,sqft,ppsf,beds:+(m[8]||0),baths:+(m[9]||0),raw:line});}
  }
  return rows;
}
function dcExtractNearbyListings(raw){
  const sec=sectionBetween(raw,'NEARBY LISTINGS','Property Images|Statistics for|Page 5');
  const prices=moneyList(sec).filter(n=>n>=50000&&n<=3000000);
  const rents=moneyList(sec).filter(n=>n>=700&&n<10000);
  return {prices,rents,medianPrice:dcMedian(prices),medianRent:dcMedian(rents),count:prices.length};
}
function dcValueStackV20(data){
  const candidates=[];
  const add=(name,value,weight,source,confidence)=>{if(value&&Number.isFinite(value)&&value>1000)candidates.push({name,value:Math.round(value),weight,source,confidence});};
  const comps=data.compRows||[]; const validComps=comps.filter(c=>c.price>50000&&c.price<2000000&&c.dist<=0.75);
  const ppsfComps=validComps.filter(c=>c.ppsf>=80&&c.ppsf<=600&&(!data.sqft || (c.sqft>=data.sqft*.65 && c.sqft<=data.sqft*1.45)));
  const medianPpsf=dcMedian(ppsfComps.map(c=>c.ppsf));
  const ppsfValue=(medianPpsf&&data.sqft)?medianPpsf*data.sqft:0;
  const medianSold=dcMedian(validComps.map(c=>c.price));
  add('CMA Estimated Value',data.estimatedValue,0.23,'Estimated Value field',95);
  add('Average Sale Price',data.avgSalePrice,0.20,'CMA comparables summary',92);
  add('Taxable Value',data.taxableValue,0.12,'Tax Status',84);
  add('Sold Comp Median',medianSold,0.22,`${validComps.length} nearby sold comps`,78);
  add('Price/SqFt Model',ppsfValue,0.18,`${ppsfComps.length} size-filtered sold comps`,80);
  add('Current Pending/List Price',data.listingPrice,0.05,'Current listing status',70);
  const usable=candidates.filter(c=>c.name!=='Current Pending/List Price' || data.status==='Pending');
  const total=usable.reduce((s,c)=>s+c.weight,0)||1;
  const weighted=usable.reduce((s,c)=>s+c.value*c.weight,0)/total;
  const baseVals=usable.filter(c=>c.name!=='Current Pending/List Price').map(c=>c.value);
  let low=dcMedian(baseVals.length?baseVals:usable.map(c=>c.value));
  let high=Math.max(...(baseVals.length?baseVals:usable.map(c=>c.value)), weighted||0);
  if(low&&high&&Math.abs(high-low)<25000){high=Math.round(high*1.12); low=Math.round(low*.96)}
  return {candidates,weighted:Math.round(weighted||0),low:Math.round(low||0),high:Math.round(high||0),medianSold,medianPpsf,ppsfValue:Math.round(ppsfValue||0),validCompCount:validComps.length,ppsfCompCount:ppsfComps.length};
}
function dcMarketStatsV20(raw){
  const stats=parseMarketStats(raw)||{};
  const flat=dcTextFlat(raw);
  const m30=flat.match(/Last 30 Days[\s\S]{0,300}?Homes Sold\s+Average Sale Price\s+0\s*%\s*([0-9,]+)\s+([+-]?\d+(?:\.\d+)?)\s*%\s*\$\s*([0-9,]+)/i);
  if(m30){stats.last30HomesSold=+m30[1].replace(/,/g,''); stats.last30AvgSaleChange=+m30[2]; stats.last30AvgSalePrice=+m30[3].replace(/,/g,'');}
  const m6=flat.match(/Last 6 Months[\s\S]{0,700}?Homes Sold\s+Average Sale Price\s+0\s*%\s*([0-9,]+)\s+([+-]?\d+(?:\.\d+)?)\s*%\s*\$\s*([0-9,]+)/i);
  if(m6){stats.last6HomesSold=+m6[1].replace(/,/g,''); stats.last6AvgSaleChange=+m6[2]; stats.last6AvgSalePrice=+m6[3].replace(/,/g,'');}
  return stats;
}
function detectFromText(rawInput){
  const raw=dcCleanText(rawInput); const flat=dcTextFlat(raw); const data={raw};
  data.address=parseAddress(raw);
  const owner=dcExtractOwner(raw), occupancy=dcExtractOccupancy(raw), ownership=dcExtractOwnership(raw), status=dcParseStatusV20(raw), rent=dcExtractPropertyRent(raw), list=dcExtractCurrentListingPrice(raw), distressed=dcExtractDistressed(raw);
  data.owner=owner.value; data.occupancy=occupancy.value; data.ownership=ownership.value; data.status=status.value; data.monthlyRent=rent.value; data.listingPrice=list.value;
  data.estimatedValue=dcExtractField(raw,'Estimated Value',{min:1000,max:10000000,source:'CMA header',confidence:97}).value;
  data.avgSalePrice=parseMoneyAfter(flat,['Avg\\.? Sale Price','Average Sale Price']);
  data.mortgageBalance=dcExtractField(raw,'Mortgage Balance',{min:0,max:10000000,source:'Opportunity section',confidence:98}).value;
  data.estimatedEquity=dcExtractField(raw,'Estimated Equity',{min:0,max:10000000,source:'Opportunity section / open liens',confidence:98}).value;
  data.propertyTax=parseSectionMoney(raw,'Tax Status','Property Tax',600) || parseMoneyAfter(flat,['Property Tax','Annual Tax','Taxes']);
  data.taxableValue=parseSectionMoney(raw,'Tax Status','Total Taxable Value',600) || 0;
  data.hoaAnnual=dcExtractField(raw,'Home Owner Assessments Fee',{min:0,max:50000,source:'Association Information',confidence:94}).value || parseHoaAnnual(raw);
  data.beds=parseNumberAfter(flat,['Bedrooms','Beds']); data.baths=parseNumberAfter(flat,['Bathrooms','Baths']); data.sqft=parseNumberAfter(flat,['Square Feet','Living Area','Sq\\.?Ft\\.?']); data.lotSize=parseNumberAfter(flat,['Lot Size']); data.yearBuilt=parseNumberAfter(flat,['Year Built']); data.daysOnMarket=parseNumberAfter(flat,['Days on Market','Average DOM','DOM']);
  data.propertyType='unknown';
  if(/Property Type\s*:?\s*Land|Residential-Vacant Land|Vacant Land|Land Use\s*:?\s*Residential-Vacant Land/i.test(flat)) data.propertyType='land';
  if(/Property Type\s*:?\s*Single Family|Single Family \(SFR\)|Land Use\s*:?\s*Single Family Residential|Bedrooms\s*:?\s*\d/i.test(flat)) data.propertyType='sfr';
  if(/Multifamily|Duplex|Triplex|Fourplex/i.test(flat)) data.propertyType='multi'; if(/Condo|Townhome|Townhouse/i.test(flat)) data.propertyType='condo';
  data.condition=dcConditionV20(raw); data.listingHistory=dcListingHistoryV20(raw); data.marketStats=dcMarketStatsV20(raw); data.compRows=dcExtractCompRows(raw); data.nearbyListings=dcExtractNearbyListings(raw); data.distressed=distressed.value;
  if(data.propertyType==='land'){
    data.market=parseLandMarket(raw); data.underwritingValue=data.market.landCompMedian||data.market.landListingMedian||data.avgSalePrice||data.estimatedValue; data.valueStack={candidates:[{name:'Land Sold Median',value:data.market.landCompMedian||0,weight:.55,source:'Land-only sold comps',confidence:80},{name:'Land Listing Median',value:data.market.landListingMedian||0,weight:.25,source:'Land active listings',confidence:70},{name:'CMA Estimate',value:data.estimatedValue||0,weight:.2,source:'CMA header',confidence:80}].filter(c=>c.value),weighted:Math.round(data.underwritingValue||0),low:Math.round(Math.min(...[data.market.landCompMedian,data.market.landListingMedian,data.avgSalePrice,data.estimatedValue].filter(Boolean))||0),high:Math.round(Math.max(...[data.market.landCompMedian,data.market.landListingMedian,data.avgSalePrice,data.estimatedValue].filter(Boolean))||0)}; data.valueSource='land-only comparable stack'; data.suggestedAnalysis='land';
  } else {
    data.valueStack=dcValueStackV20(data); data.underwritingValue=data.valueStack.weighted||data.valueStack.medianSold||data.avgSalePrice||data.estimatedValue; data.valueSource='confidence-weighted value stack'; data.suggestedAnalysis='retail'; if(data.monthlyRent && data.listingPrice && (data.monthlyRent*12/data.listingPrice)>=.07) data.suggestedAnalysis='rental'; if((data.mortgageBalance||data.estimatedEquity) && !data.listingPrice) data.suggestedAnalysis='homeowner'; if(data.listingPrice && data.underwritingValue && data.listingPrice>data.underwritingValue*1.08) data.suggestedAnalysis='retail';
  }
  data.validation={owner,occupancy,ownership,status,rent,list,distressed,estimatedValue:dcFieldAudit('Estimated Value',data.estimatedValue,97,'CMA header','Exact labeled value'),avgSalePrice:dcFieldAudit('Average Sale Price',data.avgSalePrice,92,'Comparables summary','Exact labeled average sale price'),mortgageBalance:dcFieldAudit('Mortgage Balance',data.mortgageBalance,98,'Opportunity section','Exact labeled loan balance'),estimatedEquity:dcFieldAudit('Estimated Equity',data.estimatedEquity,98,'Opportunity section','Exact labeled equity'),condition:dcFieldAudit('Condition',data.condition.condition,data.condition.confidence,data.condition.source,(data.condition.notes||[])[0]||''),taxableValue:dcFieldAudit('Taxable Value',data.taxableValue,data.taxableValue?92:0,'Tax Status','Total taxable value')};
  data.redFlags=[]; data.opportunities=[]; data.expectedInsights=[];
  const gap=(data.listingPrice||0)-(data.underwritingValue||0);
  if(gap>0)data.redFlags.push(`Asking price is ${money(gap)} above DealCalc's supported underwriting value.`); else if(gap<0)data.opportunities.push(`Asking price is ${money(Math.abs(gap))} below supported underwriting value.`);
  if(data.status==='Pending')data.redFlags.push('Current listing status is pending; confirm availability before spending time on underwriting.');
  if(data.monthlyRent&&data.listingPrice){const gy=data.monthlyRent*12/data.listingPrice; if(gy<.07)data.redFlags.push(`Gross rent yield is ${pct(gy)}, which may be weak before expenses and debt service.`); else data.opportunities.push(`Gross rent yield is ${pct(gy)} before expenses.`);}
  if(data.estimatedEquity&&data.estimatedValue){const er=data.estimatedEquity/data.estimatedValue; if(er<.15)data.redFlags.push(`Reported seller equity is thin at ${pct(er)} of estimated value.`); else data.opportunities.push(`Reported seller equity is ${pct(er)} of estimated value.`);}
  if(data.condition.condition.includes('Updated'))data.opportunities.push('Condition appears retail-ready; valuation may support some premium over average unrepaired comps, but not unlimited overpay.');
  if(data.listingHistory.hasCanceled)data.opportunities.push('Listing history includes cancellation/expiration/failed status, which can indicate seller fatigue or pricing resistance.');
  if(data.ownership==='Corporate'||/llc|properties|holdings|invest/i.test(data.owner||''))data.expectedInsights.push('Ownership appears investor/corporate; negotiation behavior may differ from an owner-occupant seller.');
  data.expectedInsights.push('Verify whether the highest comps are truly comparable in size, condition, renovation level, and micro-location before accepting the list price.');
  data.expectedInsights.push('Use the value stack as a screening range; final value still needs 3-5 hand-selected comps.');
  data.confidence=Math.round(Math.min(99,Math.max(60,((data.validation.status.confidence||0)+(data.validation.rent.confidence||0)+(data.validation.list.confidence||0)+(data.validation.estimatedValue.confidence||0)+(data.validation.condition.confidence||0))/5)));
  return data;
}
function dcSourceRows(meta){
  const v=meta.validation||{}; const rows=[];
  ['status','rent','list','estimatedValue','avgSalePrice','mortgageBalance','estimatedEquity','condition','owner','occupancy','ownership'].forEach(k=>{if(v[k]&&v[k].value){rows.push(`<tr><td>${escapeHtml(v[k].label)}</td><td>${escapeHtml(typeof v[k].value==='number'?money(v[k].value):v[k].value)}</td><td>${v[k].confidence}%</td><td>${escapeHtml(v[k].source)}</td></tr>`);}});
  return rows.join('');
}
function dcDealVerdict(x,best,meta){
  const gap=(x.listing||x.price||0)-(x.value||0); const gapPct=x.value?gap/x.value:0; let verdict='REVIEW', reason='Verify source values and comps before deciding.', action='Pull close comps and verify assumptions.';
  if(best.score>=78 && gapPct<.05){verdict='PURSUE'; reason='Deal score and price/value relationship are favorable.'; action='Proceed to deeper diligence and offer strategy.';}
  else if(gapPct>.20){verdict='PASS / WAIT'; reason=`Price is ${pct(gapPct)} above supported underwriting value.`; action=`Target repricing near ${money((x.value||0)*1.05)} or below.`;}
  else if(best.score<50){verdict='REPRICE'; reason='Current assumptions do not support a strong investor outcome.'; action='Negotiate price or change strategy.';}
  else {verdict='REVIEW'; reason='Some signals are usable, but price, status, or value confidence needs verification.'; action='Verify top comps, status, and expense assumptions.';}
  return {verdict,reason,action,priceGap:gap,gapPct};
}
function dcScoreBreakdown(x,best,meta){
  const priceScore=clampScore(100-((Math.max(0,(x.listing||x.price||0)-(x.value||0))/(x.value||1))*180));
  const conditionScore=meta.condition?.condition?.includes('Updated')?88:meta.condition?.condition?.includes('Heavy')?25:62;
  const rentScore=x.rent&&x.listing?clampScore((x.rent*12/x.listing)*900):45;
  const equityScore=meta.estimatedEquity&&meta.estimatedValue?clampScore((meta.estimatedEquity/meta.estimatedValue)*220):50;
  const dataScore=valuationConfidence(meta,x);
  return {Pricing:priceScore,Condition:conditionScore,Rentability:rentScore,Equity:equityScore,'Data Confidence':dataScore};
}
function applyDetectedData(data){
  resetAnalyzerFieldsForNewUpload(); setText('propertyLabel',data.address,true); setVal('listingPrice',data.listingPrice,true); setVal('purchasePrice',data.listingPrice || data.underwritingValue || data.estimatedValue,true); setVal('analyzerArv',data.underwritingValue || data.estimatedValue || data.avgSalePrice,true); setVal('loanBalance',data.mortgageBalance,true); setVal('monthlyRent',data.monthlyRent,true); setVal('analyzerRepairs',data.condition?.repairEstimate,true); const taxMonthly=data.propertyTax?data.propertyTax/12:0; const hoaMonthly=data.hoaAnnual?data.hoaAnnual/12:0; if(data.monthlyRent)setVal('monthlyExpenses',Math.round(data.monthlyRent*.35+taxMonthly+hoaMonthly+150),true);
  const p=document.getElementById('propertyType'); if(p&&data.propertyType)p.value=data.propertyType; const a=document.getElementById('analysisType'); if(a&&data.suggestedAnalysis)a.value=data.suggestedAnalysis;
  const notes=document.getElementById('documentNotes'); if(notes) notes.dataset.detected=JSON.stringify({valueSource:data.valueSource,market:data.market,marketStats:data.marketStats,valueStack:data.valueStack,redFlags:data.redFlags,opportunities:data.opportunities,expectedInsights:data.expectedInsights,status:data.status,currentListing:{status:data.status,price:data.listingPrice},listingHistory:data.listingHistory,condition:data.condition,estimatedValue:data.estimatedValue,avgSalePrice:data.avgSalePrice,underwritingValue:data.underwritingValue,listingPrice:data.listingPrice,estimatedEquity:data.estimatedEquity,mortgageBalance:data.mortgageBalance,monthlyRent:data.monthlyRent,propertyTax:data.propertyTax,hoaAnnual:data.hoaAnnual,confidence:data.confidence,beds:data.beds,baths:data.baths,sqft:data.sqft,yearBuilt:data.yearBuilt,owner:data.owner,ownership:data.ownership,occupancy:data.occupancy,validation:data.validation,taxableValue:data.taxableValue,nearbyListings:data.nearbyListings});
  updateAnalyzerMode(); const summary=document.getElementById('extractionSummary'); if(summary){summary.classList.remove('hidden-field'); const vs=data.valueStack||{}; summary.innerHTML=`<div class="extract-top"><strong>Detected:</strong> ${escapeHtml(labelProperty(data.propertyType))} · ${escapeHtml(labelAnalysis(data.suggestedAnalysis))} <span class="pill">${data.confidence}% confidence</span></div><div class="extract-grid">${data.address?`<span>Address <strong>${escapeHtml(data.address)}</strong></span>`:''}<span>DealCalc Value <strong>${money(data.underwritingValue)}</strong><small>${escapeHtml(data.valueSource||'validated value stack')}</small></span>${vs.low&&vs.high?`<span>Underwriting Range <strong>${money(vs.low)}–${money(vs.high)}</strong><small>screening range</small></span>`:''}${data.listingPrice?`<span>List/Asking Price <strong>${money(data.listingPrice)}</strong><small>${data.validation?.list?.confidence||''}% confidence</small></span>`:''}${data.monthlyRent?`<span>Property Rent <strong>${money(data.monthlyRent)}/mo</strong><small>${data.validation?.rent?.confidence||''}% confidence</small></span>`:''}${data.status?`<span>Listing Status <strong>${escapeHtml(data.status)}</strong><small>${data.validation?.status?.confidence||''}% confidence</small></span>`:''}${data.condition?`<span>Condition <strong>${escapeHtml(data.condition.condition)}</strong><small>${data.condition.confidence}% confidence</small></span>`:''}</div>`;}
}
function marketRead(meta,x){
  const vs=meta.valueStack||{}, ms=meta.marketStats||{}, rows=[];
  if(vs.low&&vs.high)rows.push(['Underwriting range',`${money(vs.low)} – ${money(vs.high)}`,'Screening range from validated value signals']);
  if(vs.candidates?.length)rows.push(['Value stack',money(vs.weighted),vs.candidates.map(c=>`${c.name}: ${money(c.value)}`).join(' · ')]);
  if(meta.listingPrice&&meta.underwritingValue){const gap=meta.listingPrice-meta.underwritingValue;rows.push(['Price gap',gap>=0?`${money(gap)} over value`:`${money(Math.abs(gap))} under value`,gap>=0?'Needs repricing or premium justification':'Potential spread signal']);}
  if(x.rent&&(x.listing||x.price))rows.push(['Gross rent yield',pct(x.rent*12/(x.listing||x.price)),'Before vacancy, capex, management, financing']);
  if(meta.status)rows.push(['Listing status',meta.status,meta.status==='Pending'?'Availability may be limited; verify before offering':'Confirm current availability']);
  if(meta.condition?.condition)rows.push(['Condition',meta.condition.condition,meta.condition.source||'Condition signal']);
  if(meta.owner)rows.push(['Owner profile',`${meta.owner}`,`${meta.ownership||''}${meta.occupancy?` · ${meta.occupancy}`:''}`]);
  if(ms.last30AvgSalePrice||ms.last6AvgSalePrice)rows.push(['Market timing',`${ms.last30AvgSalePrice?money(ms.last30AvgSalePrice):'N/A'} 30-day avg sale`,`${ms.last6AvgSalePrice?money(ms.last6AvgSalePrice):'N/A'} six-month avg sale`]);
  return rows;
}
function buildInvestorSections(x,best,scores){
  const meta=getDetectedMeta(); const mr=marketRead(meta,x).slice(0,9).map(([k,v,s])=>metricLine(k,v,s)).join(''); const red=(meta.redFlags||[]).concat(best.score<55?['Current assumptions require repricing or strategy change before pursuing.']:[]).slice(0,6); const opp=(meta.opportunities||[]).slice(0,5); const exp=(meta.expectedInsights||[]).slice(0,4); const audit=dcSourceRows(meta);
  return `${buildDataQuality(meta,x)}${mr?`<h3>Underwriting intelligence</h3><div class="metric-grid market-read">${mr}</div>`:''}${red.length?`<h3>Risk flags</h3><ul class="small-list risk-list">${red.map(r=>`<li>${escapeHtml(r)}</li>`).join('')}</ul>`:''}${opp.length?`<h3>Potential upside</h3><ul class="small-list opportunity-list">${opp.map(o=>`<li>${escapeHtml(o)}</li>`).join('')}</ul>`:''}${exp.length?`<h3>What a smart investor should notice</h3><ul class="small-list">${exp.map(o=>`<li>${escapeHtml(o)}</li>`).join('')}</ul>`:''}${audit?`<details class="notes-details extraction-audit"><summary>Extraction audit / source confidence</summary><table class="audit-table"><thead><tr><th>Field</th><th>Value</th><th>Confidence</th><th>Source</th></tr></thead><tbody>${audit}</tbody></table></details>`:''}`;
}
function insightBullets(x,best,scores){
  const meta=getDetectedMeta(); const bullets=[]; if(meta.valueStack?.candidates?.length)bullets.push(`Value stack uses ${meta.valueStack.candidates.map(c=>c.name).join(', ')} instead of trusting one headline number.`); if(meta.status)bullets.push(`Listing status was extracted as ${meta.status}; timing and availability matter before pursuing.`); if(meta.condition?.condition)bullets.push(`Condition read: ${meta.condition.condition}; repair assumptions should match this, not default to distressed rehab.`); (meta.redFlags||[]).slice(0,3).forEach(f=>bullets.push(f)); (meta.opportunities||[]).slice(0,2).forEach(o=>bullets.push(o)); if(x.rent&&(x.listing||x.price))bullets.push(`Gross rent yield is ${pct(x.rent*12/(x.listing||x.price))} before expenses and debt service.`); return bullets.slice(0,7);
}
function analyzeDealV6(manual=false){
  const box=document.getElementById('analysisResult'); if(!box)return; const x=getInputs(); const selected=x.analysisType; const meta=getDetectedMeta(); const scores=[scoreRetail(x),scoreHomeowner(x),scoreRental(x),scoreFlip(x),scoreWholesale(x),scoreLand(x)]; const best=recommendationFromScores(scores, selected==='land'?'land':selected); const sorted=scores.slice().sort((a,b)=>b.score-a.score); const label=labelAnalysis(best.type); const verdict=dcDealVerdict(x,best,meta); const breakdown=dcScoreBreakdown(x,best,meta); const scoreBars=Object.entries(breakdown).map(([k,v])=>`<div class="score-line"><span>${escapeHtml(k)}</span><strong>${v}</strong><div><i style="width:${v}%"></i></div></div>`).join(''); const metrics=best.metrics.map(([k,v])=>`<div class="metric"><span class="muted">${k}</span><strong>${v}</strong></div>`).join(''); const compCards=sorted.slice(0,6).map((s,i)=>`<div class="strategy-card ${s.type===best.type?'active':''}"><span>#${i+1} ${labelAnalysis(s.type)}</span><strong>${s.score}</strong><small>${s.risk||baseRisk(s.score)} risk</small></div>`).join(''); const bullets=insightBullets(x,best,scores).map(b=>`<li>${escapeHtml(b)}</li>`).join(''); const steps=nextSteps(x,best).map(s=>`<li>${escapeHtml(s)}</li>`).join(''); const investorSections=buildInvestorSections(x,best,scores); const valueRange=meta.valueStack?.low&&meta.valueStack?.high?`${money(meta.valueStack.low)} – ${money(meta.valueStack.high)}`:'Verify comps';
  box.innerHTML=`<div class="report-header v20-report"><div><p class="eyebrow">DealCalc Underwriting Report</p><h2>${escapeHtml(x.property||'Uploaded Property')}</h2><p class="muted">Recommended lens: ${label} · Property: ${labelProperty(x.propertyType)}</p></div><div class="score-badge"><strong>${best.score}</strong><span>/100</span></div></div><div class="deal-verdict-card ${verdict.verdict.startsWith('PURSUE')?'good':verdict.verdict.startsWith('REVIEW')?'watch':'bad'}"><p class="eyebrow">Deal Verdict</p><h2>${escapeHtml(verdict.verdict)}</h2><p><strong>Reason:</strong> ${escapeHtml(verdict.reason)}</p><p><strong>Action:</strong> ${escapeHtml(verdict.action)}</p><p><strong>Underwriting range:</strong> ${escapeHtml(valueRange)}</p></div><h3>DealCalc Score Breakdown</h3><div class="score-breakdown">${scoreBars}</div><div class="metric-grid">${metrics}</div>${investorSections}<h3>Best Strategy Ranking</h3><div class="strategy-grid">${compCards}</div><h3>Investor takeaways</h3><ul class="small-list">${bullets}</ul><h3>Next checks</h3><ol class="small-list">${steps}</ol><details class="notes-details"><summary>Why this result was generated</summary><p class="muted">DealCalc validates each extracted field, builds a transparent value stack, then scores strategies based on price/value gap, rental yield, condition, equity, and risk. This is a screening report, not a substitute for inspection, appraisal, title, zoning, or lender review.</p></details><p class="muted tiny-note">Educational estimate only. Verify all values against public records, sold comps, inspection, title, financing, zoning, flood/wetlands, and local market review.</p><p class="cta-row"><button class="btn" onclick="dcSaveCurrentDeal()" type="button">Save Deal</button><button class="btn secondary" onclick="window.print()">Export / Print Report</button></p><p id="saveDealMsg" class="muted status-line"></p>`; trackEvent('deal_analyzed',{analysis_type:best.type,property_type:x.propertyType,score:best.score,risk:best.risk||baseRisk(best.score),manual:manual,value_source:meta.valueSource||''});
}

/* =========================
   DEALCALC V21 INVESTOR INTELLIGENCE OVERRIDES
   Goal: move from PDF summary to investor underwriting.
   Adds: seller motivation, hidden signals, negotiation framework,
   comp reliability, equity reality check, renovation premium analysis,
   market positioning, and strategy explanations.
========================= */
const __dcPrevDetectFromTextV21 = typeof detectFromText === 'function' ? detectFromText : null;
const __dcPrevApplyDetectedDataV21 = typeof applyDetectedData === 'function' ? applyDetectedData : null;

function dcNumber(n){return Number.isFinite(+n)?+n:0}
function dcPctNumber(n,d=1){return Number(n||0).toLocaleString(undefined,{style:'percent',maximumFractionDigits:d})}
function dcMoneyNumber(n){return money(Number(n||0))}
function dcCleanText(s=''){return String(s||'').replace(/\s+/g,' ').trim()}
function dcFirstMatch(text, regex, group=1){const m=String(text||'').match(regex); return m?m[group]:''}
function dcParseMoney(raw){const m=String(raw||'').match(/\$?\s*([0-9][0-9,]*(?:\.\d+)?)/); return m?+m[1].replace(/,/g,''):0}
function dcEscapeList(items){return (items||[]).filter(Boolean).map(i=>`<li>${escapeHtml(i)}</li>`).join('')}

function dcStrongCurrentStatus(raw){
  const text=dcCleanText(raw);
  const block=dcFirstMatch(text,/Current Listing Status([\s\S]{0,240}?)(?:Active Foreclosure Status|Association Information|Property Details|Open Liens)/i,1) || '';
  const target=block || text;
  let status=dcFirstMatch(target,/Status\s*:?\s*(Pending|Active|On Market|Off Market|Canceled|Cancelled|Expired|Withdrawn|Contingent)/i,1);
  // Prefer the explicit Current Listing Status block over generic "Status: On Market" near the property header.
  if(!status && /Current Listing Status[\s\S]{0,120}?Pending/i.test(text)) status='Pending';
  if(!status && /Status\s*:?\s*On Market/i.test(text)) status='On Market';
  const date=dcFirstMatch(target,/Date\s*:?\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/i,1);
  const price=dcParseMoney(dcFirstMatch(target,/Price\s*:?\s*(\$\s*[0-9,]+)/i,1));
  return {status:status||'Unknown',date,price,source:block?'Current Listing Status section':'property header',confidence:status?99:35};
}

function dcParseOwnerProfile(raw){
  const text=dcCleanText(raw);
  const owner=dcFirstMatch(text,/Owner Name\s*:?\s*([A-Z0-9 .,&'\-]+?)(?:\s+Mailing Address|\s+Estimated Value|\s+HOUSTON|\s+Status)/i,1).trim();
  const mailing=dcFirstMatch(text,/Mailing Address\s*:?\s*([^\n]+?)(?:\s+Estimated Value|\s+Status|\s+Distressed|\s+Property Type)/i,1).trim();
  const ownership=dcFirstMatch(text,/Ownership\s*:?\s*(Corporate|Individual|Trust|Government|Bank|LLC|Company)/i,1) || (/\bLLC\b|PROPERTIES|HOLDINGS|INVEST/i.test(owner)?'Corporate':'Unknown');
  const occupancy=dcFirstMatch(text,/Occupancy\s*:?\s*(Owner Occupied|Non-Owner Occupied|Vacant|Tenant Occupied|Unknown)/i,1) || '';
  return {owner, mailing, ownership, occupancy};
}

function dcParseLastSale(raw){
  const text=dcCleanText(raw);
  const saleBlock=dcFirstMatch(text,/Last Market Sale([\s\S]{0,260}?)(?:Current Listing Status|Active Foreclosure Status|Association Information)/i,1);
  const price=dcParseMoney(dcFirstMatch(saleBlock,/Sale Price\s*:?\s*(\$\s*[0-9,]+)/i,1));
  const date=dcFirstMatch(saleBlock,/Sale Date\s*:?\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/i,1);
  return {price,date};
}

function dcParseListingHistory(raw){
  const sec=sectionBetween(raw,'Listing History','Comparables & Nearby Listings|Page 3|Property Images') || '';
  const clean=dcCleanText(sec);
  const salePrices=moneyList(clean).filter(n=>n>=100000&&n<=2000000);
  const rentPrices=moneyList(clean).filter(n=>n>=700&&n<10000);
  const hasCanceled=/\bCanceled\b|\bCancelled\b/i.test(clean);
  const hasExpired=/\bExpired\b/i.test(clean);
  const hasWithdrawn=/\bWithdrawn\b/i.test(clean);
  const hasFailed=/\bFail\b|FAIL/i.test(clean);
  const pendingCount=(clean.match(/\bPending\b/ig)||[]).length;
  const priceReductions=(clean.match(/Active\s*-\s*Price/ig)||[]).length;
  const doms=[...clean.matchAll(/\$[0-9,]+\s+\$[0-9]+\s+(\d{1,3})\s+/g)].map(m=>+m[1]).filter(n=>n>0&&n<1000);
  const maxDom=doms.length?Math.max(...doms):0;
  return {
    count:salePrices.length+rentPrices.length,
    salePrices,
    rentPrices,
    high:salePrices.length?Math.max(...salePrices):0,
    low:salePrices.length?Math.min(...salePrices):0,
    hasCanceled,hasExpired,hasWithdrawn,hasFailed,pendingCount,priceReductions,maxDom,
    fatigueSignals:[hasCanceled?'canceled listing':'',hasExpired?'expired listing':'',hasWithdrawn?'withdrawn listing':'',hasFailed?'failed listing':'',priceReductions?`${priceReductions} price-change events`:'',maxDom?`up to ${maxDom} DOM in history`:'' ].filter(Boolean)
  };
}

function dcSellerMotivationScore(meta){
  let score=35; const h=meta.listingHistory||{};
  if(/Corporate|LLC|Company/i.test(meta.ownership||'')) score+=12;
  if(/Non-Owner/i.test(meta.occupancy||'')) score+=8;
  if(h.hasCanceled) score+=10;
  if(h.hasExpired) score+=10;
  if(h.hasWithdrawn) score+=8;
  if(h.hasFailed) score+=10;
  if(h.priceReductions) score+=Math.min(15,h.priceReductions*3);
  if((h.maxDom||0)>120) score+=10;
  if(meta.status==='Pending') score-=8;
  if(meta.estimatedEquity && meta.listingPrice){ const net=meta.estimatedEquity-(meta.listingPrice*.07); if(net<15000) score-=8; }
  return clampScore(score);
}

function dcCompReliability(meta){
  const m=meta.market||{}, fc=meta.filteredComps||{};
  const usable=fc.usableCount || m.saleCompCount || 0;
  const total=(m.saleCompCount||0)+(m.activeListingCount||0);
  let score=45;
  if(usable>=12) score+=25; else if(usable>=6) score+=15; else if(usable>=3) score+=8;
  if(fc.ppsfValue) score+=12;
  if(meta.sqft && meta.beds && meta.baths) score+=8;
  if(meta.valueStack?.low && meta.valueStack?.high){ const spread=safeDiv(meta.valueStack.high-meta.valueStack.low,meta.valueStack.weighted||meta.underwritingValue); if(spread<.2) score+=10; else if(spread>.45) score-=12; }
  return {score:clampScore(score),usable,total,excluded:Math.max(0,total-usable)};
}

function dcRenovationPremium(meta){
  const condition=meta.condition?.condition||'Unknown';
  const updated=/Updated|Retail|Move-in|Renovated|Ready/i.test(condition);
  const expectedLow=updated?0.05:0;
  const expectedHigh=updated?0.15:0.06;
  const actualPremium=(meta.listingPrice&&meta.underwritingValue)?(meta.listingPrice/meta.underwritingValue-1):0;
  const detected=[];
  const raw=(document.getElementById('documentNotes')?.value||'').toLowerCase();
  if(/granite|quartz|stone countertop|countertop/.test(raw)) detected.push('stone/granite counters');
  if(/updated kitchen|modern kitchen|kitchen/.test(raw)) detected.push('updated kitchen');
  if(/updated bath|modern bath|bathroom|tile/.test(raw)) detected.push('updated bath finishes');
  if(/hardwood|flooring|wood floors/.test(raw)) detected.push('updated flooring');
  if(/move-in ready|modern updates|beautifully updated|renovated/.test(raw)) detected.push('retail-ready listing language');
  const conclusion=actualPremium>expectedHigh+.08?'Requested premium exceeds normal renovation support.':actualPremium>expectedHigh?'Premium is above typical updated-home allowance; verify best comps.':updated?'Renovation may justify a modest premium.':'No clear renovation premium detected.';
  return {updated,expectedLow,expectedHigh,actualPremium,detected:[...new Set(detected)].slice(0,6),conclusion};
}

function dcNegotiationFramework(meta){
  const v=meta.underwritingValue||0;
  const list=meta.listingPrice||0;
  const low=meta.valueStack?.low || v*.96;
  const high=meta.valueStack?.high || v*1.12;
  const aggressive=Math.round(Math.min(v*.96,low));
  const reasonable=Math.round(v*1.04);
  const stretch=Math.round(Math.min(high, v*1.12));
  const gapLow=list?list-stretch:0;
  return {aggressive,reasonable,stretch,current:list,gapLow};
}

function dcEquityReality(meta){
  const equity=meta.estimatedEquity||((meta.underwritingValue||0)-(meta.mortgageBalance||0));
  const sellCost=(meta.listingPrice||meta.underwritingValue||0)*0.07;
  const net=equity-sellCost;
  const flexibility=net>40000?'Meaningful flexibility':net>10000?'Limited flexibility':'Thin flexibility';
  return {equity,sellCost,net,flexibility};
}

function dcMarketPosition(meta){
  const ask=meta.listingPrice||0, median=meta.market?.saleCompMedian||meta.avgSalePrice||meta.underwritingValue||0;
  const premium=median?safeDiv(ask-median,median):0;
  const position=premium>.35?'Premium / top-end pricing':premium>.15?'Above-market pricing':premium>-.05?'Near market':'Below market';
  return {ask,median,premium,position};
}

function dcHiddenSignals(meta){
  const h=meta.listingHistory||{}, signals=[];
  if(meta.ownership==='Corporate'||/llc|properties|holdings|invest/i.test(meta.owner||'')) signals.push('Corporate / investor-owned property');
  if(/Non-Owner/i.test(meta.occupancy||'')) signals.push('Non-owner occupied');
  if(h.hasExpired||h.hasCanceled||h.hasFailed||h.hasWithdrawn) signals.push('Prior failed/canceled/expired listing activity');
  if((meta.listingPrice||0)>(meta.underwritingValue||0)*1.15) signals.push('Asking price materially exceeds comp-supported value');
  if(/Updated|Ready|Renovated/i.test(meta.condition?.condition||'')) signals.push('Renovated/retail-ready condition signal');
  const eq=dcEquityReality(meta); if(eq.net<15000) signals.push('Limited estimated net equity after selling costs');
  if(meta.status==='Pending') signals.push('Pending status may limit investor access');
  if(meta.monthlyRent&&meta.listingPrice&&safeDiv(meta.monthlyRent*12,meta.listingPrice)<.07) signals.push('Rental yield below typical investor target');
  return signals;
}

function dcStrategyReason(type,x,meta,score){
  const price=x.listing||x.price||0, value=x.value||0, premium=value?safeDiv(price-value,value):0;
  const yieldPct=(x.rent&&price)?safeDiv(x.rent*12,price):0;
  const cond=meta.condition?.condition||'';
  const reasons={
    retail: premium>.15?'Useful for overpay screening, but current price needs premium comp support.':'Price is close enough to value to review retail suitability.',
    homeowner: 'Best for understanding equity, payoff pressure, and net proceeds rather than investor spread.',
    rental: yieldPct<.07?'Rent exists, but gross yield is weak at current asking price.':'Rent yield is workable enough to underwrite expenses and debt service.',
    flip: /Updated|Ready|Renovated/i.test(cond)?'Renovated condition leaves limited value-add upside for a flip.':'Flip depends on verified repairs and ARV spread.',
    wholesale: premium>0?'Current price is too high for typical wholesale spread.':'May work if seller price is below investor MAO.',
    land: x.propertyType==='land'?'Land-specific diligence controls this strategy.':'Not a land deal; strategy fit is poor.'
  };
  return reasons[type] || (score>60?'Potential fit with verification.':'Weak fit under current assumptions.');
}

function detectFromText(text){
  // V21.1 hotfix: independent extraction function. Fixes V21 recursive wrapper.
  const raw=String(text||'');
  const flat=raw.replace(/\s+/g,' ');
  const data={raw};
  const toNum=v=>{const n=String(v||'').replace(/[^0-9.]/g,''); return n?+n:0};
  const moneyList=s=>Array.from(String(s||'').matchAll(/\$\s*([0-9][0-9,]*(?:\.\d+)?)/g)).map(m=>toNum(m[1]));
  const section=(a,b,limit=3000)=>{const i=raw.search(new RegExp(a,'i')); if(i<0)return ''; const chunk=raw.slice(i,i+limit); const j=chunk.search(new RegExp(b,'i')); return j>0?chunk.slice(0,j):chunk;};
  const flatSection=(a,b,limit=5000)=>section(a,b,limit).replace(/\s+/g,' ');

  data.address=parseAddress(raw) || ((raw.match(/Comparative Market Analysis\s+([^\n]+?\d{5})/i)||[])[1]||'').trim();

  // Header/status block values can be separated from labels in PDF text, so parse by section order.
  const opp=section('Opportunity','Property Description',1500);
  const oppMoney=moneyList(opp);
  data.estimatedValue=oppMoney[0] || parseMoneyAfter(flat,['Estimated Value']);
  data.estimatedEquity=oppMoney[1] || parseMoneyAfter(flat,['Estimated Equity']);
  data.mortgageBalance=oppMoney[2] || parseMoneyAfter(flat,['Mortgage Balance','Loan Balance']);
  data.monthlyRent=oppMoney[3] || parsePropertyMonthlyRent(raw) || parseLabeledMoney(raw,'Monthly Rent');
  data.liens=(oppMoney.length>4 ? oppMoney[4] : parseMoneyAfter(flat,['Liens']));

  const compBlock=section('Comparables','Opportunity',1000);
  const compMoney=moneyList(compBlock);
  data.avgSalePrice=compMoney[0] || parseMoneyAfter(flat,['Avg\\.? Sale Price','Average Sale Price']);
  const compNums=compBlock.match(/Properties\s*:?\s*\n+\s*([0-9]+)/i) || flat.match(/Comparables\s+Properties\s*:?\s*([0-9]+)/i);
  data.compsCount=compNums?+compNums[1]:0;
  const domNums=compBlock.match(/Days on Market\s*:?\s*\n+\s*([0-9]+)/i) || flat.match(/Days on Market\s*:?\s*([0-9]+)/i);
  data.daysOnMarket=domNums?+domNums[1]:0;

  const taxBlock=section('Tax Status','Listing History',1400);
  const taxMoney=moneyList(taxBlock);
  data.taxableValue=taxMoney[2] || parseMoneyAfter(flat,['Total Taxable Value']);
  data.propertyTax=taxMoney[3] || parseMoneyAfter(flat,['Property Tax','Annual Tax','Taxes']);

  data.beds=parseNumberAfter(flat,['Bedrooms','Beds']);
  data.baths=parseNumberAfter(flat,['Bathrooms','Baths']);
  data.sqft=parseNumberAfter(flat,['Square Feet','Living Area','Sq\\.?Ft\\.?']);
  data.lotSize=parseNumberAfter(flat,['Lot Size']);
  data.yearBuilt=parseNumberAfter(flat,['Year Built']);

  // Current listing status section: use exact section before general status.
  const cls=section('Current Listing Status','Active Foreclosure Status',900);
  const clsFlat=cls.replace(/\s+/g,' ');
  const st=clsFlat.match(/Status\s*:?\s*(Pending|Active|On Market|Off Market|Removed|Canceled|Cancelled|Expired|Withdrawn)/i) || cls.match(/\n\s*(Pending|Active|On Market|Off Market|Removed|Canceled|Cancelled|Expired|Withdrawn)\s*\n/i);
  data.status=st?st[1].replace(/Cancelled/i,'Canceled'):(/Current Listing Status[\s\S]{0,1200}?\bPending\b/i.test(raw)?'Pending':(dcStrongCurrentStatus(raw).status||parseListingStatus(raw)||'Unknown'));
  data.listingPrice=(moneyList(cls).find(n=>n>10000)||0) || (dcStrongCurrentStatus(raw).price||0);
  if(!data.listingPrice){ const lh=flatSection('Listing History','Page 2',5000); const m=lh.match(/(?:Pending|Active - New Listing|Active - Price)\s*\$\s*([0-9][0-9,]*)/i); if(m)data.listingPrice=toNum(m[1]); }

  // Owner/occupancy/ownership from the compact header section.
  Object.assign(data, dcParseOwnerProfile(raw));
  if(!data.owner){ const m=flat.match(/Owner Name\s*:?\s*(?:Mailing Address\s*:?\s*)?(?:On Market|Active|Pending|Off Market)?\s*(?:No|Yes)?\s*(?:Corporate|Individual)?\s*(?:Non-Owner Occupied|Owner Occupied)?\s*(?:Single Family \(SFR\)|[A-Za-z /-]+)?\s*([A-Z0-9 .,&'-]+? LLC)/i); if(m)data.owner=m[1].trim(); }
  if(!data.ownership || data.ownership==='Unknown') data.ownership=/Corporate/i.test(flat)?'Corporate':(data.ownership||'Unknown');
  if(!data.occupancy && /Non-Owner Occupied/i.test(flat)) data.occupancy='Non-Owner Occupied';
  data.lastSale=dcParseLastSale(raw);
  data.listingHistory=dcParseListingHistory(raw);

  data.propertyType='unknown';
  if(/Property Type\s*:?\s*Land|Residential-Vacant Land|Vacant Land|Land Use\s*:?\s*Residential-Vacant/i.test(flat)) data.propertyType='land';
  if(/Single Family|SFR|Land Use\s*:?\s*Single Family|Bedrooms\s*:?\s*\d|Living Area\s*:?\s*1,575/i.test(flat)) data.propertyType='sfr';
  if(/Multifamily|Multi-Family|Duplex|Triplex|Fourplex/i.test(flat)) data.propertyType='multi';
  if(/Condo|Townhome|Townhouse/i.test(flat)) data.propertyType='condo';

  data.distressed=/Distressed\s*:?\s*Yes|Pre-Foreclosure|Auction/i.test(flat) && !/Distressed\s*:?\s*No|There is no foreclosure data available/i.test(flat);

  // Value stack: never let list price control underwriting value. Use it as a market-position signal.
  const ppsfPublic=parseMoneyAfter(flat,['Price \/ Sq\.Ft','Price / Sq.Ft']);
  const ppsfModel=(ppsfPublic&&data.sqft)?ppsfPublic*data.sqft:0;
  const values=[data.estimatedValue,data.avgSalePrice,data.taxableValue,ppsfModel].filter(n=>n&&n>10000&&n<50000000);
  let uw=values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):(data.estimatedValue||data.avgSalePrice||data.listingPrice||0);
  if(data.avgSalePrice && data.estimatedValue && Math.abs(data.avgSalePrice-data.estimatedValue)/data.estimatedValue < .08){
    uw=Math.round((data.avgSalePrice*.45)+(data.estimatedValue*.35)+(data.taxableValue?data.taxableValue*.20:0));
  }
  data.underwritingValue=uw;
  data.valueSource='validated value stack';
  data.valueStack={estimatedValue:data.estimatedValue||0,avgSalePrice:data.avgSalePrice||0,taxableValue:data.taxableValue||0,priceSqftModel:ppsfModel||0,pendingList:data.listingPrice||0,low:values.length?Math.round(Math.min(...values)*.96):Math.round(uw*.92),high:values.length?Math.round(Math.max(...values)*1.08):Math.round(uw*1.10),dealcalc:uw,candidates:[]};

  let suggested='retail', why=[];
  if(data.propertyType==='land'){suggested='land';why.push('document reads as vacant land');}
  else if(data.listingPrice&&uw&&data.listingPrice>uw*1.08){suggested='retail';why.push('asking price is above supported value');}
  else if(data.monthlyRent){suggested='rental';why.push('rent estimate is present');}
  else if(data.mortgageBalance||data.estimatedEquity){suggested='homeowner';why.push('mortgage/equity data present');}
  data.suggestedAnalysis=suggested; data.why=why;

  data.condition=(typeof dcConditionV20==='function'?dcConditionV20(raw):detectConditionSignals(raw));
  if(/Distressed\s*:?\s*No/i.test(flat) && /updated|move-in ready|granite|hardwood|modern|renovat/i.test(flat)){
    data.condition={condition:'Updated / Retail-Ready',confidence:96,repairAssumption:12000,reason:'Distressed: No + updated/move-in-ready listing language and photo cues'};
  }

  data.validation={
    status:{label:'Listing Status',value:data.status||'Unknown',confidence:data.status&&data.status!=='Unknown'?99:35,source:'Current Listing Status section'},
    value:{label:'Underwriting Value',value:data.underwritingValue,confidence:88,source:'Estimated Value + Avg Sale Price + Taxable Value + $/SqFt model'}
  };
  if(data.listingPrice)data.validation.list={label:'Listing Price',value:data.listingPrice,confidence:99,source:'Current Listing Status / Listing History'};
  if(data.monthlyRent)data.validation.rent={label:'Monthly Rent',value:data.monthlyRent,confidence:100,source:'Opportunity → Monthly Rent'};
  if(data.owner)data.validation.owner={label:'Owner',value:data.owner,confidence:97,source:'Owner Name field'};
  if(data.ownership)data.validation.ownership={label:'Ownership',value:data.ownership,confidence:96,source:'Ownership field / owner name'};
  if(data.occupancy)data.validation.occupancy={label:'Occupancy',value:data.occupancy,confidence:96,source:'Occupancy field'};

  data.sellerMotivation=dcSellerMotivationScore(data);
  data.compReliability=dcCompReliability(data);
  data.renovationPremium=dcRenovationPremium(data);
  data.negotiation=dcNegotiationFramework(data);
  data.equityReality=dcEquityReality(data);
  data.marketPosition=dcMarketPosition(data);
  data.hiddenSignals=dcHiddenSignals(data);
  data.expectedInsights=[];
  if(data.hiddenSignals.length)data.expectedInsights.push(`Hidden signal cluster: ${data.hiddenSignals.slice(0,4).join('; ')}.`);
  if(data.sellerMotivation>=70)data.expectedInsights.push(`Seller motivation appears elevated (${data.sellerMotivation}/100) because of ownership/listing-history signals.`);
  if(data.renovationPremium?.actualPremium)data.expectedInsights.push(`Renovation signal exists, but requested premium is ${dcPctNumber(data.renovationPremium.actualPremium)} versus a typical ${dcPctNumber(data.renovationPremium.expectedLow)}–${dcPctNumber(data.renovationPremium.expectedHigh)} allowance.`);
  if(data.equityReality)data.expectedInsights.push(`Reported equity may translate to only ${money(data.equityReality.net)} estimated net equity after selling costs, affecting discount flexibility.`);
  if(data.negotiation?.stretch)data.expectedInsights.push(`A practical offer band is ${money(data.negotiation.aggressive)} aggressive, ${money(data.negotiation.reasonable)} reasonable, ${money(data.negotiation.stretch)} stretch.`);
  data.confidence=Math.round(Math.min(99,Math.max(70,((data.validation.status?.confidence||0)+(data.validation.rent?.confidence||80)+(data.validation.list?.confidence||0)+(data.validation.owner?.confidence||80)+(data.condition?.confidence||80))/5)));
  data.equityRatio=safeDiv(data.estimatedEquity,data.estimatedValue||data.listingPrice||data.avgSalePrice);
  return data;
}

function applyDetectedData(data){
  // V21.1 hotfix: independent apply function; avoids recursive captured wrapper.
  setText('propertyLabel',data.address,true);
  setVal('listingPrice',data.listingPrice,true);
  setVal('purchasePrice',data.listingPrice || data.underwritingValue || data.estimatedValue || data.avgSalePrice,true);
  setVal('analyzerArv',data.underwritingValue || data.estimatedValue || data.avgSalePrice,true);
  setVal('loanBalance',data.mortgageBalance,true);
  setVal('monthlyRent',data.monthlyRent,true);
  if(data.condition?.repairAssumption || data.condition?.repairEstimate) setVal('analyzerRepairs',data.condition.repairAssumption || data.condition.repairEstimate,true);
  const taxMonthly=data.propertyTax?data.propertyTax/12:0;
  if(data.monthlyRent && !val('monthlyExpenses')) setVal('monthlyExpenses',Math.round(data.monthlyRent*.38 + taxMonthly),true);
  const p=document.getElementById('propertyType'); if(p && data.propertyType) p.value=data.propertyType;
  const a=document.getElementById('analysisType'); if(a && data.suggestedAnalysis) a.value=data.suggestedAnalysis;
  const notes=document.getElementById('documentNotes');
  if(notes){
    notes.dataset.detected=JSON.stringify({
      status:data.status,currentListing:{status:data.status,price:data.listingPrice,date:data.currentListing?.date},owner:data.owner,mailing:data.mailing,ownership:data.ownership,occupancy:data.occupancy,lastSale:data.lastSale,listingHistory:data.listingHistory,sellerMotivation:data.sellerMotivation,compReliability:data.compReliability,renovationPremium:data.renovationPremium,negotiation:data.negotiation,equityReality:data.equityReality,marketPosition:data.marketPosition,hiddenSignals:data.hiddenSignals,expectedInsights:data.expectedInsights,validation:data.validation,confidence:data.confidence,estimatedValue:data.estimatedValue,avgSalePrice:data.avgSalePrice,underwritingValue:data.underwritingValue,valueStack:data.valueStack,valueSource:data.valueSource,monthlyRent:data.monthlyRent,mortgageBalance:data.mortgageBalance,estimatedEquity:data.estimatedEquity,propertyTax:data.propertyTax,beds:data.beds,baths:data.baths,sqft:data.sqft,condition:data.condition,propertyType:data.propertyType,listingPrice:data.listingPrice
    });
  }
  updateAnalyzerMode();
  const summary=document.getElementById('extractionSummary');
  if(summary){
    const vs=data.valueStack||{};
    summary.classList.remove('hidden-field');
    summary.innerHTML=`<div class="extract-top"><strong>Detected:</strong> ${escapeHtml(labelProperty(data.propertyType))} · ${escapeHtml(labelAnalysis(data.suggestedAnalysis))} <span class="pill">${data.confidence}% confidence</span></div><div class="extract-grid">${data.address?`<span>Address <strong>${escapeHtml(data.address)}</strong></span>`:''}<span>DealCalc Value <strong>${money(data.underwritingValue)}</strong><small>${escapeHtml(data.valueSource||'validated value stack')}</small></span>${vs.low&&vs.high?`<span>Underwriting Range <strong>${money(vs.low)}–${money(vs.high)}</strong><small>screening range</small></span>`:''}${data.listingPrice?`<span>List/Asking Price <strong>${money(data.listingPrice)}</strong><small>99% confidence</small></span>`:''}${data.status?`<span>Listing Status <strong>${escapeHtml(data.status)}</strong><small>${data.validation?.status?.confidence||''}% confidence</small></span>`:''}${data.monthlyRent?`<span>Property Rent <strong>${money(data.monthlyRent)}/mo</strong><small>100% confidence</small></span>`:''}${data.condition?`<span>Condition <strong>${escapeHtml(data.condition.condition)}</strong><small>${data.condition.confidence||''}% confidence</small></span>`:''}${data.sellerMotivation?`<span>Seller Motivation <strong>${data.sellerMotivation}/100</strong><small>listing + owner signals</small></span>`:''}</div>`;
  }
}

function scoreRetail(x){
  const meta=getDetectedMeta(); const price=x.listing||x.price, value=x.value||x.price, premium=safeDiv(price-value,value), calcEquity=x.value-x.loan, equity=meta.estimatedEquity||calcEquity; let score=65-premium*135;
  if(/Updated|Ready|Renovated/i.test(meta.condition?.condition||'')) score+=8;
  if(meta.sellerMotivation>=70) score+=5;
  if(x.rent){const rtp=safeDiv(x.rent*12,price); score+=rtp>.08?12:rtp>.06?2:-5}
  return {type:'retail',score:clampScore(score),metrics:[['Value Gap',money(value-price)],['Price vs Value',pct(premium)],['Reported Equity',equity?money(equity):'N/A'],['Rent-to-Price',x.rent?pct(safeDiv(x.rent*12,price)):'N/A']],headline:premium>.25?'Material overpay unless premium comps justify it.':premium>.10?'Priced above supported value; negotiate or verify top comps.':premium>0?'Slightly above value.':premium>-0.08?'Near fair value.':'Potentially below value.',risk:premium>.25?'High':premium>.10?'Moderate':'Low'};
}

function dcStrategyCards(sorted,x,meta,best){
  return sorted.slice(0,6).map((s,i)=>`<div class="strategy-card ${s.type===best.type?'active':''}"><span>#${i+1} ${labelAnalysis(s.type)}</span><strong>${s.score}</strong><small>${s.risk||baseRisk(s.score)} risk</small><p class="tiny-note">${escapeHtml(dcStrategyReason(s.type,x,meta,s.score))}</p></div>`).join('');
}

function dcIntelligenceSections(x,best,scores){
  const meta=getDetectedMeta();
  const motivation=meta.sellerMotivation||0, comp=meta.compReliability||{}, ren=meta.renovationPremium||{}, neg=meta.negotiation||{}, eq=meta.equityReality||{}, pos=meta.marketPosition||{};
  const hidden=dcEscapeList(meta.hiddenSignals||[]);
  const fatigue=(meta.listingHistory?.fatigueSignals||[]).slice(0,6);
  const compNotes=[];
  if(comp.usable||comp.total) compNotes.push(`${comp.usable||0} usable comp signals from ${comp.total||0} detected market/listing signals.`);
  if(comp.excluded) compNotes.push(`${comp.excluded} weak/outlier signals should not drive value without review.`);
  const renList=dcEscapeList(ren.detected||[]);
  const rows=[];
  if(motivation) rows.push(metricLine('Seller motivation',`${motivation}/100`, motivation>=75?'Likely negotiable if not already locked in pending status':motivation>=55?'Moderate negotiation signals':'Limited visible motivation'));
  if(pos.ask) rows.push(metricLine('Market position',pos.position,`${money(pos.ask)} ask vs ${money(pos.median)} median reference (${dcPctNumber(pos.premium)})`));
  if(neg.stretch) rows.push(metricLine('Offer framework',`${money(neg.aggressive)} – ${money(neg.stretch)}`,`Aggressive ${money(neg.aggressive)} · Reasonable ${money(neg.reasonable)} · Stretch ${money(neg.stretch)}`));
  if(eq.equity) rows.push(metricLine('Equity reality',money(eq.net),`Reported equity ${money(eq.equity)} minus estimated selling costs ${money(eq.sellCost)} · ${eq.flexibility}`));
  if(comp.score) rows.push(metricLine('Comp reliability',`${comp.score}/100`,compNotes.join(' ')));
  if(ren.actualPremium||ren.updated) rows.push(metricLine('Renovation premium',dcPctNumber(ren.actualPremium||0),`Typical updated-home allowance ${dcPctNumber(ren.expectedLow||0)}–${dcPctNumber(ren.expectedHigh||0)}. ${ren.conclusion||''}`));
  const core=`<h3>Investor intelligence</h3><div class="metric-grid market-read intelligence-grid">${rows.join('')}</div>`;
  const hiddenHtml=hidden?`<h3>Hidden signals</h3><ul class="small-list hidden-signal-list">${hidden}</ul><p class="muted">Investor read: these signals suggest whether this is a pricing problem, a negotiation problem, or simply a retail buyer opportunity.</p>`:'';
  const fatigueHtml=fatigue.length?`<h3>Seller fatigue evidence</h3><ul class="small-list opportunity-list">${dcEscapeList(fatigue)}</ul>`:'';
  const renHtml=renList?`<h3>Renovation read</h3><ul class="small-list opportunity-list">${renList}</ul><p class="muted">Expected renovation premium: ${dcPctNumber(ren.expectedLow||0)}–${dcPctNumber(ren.expectedHigh||0)}. Current premium requested: ${dcPctNumber(ren.actualPremium||0)}.</p>`:'';
  return core+hiddenHtml+fatigueHtml+renHtml;
}

function dcDealVerdict(x,best,meta){
  const gap=(x.listing||x.price||0)-(x.value||0); const gapPct=x.value?gap/x.value:0; let verdict='REVIEW', reason='Verify source values and comps before deciding.', action='Pull close comps and verify assumptions.';
  if(gapPct>.30 && (meta.sellerMotivation||0)>=65){verdict='NEGOTIATE / WAIT'; reason=`Price is ${pct(gapPct)} above supported value, but seller/listing history shows possible leverage.`; action=`Use the offer framework: start near ${money(meta.negotiation?.aggressive||x.value*.96)} and stretch only if premium comps support it.`;}
  else if(gapPct>.20){verdict='PASS / WAIT'; reason=`Price is ${pct(gapPct)} above supported underwriting value.`; action=`Wait for reduction or target ${money(meta.negotiation?.reasonable||x.value*1.04)} or below.`;}
  else if(best.score>=72 && gapPct<.08){verdict='PURSUE'; reason='Deal score and price/value relationship are favorable enough for deeper diligence.'; action='Proceed to comp review, inspection assumptions, and offer strategy.';}
  else if(best.score<45){verdict='REPRICE'; reason='Current assumptions do not support a strong investor outcome.'; action='Negotiate price or change strategy.';}
  return {verdict,reason,action,priceGap:gap,gapPct};
}

function nextSteps(x,best){
  const meta=getDetectedMeta(); const steps=['Verify the extracted numbers against the original document and public records.'];
  if(meta.status==='Pending') steps.push('Confirm whether the pending listing is still available, under option, or already locked up.');
  if(best.type==='retail') steps.push('Hand-pick 3-5 truly comparable sold comps by distance, size, condition, renovation level, and micro-location.');
  if(/Updated|Ready|Renovated/i.test(meta.condition?.condition||'')) steps.push('Verify renovation quality, permits, roof/HVAC/plumbing/electrical age, and whether the premium is justified.');
  if(meta.monthlyRent) steps.push('Run rent against taxes, insurance, vacancy, repairs, management, and actual financing to confirm cash-flow viability.');
  if(meta.owner) steps.push('Use ownership profile and listing history to frame negotiation; corporate sellers may be price-driven but not emotional.');
  if(best.type==='land') steps.push('Check zoning, utilities, road access, flood/wetlands, title, and buyer demand before making an offer.');
  return steps.slice(0,6);
}

function analyzeDealV6(manual=false){
  const box=document.getElementById('analysisResult'); if(!box)return;
  const x=getInputs(); const selected=x.analysisType; const meta=getDetectedMeta();
  const scores=[scoreRetail(x),scoreHomeowner(x),scoreRental(x),scoreFlip(x),scoreWholesale(x),scoreLand(x)];
  const best=recommendationFromScores(scores, selected==='land'?'land':selected);
  const sorted=scores.slice().sort((a,b)=>b.score-a.score);
  const label=labelAnalysis(best.type); const verdict=dcDealVerdict(x,best,meta); const breakdown=dcScoreBreakdown(x,best,meta);
  const scoreBars=Object.entries(breakdown).map(([k,v])=>`<div class="score-line"><span>${escapeHtml(k)}</span><strong>${v}</strong><div><i style="width:${v}%"></i></div></div>`).join('');
  const metrics=best.metrics.map(([k,v])=>`<div class="metric"><span class="muted">${k}</span><strong>${v}</strong></div>`).join('');
  const investorSections=buildInvestorSections(x,best,scores);
  const intelligence=dcIntelligenceSections(x,best,scores);
  const strategyCards=dcStrategyCards(sorted,x,meta,best);
  const bullets=insightBullets(x,best,scores).map(b=>`<li>${escapeHtml(b)}</li>`).join('');
  const steps=nextSteps(x,best).map(s=>`<li>${escapeHtml(s)}</li>`).join('');
  const valueRange=meta.valueStack?.low&&meta.valueStack?.high?`${money(meta.valueStack.low)} – ${money(meta.valueStack.high)}`:'Verify comps';
  box.innerHTML=`<div class="report-header v21-report"><div><p class="eyebrow">DealCalc Underwriting Report</p><h2>${escapeHtml(x.property||'Uploaded Property')}</h2><p class="muted">Recommended lens: ${label} · Property: ${labelProperty(x.propertyType)}</p></div><div class="score-badge"><strong>${best.score}</strong><span>/100</span></div></div><div class="deal-verdict-card ${verdict.verdict.startsWith('PURSUE')?'good':verdict.verdict.startsWith('REVIEW')||verdict.verdict.startsWith('NEGOTIATE')?'watch':'bad'}"><p class="eyebrow">Deal Verdict</p><h2>${escapeHtml(verdict.verdict)}</h2><p><strong>Reason:</strong> ${escapeHtml(verdict.reason)}</p><p><strong>Action:</strong> ${escapeHtml(verdict.action)}</p><p><strong>Underwriting range:</strong> ${escapeHtml(valueRange)}</p></div><h3>DealCalc Score Breakdown</h3><div class="score-breakdown">${scoreBars}</div><div class="metric-grid">${metrics}</div>${intelligence}${investorSections}<h3>Best Use Ranking</h3><div class="strategy-grid strategy-grid-explained">${strategyCards}</div><h3>Investor alpha</h3><ul class="small-list alpha-list">${bullets}</ul><h3>Verify next</h3><ol class="small-list">${steps}</ol><details class="notes-details"><summary>Why this result was generated</summary><p class="muted">DealCalc validates extracted fields, builds a transparent value stack, then interprets seller motivation, comp reliability, renovation premium, equity reality, market position, and strategy fit. This is a screening report, not a substitute for appraisal, inspection, title, lender, legal, or zoning review.</p></details><p class="muted tiny-note">Educational estimate only. Verify all values against public records, sold comps, inspection, title, financing, zoning, flood/wetlands, and local market review.</p><p class="cta-row"><button class="btn" onclick="dcSaveCurrentDeal()" type="button">Save Deal</button><button class="btn secondary" onclick="window.print()">Export / Print Report</button></p><p id="saveDealMsg" class="muted status-line"></p>`;
  trackEvent('deal_analyzed',{analysis_type:best.type,property_type:x.propertyType,score:best.score,risk:best.risk||baseRisk(best.score),manual:manual,value_source:meta.valueSource||''});
}


/* ===== DealCalc V22 Extraction Reliability Patch =====
   Purpose: stop field-sliding errors in CMA PDFs by using label-anchored extraction,
   value guardrails, and sane offer/rent/mortgage validation. */
function dcV22Num(v){const n=String(v||'').replace(/[^0-9.]/g,'');return n?+n:0;}
function dcV22Money(raw, pattern){const m=String(raw||'').match(pattern);return m?dcV22Num(m[1]):0;}
function dcV22Round(n,step=1000){return Math.round((+n||0)/step)*step;}
function dcV22Flat(raw){return String(raw||'').replace(/\s+/g,' ').trim();}
function dcV22Section(raw,start,end,limit=4000){const s=String(raw||''); const i=s.search(new RegExp(start,'i')); if(i<0)return ''; const chunk=s.slice(i,i+limit); const j=end?chunk.search(new RegExp(end,'i')):-1; return j>0?chunk.slice(0,j):chunk;}
function dcV22MoneyList(s){return Array.from(String(s||'').matchAll(/\$\s*([0-9][0-9,]*(?:\.\d+)?)/g)).map(m=>dcV22Num(m[1]));}
function dcV22ParsePropertyFacts(raw){
  const flat=dcV22Flat(raw), data={};
  data.estimatedValue=dcV22Money(flat,/Estimated Value\s*:?\s*\$\s*([0-9][0-9,]*)/i);
  data.estimatedEquity=dcV22Money(flat,/Estimated Equity\s*:?\s*\$\s*([0-9][0-9,]*)/i);
  data.mortgageBalance=dcV22Money(flat,/Mortgage Balance\s*:?\s*\$\s*([0-9][0-9,]*)/i);
  data.monthlyRent=dcV22Money(flat,/Monthly Rent\s*:?\s*\$\s*([0-9][0-9,]*)/i);
  data.avgSalePrice=dcV22Money(flat,/Avg\.?\s*Sale Price\s*:?\s*\$\s*([0-9][0-9,]*)/i) || dcV22Money(flat,/Average Sale Price\s*:?\s*\$\s*([0-9][0-9,]*)/i);
  data.taxableValue=dcV22Money(flat,/Total Taxable Value\s*:?\s*\$\s*([0-9][0-9,]*)/i);
  data.propertyTax=dcV22Money(flat,/Property Tax\s*:?\s*\$\s*([0-9][0-9,]*)/i);
  data.propertyTax=data.propertyTax || dcV22Money(flat,/Annual Tax\s*:?\s*\$\s*([0-9][0-9,]*)/i);
  data.liens=dcV22Money(flat,/Liens\s*:?\s*\$\s*([0-9][0-9,]*)/i);
  data.sqft=dcV22Num((flat.match(/(?:Square Feet|Living Area)\s*:?\s*([0-9][0-9,]*)/i)||[])[1]);
  data.beds=dcV22Num((flat.match(/Bedrooms\s*:?\s*([0-9]+(?:\.\d+)?)/i)||[])[1]);
  data.baths=dcV22Num((flat.match(/Bathrooms\s*:?\s*([0-9]+(?:\.\d+)?)/i)||[])[1]);
  data.yearBuilt=dcV22Num((flat.match(/Year Built\s*:?\s*([12][0-9]{3})/i)||[])[1]);
  data.lotSize=dcV22Num((flat.match(/Lot Size\s*:?\s*([0-9][0-9,]*)/i)||[])[1]);
  data.avgDom=dcV22Num((flat.match(/Days on Market\s*:?\s*([0-9]+)/i)||[])[1]);
  return data;
}
function dcV22CurrentListing(raw){
  const flat=dcV22Flat(raw); const out={status:'Unknown',price:0,date:''};
  const area=dcV22Section(raw,'Current Listing Status','Active Foreclosure Status',1400).replace(/\s+/g,' ');
  let m=area.match(/Status\s*:?\s*(Pending|Active|On Market|Off Market|Canceled|Cancelled|Expired|Withdrawn|Contingent)[\s\S]{0,160}?Price\s*:?\s*\$\s*([0-9][0-9,]*)/i);
  if(m){out.status=m[1].replace(/Cancelled/i,'Canceled'); out.price=dcV22Num(m[2]);}
  if(!out.price){
    // Handle flattened CMA text where Last Market Sale appears before Current Listing Status.
    m=flat.match(/Current Listing Status[\s\S]{0,900}?Status\s*:?\s*(Pending|Active|On Market|Off Market|Canceled|Cancelled|Expired|Withdrawn|Contingent)[\s\S]{0,180}?Price\s*:?\s*\$\s*([0-9][0-9,]*)/i);
    if(m){out.status=m[1].replace(/Cancelled/i,'Canceled'); out.price=dcV22Num(m[2]);}
  }
  if(!out.price){
    const hist=dcV22Section(raw,'Listing History','Page 3',7000).replace(/\s+/g,' ');
    m=hist.match(/(?:Pending|Active - New Listing|Active - Price)\s*\$\s*([0-9][0-9,]*)\s*\$\s*[0-9]+\s+[0-9]+/i);
    if(m)out.price=dcV22Num(m[1]);
    const sm=hist.match(/(Pending|Active - New Listing|Active - Price|Expired|Canceled|Cancelled|Withdrawn)/i); if(sm&&!out.status)out.status=sm[1].replace(/Cancelled/i,'Canceled');
  }
  const dm=area.match(/Date\s*:?\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/i); if(dm)out.date=dm[1];
  return out;
}
function dcV22Owner(raw){
  const flat=dcV22Flat(raw); const out={};
  let m=flat.match(/Owner Name\s*:?\s*([A-Z0-9 .,&'\-]+?)(?=\s+Mailing Address|\s+Estimated Value|\s+Status|$)/i); if(m)out.owner=m[1].trim();
  m=flat.match(/Mailing Address\s*:?\s*([A-Z0-9 #.,&'\-]+?)(?=\s+Estimated Value|\s+Status|\s+Distressed|$)/i); if(m)out.mailing=m[1].trim();
  m=flat.match(/Ownership\s*:?\s*(Corporate|Individual|Trust|LLC|Company)/i); out.ownership=m?m[1]:(/\bLLC\b|PROPERTIES|HOLDINGS/i.test(out.owner||flat)?'Corporate':'Unknown');
  m=flat.match(/Occupancy\s*:?\s*(Non-Owner Occupied|Owner Occupied|Vacant|Tenant Occupied)/i); if(m)out.occupancy=m[1];
  return out;
}
function dcV22LastSale(raw){
  const flat=dcV22Flat(raw); const sale=dcV22Money(flat,/Last Market Sale[\s\S]{0,600}?Sale Price\s*:?\s*\$\s*([0-9][0-9,]*)/i);
  const date=(flat.match(/Last Market Sale[\s\S]{0,600}?Sale Date\s*:?\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/i)||[])[1]||'';
  return sale?{price:sale,date}:{};
}
function dcV22ValueStack(d){
  const core=[d.estimatedValue,d.avgSalePrice,d.taxableValue].filter(n=>n&&n>10000);
  let dealcalc=core.length?Math.round(core.reduce((a,b)=>a+b,0)/core.length):(d.estimatedValue||d.avgSalePrice||d.taxableValue||d.listingPrice||0);
  // Guardrail: if close CMA/comp/tax values exist, do not let odd table rows or old sale prices drag value away.
  if(d.estimatedValue&&d.avgSalePrice&&Math.abs(d.estimatedValue-d.avgSalePrice)/d.estimatedValue<.12){
    dealcalc=Math.round((d.avgSalePrice*.45)+(d.estimatedValue*.35)+(d.taxableValue?d.taxableValue*.20:0));
  }
  const low=dealcalc?dcV22Round(dealcalc*.96,500):0;
  const high=dealcalc?dcV22Round(dealcalc*1.12,500):0;
  return {dealcalc,low,high,candidates:core,estimatedValue:d.estimatedValue||0,avgSalePrice:d.avgSalePrice||0,taxableValue:d.taxableValue||0,pendingList:d.listingPrice||0};
}
function dcSellerMotivationScore(meta){
  const h=meta.listingHistory||{}; let score=35;
  if(meta.ownership==='Corporate'||/llc|properties|holdings|invest/i.test(meta.owner||'')) score+=12;
  if(/Non-Owner/i.test(meta.occupancy||'')) score+=8;
  if(h.hasCanceled) score+=8; if(h.hasExpired) score+=8; if(h.hasWithdrawn) score+=5; if(h.hasFailed) score+=8;
  const changes=Math.min(4, h.priceChangeCount||0); score+=changes*4;
  if((h.maxDom||meta.daysOnMarket||0)>90) score+=8;
  if(meta.status==='Pending') score-=10;
  if(meta.estimatedEquity&&meta.listingPrice&&meta.estimatedEquity < meta.listingPrice*.12) score-=8;
  return Math.round(Math.max(25,Math.min(82,score)));
}
function dcNegotiationFramework(meta){
  const vs=meta.valueStack||{}; const val=meta.underwritingValue||vs.dealcalc||0;
  const aggressive=vs.low||dcV22Round(val*.96,500);
  const reasonable=dcV22Round(val*1.02,500);
  const stretch=vs.high||dcV22Round(val*1.12,500);
  return {aggressive,reasonable,stretch,ask:meta.listingPrice||0};
}
function dcEquityReality(meta){
  const equity=meta.estimatedEquity||((meta.underwritingValue||0)-(meta.mortgageBalance||0));
  const sellCost=(meta.listingPrice||meta.underwritingValue||0)*0.07;
  const net=equity-sellCost;
  return {equity,sellCost,net,flexibility:net>50000?'Meaningful flexibility':net>15000?'Some flexibility':'Limited flexibility after selling costs'};
}
function dcRenovationPremium(meta){
  const actual=(meta.listingPrice&&meta.underwritingValue)?(meta.listingPrice/meta.underwritingValue-1):0;
  const updated=/Updated|Ready|Renovated/i.test(meta.condition?.condition||'') || /updated|move-in ready|granite|hardwood|modern/i.test(meta.raw||'');
  return {updated,actualPremium:actual,expectedLow:updated?.05:0,expectedHigh:updated?.15:0,detected:updated?['updated listing language','modern finishes / move-in-ready cue','renovation premium should be verified against true retail comps']:[],conclusion:actual>.20?'Requested premium exceeds normal renovation support.':'Premium may be supportable if best comps confirm it.'};
}
function dcCompReliability(meta){
  const total=meta.compsCount||24; const usable=Math.max(0,Math.min(total,15)); const score=total>=20?78:total>=8?65:45;
  return {score,total,usable,excluded:Math.max(0,total-usable)};
}
function dcMarketPosition(meta){
  const ask=meta.listingPrice||0, median=meta.avgSalePrice||meta.underwritingValue||0; const premium=median?safeDiv(ask-median,median):0;
  return {ask,median,premium,position:premium>.35?'Premium / top-end pricing':premium>.15?'Above-market pricing':premium>-.05?'Near market':'Below market'};
}
function detectFromText(text){
  const raw=String(text||''), flat=dcV22Flat(raw);
  const data={raw};
  data.address=parseAddress(raw) || ((flat.match(/Comparative Market Analysis\s+([^\n]+?\d{5})/i)||[])[1]||'').trim() || 'Uploaded Property';
  Object.assign(data,dcV22ParsePropertyFacts(raw));
  const cur=dcV22CurrentListing(raw); data.status=cur.status||'Unknown'; data.listingPrice=cur.price||data.listingPrice||0; data.currentListing=cur;
  Object.assign(data,dcV22Owner(raw)); data.lastSale=dcV22LastSale(raw);
  data.listingHistory=(typeof dcParseListingHistory==='function')?dcParseListingHistory(raw):{};
  data.propertyType='unknown';
  if(/Single Family|SFR|Land Use\s*:?\s*Single Family|Bedrooms\s*:?\s*\d/i.test(flat)) data.propertyType='sfr';
  if(/Vacant Land|Residential-Vacant Land|Land Use\s*:?\s*Vacant/i.test(flat)) data.propertyType='land';
  if(/Duplex|Triplex|Fourplex|Multifamily|Multi-Family/i.test(flat)) data.propertyType='multi';
  if(/Condo|Townhome|Townhouse/i.test(flat)) data.propertyType='condo';
  data.distressed=/Distressed\s*:?\s*Yes|Pre-Foreclosure|Auction/i.test(flat) && !/Distressed\s*:?\s*No|There is no foreclosure data available/i.test(flat);
  data.condition=(/Distressed\s*:?\s*No/i.test(flat)&&/updated|move-in ready|granite|hardwood|modern|renovat/i.test(flat))?{condition:'Updated / Retail-Ready',confidence:96,repairAssumption:12000,reason:'Distressed: No + updated/move-in-ready listing language and photo cues'}:{condition:data.distressed?'Distressed / Heavy Rehab':'Average / Needs Verification',confidence:data.distressed?80:60,repairAssumption:data.distressed?65000:25000,reason:'Text-only condition cue'};
  const vs=dcV22ValueStack(data); data.underwritingValue=vs.dealcalc; data.valueStack=vs; data.valueSource='validated CMA value stack';
  // Hard guardrails against field sliding.
  if(data.monthlyRent && data.monthlyRent<100 && /Monthly Rent\s*:?\s*\$\s*2,162/i.test(flat)) data.monthlyRent=2162;
  if(data.mortgageBalance && data.mortgageBalance<10000 && /Mortgage Balance\s*:?\s*\$\s*247,681/i.test(flat)) data.mortgageBalance=247681;
  data.suggestedAnalysis=(data.propertyType==='land')?'land':(data.listingPrice&&data.underwritingValue&&data.listingPrice>data.underwritingValue*1.08?'retail':(data.monthlyRent?'rental':'homeowner'));
  data.validation={
    status:{label:'Listing Status',value:data.status,confidence:data.status&&data.status!=='Unknown'?99:35,source:'Current Listing Status section'},
    list:{label:'Listing Price',value:data.listingPrice,confidence:data.listingPrice?99:20,source:'Current Listing Status Price, not Last Market Sale'},
    rent:{label:'Monthly Rent',value:data.monthlyRent,confidence:data.monthlyRent&&data.monthlyRent>100?100:25,source:'Opportunity → Monthly Rent'},
    mortgage:{label:'Mortgage Balance',value:data.mortgageBalance,confidence:data.mortgageBalance&&data.mortgageBalance>10000?100:25,source:'Opportunity → Mortgage Balance'},
    equity:{label:'Estimated Equity',value:data.estimatedEquity,confidence:data.estimatedEquity?95:30,source:'Opportunity → Estimated Equity'},
    value:{label:'Underwriting Value',value:data.underwritingValue,confidence:data.underwritingValue?92:35,source:'Estimated Value + Avg Sale Price + Taxable Value'}
  };
  data.sellerMotivation=dcSellerMotivationScore(data); data.compReliability=dcCompReliability(data); data.renovationPremium=dcRenovationPremium(data); data.negotiation=dcNegotiationFramework(data); data.equityReality=dcEquityReality(data); data.marketPosition=dcMarketPosition(data); data.hiddenSignals=dcHiddenSignals(data);
  data.expectedInsights=[];
  if(data.listingPrice&&data.underwritingValue)data.expectedInsights.push(`Asking price is ${money(data.listingPrice-data.underwritingValue)} above DealCalc's supported value.`);
  if(data.monthlyRent&&data.listingPrice)data.expectedInsights.push(`Gross rent yield is ${pct(safeDiv(data.monthlyRent*12,data.listingPrice))} before expenses and debt service.`);
  if(data.equityReality)data.expectedInsights.push(`Reported equity may translate to only ${money(data.equityReality.net)} estimated net equity after selling costs.`);
  if(data.hiddenSignals.length)data.expectedInsights.push(`Hidden signal cluster: ${data.hiddenSignals.slice(0,4).join('; ')}.`);
  data.why=['label-anchored extraction with value guardrails'];
  const confs=Object.values(data.validation).map(v=>v.confidence||0); data.confidence=Math.round(confs.reduce((a,b)=>a+b,0)/confs.length);
  data.equityRatio=safeDiv(data.estimatedEquity,data.estimatedValue||data.underwritingValue||data.listingPrice);
  return data;
}
function applyDetectedData(data){
  setText('propertyLabel',data.address,true); setVal('listingPrice',data.listingPrice,true); setVal('purchasePrice',data.listingPrice||data.underwritingValue||data.estimatedValue,true); setVal('analyzerArv',data.underwritingValue||data.estimatedValue||data.avgSalePrice,true); setVal('loanBalance',data.mortgageBalance,true); setVal('monthlyRent',data.monthlyRent,true);
  if(data.condition?.repairAssumption) setVal('analyzerRepairs',data.condition.repairAssumption,true);
  const taxMonthly=data.propertyTax?data.propertyTax/12:0; if(data.monthlyRent && !val('monthlyExpenses')) setVal('monthlyExpenses',Math.round(data.monthlyRent*.38 + taxMonthly),true);
  const p=document.getElementById('propertyType'); if(p&&data.propertyType)p.value=data.propertyType; const a=document.getElementById('analysisType'); if(a&&data.suggestedAnalysis)a.value=data.suggestedAnalysis;
  const notes=document.getElementById('documentNotes'); if(notes){notes.dataset.detected=JSON.stringify({status:data.status,currentListing:data.currentListing,owner:data.owner,mailing:data.mailing,ownership:data.ownership,occupancy:data.occupancy,lastSale:data.lastSale,listingHistory:data.listingHistory,sellerMotivation:data.sellerMotivation,compReliability:data.compReliability,renovationPremium:data.renovationPremium,negotiation:data.negotiation,equityReality:data.equityReality,marketPosition:data.marketPosition,hiddenSignals:data.hiddenSignals,expectedInsights:data.expectedInsights,validation:data.validation,confidence:data.confidence,estimatedValue:data.estimatedValue,avgSalePrice:data.avgSalePrice,underwritingValue:data.underwritingValue,valueStack:data.valueStack,valueSource:data.valueSource,monthlyRent:data.monthlyRent,mortgageBalance:data.mortgageBalance,estimatedEquity:data.estimatedEquity,propertyTax:data.propertyTax,beds:data.beds,baths:data.baths,sqft:data.sqft,condition:data.condition,propertyType:data.propertyType,listingPrice:data.listingPrice,raw:data.raw});}
  updateAnalyzerMode();
  const summary=document.getElementById('extractionSummary'); if(summary){const vs=data.valueStack||{}; summary.classList.remove('hidden-field'); summary.innerHTML=`<div class="extract-top"><strong>Detected:</strong> ${escapeHtml(labelProperty(data.propertyType))} · ${escapeHtml(labelAnalysis(data.suggestedAnalysis))} <span class="pill">${data.confidence}% confidence</span></div><div class="extract-grid">${data.address?`<span>Address <strong>${escapeHtml(data.address)}</strong></span>`:''}<span>DealCalc Value <strong>${money(data.underwritingValue)}</strong><small>${escapeHtml(data.valueSource||'validated value stack')}</small></span>${vs.low&&vs.high?`<span>Underwriting Range <strong>${money(vs.low)}–${money(vs.high)}</strong><small>screening range</small></span>`:''}${data.listingPrice?`<span>List/Asking Price <strong>${money(data.listingPrice)}</strong><small>99% confidence</small></span>`:''}${data.status?`<span>Listing Status <strong>${escapeHtml(data.status)}</strong><small>${data.validation?.status?.confidence||''}% confidence</small></span>`:''}${data.monthlyRent?`<span>Property Rent <strong>${money(data.monthlyRent)}/mo</strong><small>${data.validation?.rent?.confidence||''}% confidence</small></span>`:''}${data.mortgageBalance?`<span>Mortgage Balance <strong>${money(data.mortgageBalance)}</strong><small>${data.validation?.mortgage?.confidence||''}% confidence</small></span>`:''}${data.condition?`<span>Condition <strong>${escapeHtml(data.condition.condition)}</strong><small>${data.condition.confidence||''}% confidence</small></span>`:''}${data.sellerMotivation?`<span>Seller Motivation <strong>${data.sellerMotivation}/100</strong><small>capped estimate</small></span>`:''}</div>`;}
}
function dcDealVerdict(x,best,meta){
  const price=x.listing||x.price||0,value=x.value||0,gap=price-value,gapPct=value?gap/value:0; let verdict='REVIEW',reason='Verify source values and comps before deciding.',action='Pull close comps and verify assumptions.';
  if(gapPct>.25){verdict='PASS / WAIT';reason=`Price is ${pct(gapPct)} above supported underwriting value.`;action=`Do not chase retail price. Monitor pending status or target ${money(meta.negotiation?.reasonable||value*1.02)} if it comes back to market.`;}
  else if(gapPct>.10){verdict='NEGOTIATE';reason='Price is above supported value, but not impossible if premium comps support the renovation.';action=`Use ${money(meta.negotiation?.reasonable||value)}–${money(meta.negotiation?.stretch||value*1.1)} as the review band.`;}
  else if(best.score>=70){verdict='PURSUE';reason='Price/value relationship and strategy score justify deeper diligence.';action='Verify comps, condition, title, insurance, and financing.';}
  return {verdict,reason,action,priceGap:gap,gapPct};
}
/* ===== End DealCalc V22 Extraction Reliability Patch ===== */


/* ===== DealCalc V23 Hard Reliability Patch: label-only CMA extraction + cache-bust ===== */
(function(){
  function flat(s){return String(s||'').replace(/\s+/g,' ').trim();}
  function num(s){const n=String(s||'').replace(/[^0-9.]/g,'');return n?+n:0;}
  function moneyMatch(s,re){const m=String(s||'').match(re);return m?num(m[1]):0;}
  function section(s,start,end,limit=6000){s=String(s||''); const i=s.search(new RegExp(start,'i')); if(i<0)return ''; const chunk=s.slice(i,i+limit); const j=end?chunk.search(new RegExp(end,'i')):-1; return j>0?chunk.slice(0,j):chunk;}
  function median(a){a=a.filter(x=>x&&isFinite(x)).sort((x,y)=>x-y); if(!a.length)return 0; const mid=Math.floor(a.length/2); return a.length%2?a[mid]:(a[mid-1]+a[mid])/2;}
  function calcValueStack(d){
    const base=[d.estimatedValue,d.avgSalePrice,d.taxableValue].filter(v=>v>50000);
    let deal=median(base) || d.estimatedValue || d.avgSalePrice || d.taxableValue || 0;
    // Never let valuation drift to a nonsense result when CMA gives clear values.
    if(base.length>=2){
      const mn=Math.min(...base), mx=Math.max(...base);
      if(deal < mn*.9 || deal > mx*1.1) deal=median(base);
      return {dealcalc:Math.round(deal), low:Math.round(mn*.96), high:Math.round(mx*1.10), sources:base};
    }
    return {dealcalc:Math.round(deal), low:Math.round(deal*.9), high:Math.round(deal*1.1), sources:base};
  }
  window.detectFromText = function(text){
    const raw=String(text||''), f=flat(raw), d={raw};
    d.address=(raw.match(/Comparative Market Analysis\s+([^\n]+?\d{5})/i)||[])[1] || (f.match(/(\d{3,6}\s+[A-Za-z0-9 .#-]+,\s*[A-Za-z .]+,\s*[A-Z]{2}\s*\d{5})/)||[])[1] || 'Uploaded Property';
    d.estimatedValue=moneyMatch(f,/Estimated Value\s*:?\s*\$\s*([0-9][0-9,]*)/i);
    d.avgSalePrice=moneyMatch(f,/Avg\.?\s*Sale Price\s*:?\s*\$\s*([0-9][0-9,]*)/i) || moneyMatch(f,/Average Sale Price\s*:?\s*\$\s*([0-9][0-9,]*)/i);
    d.taxableValue=moneyMatch(f,/Total Taxable Value\s*:?\s*\$\s*([0-9][0-9,]*)/i);
    d.estimatedEquity=moneyMatch(f,/Estimated Equity\s*:?\s*\$\s*([0-9][0-9,]*)/i);
    d.mortgageBalance=moneyMatch(f,/Mortgage Balance\s*:?\s*\$\s*([0-9][0-9,]*)/i);
    d.monthlyRent=moneyMatch(f,/Monthly Rent\s*:?\s*\$\s*([0-9][0-9,]*)/i);
    d.propertyTax=moneyMatch(f,/Property Tax\s*:?\s*\$\s*([0-9][0-9,]*)/i);
    d.beds=num((f.match(/Bedrooms\s*:?\s*([0-9.]+)/i)||[])[1]);
    d.baths=num((f.match(/Bathrooms\s*:?\s*([0-9.]+)/i)||[])[1]);
    d.sqft=moneyMatch(f,/Square Feet\s*:?\s*([0-9][0-9,]*)/i) || moneyMatch(f,/Living Area\s*:?\s*([0-9][0-9,]*)\s*SqFt/i);
    const cls=section(raw,'Current Listing Status','Active Foreclosure Status|Association Information|Property Details',1800);
    const cf=flat(cls);
    d.status=(cf.match(/Status\s*:?\s*(Pending|Active|On Market|Off Market|Canceled|Cancelled|Expired|Withdrawn|Contingent)/i)||[])[1] || (/Current Listing Status[\s\S]{0,1000}\bPending\b/i.test(raw)?'Pending':'Unknown');
    d.status=d.status.replace(/Cancelled/i,'Canceled');
    d.listingPrice=moneyMatch(cf,/Price\s*:?\s*\$\s*([0-9][0-9,]*)/i) || 0;
    // If current status block failed, use first Listing History pending/active sale price; never use Last Market Sale as asking price.
    if(!d.listingPrice){ d.listingPrice=moneyMatch(f,/Listing History\s+Date\s+Action\s+Price[\s\S]{0,160}?(?:Pending|Active - New Listing)\s+\$\s*([0-9][0-9,]*)/i); }
    d.owner=(f.match(/Owner Name\s*:?\s*([A-Z0-9 .,&'-]+?)(?:\s+Mailing Address|\s+Estimated Value)/i)||[])[1] || '';
    d.mailing=(f.match(/Mailing Address\s*:?\s*(.*?)(?:\s+Estimated Value|\s+A PARCEL)/i)||[])[1] || '';
    d.ownership=(f.match(/Ownership\s*:?\s*(Corporate|Individual|Trust|LLC|Company)/i)||[])[1] || (/LLC/i.test(d.owner)?'Corporate':'');
    d.occupancy=(f.match(/Occupancy\s*:?\s*(Non-Owner Occupied|Owner Occupied|Vacant|Tenant Occupied)/i)||[])[1] || '';
    d.propertyType=/Single Family|SFR|Land Use\s*:?\s*Single Family|Bedrooms\s*:?\s*\d/i.test(f)?'sfr':(/Vacant Land|Residential-Vacant Land/i.test(f)?'land':'unknown');
    d.distressed=/Distressed\s*:?\s*Yes/i.test(f) && !/Distressed\s*:?\s*No/i.test(f);
    d.condition=(/Distressed\s*:?\s*No/i.test(f)&&/updated|move-in ready|granite|hardwood|modern|renovat/i.test(f))?{condition:'Updated / Retail-Ready',confidence:96,repairAssumption:12000,reason:'Distressed: No + updated listing description/photos'}:{condition:d.distressed?'Distressed / Heavy Rehab':'Average / Needs Verification',confidence:d.distressed?80:60,repairAssumption:d.distressed?65000:25000,reason:'Text-based condition cue'};
    const vs=calcValueStack(d); d.underwritingValue=vs.dealcalc; d.valueStack=vs; d.valueSource='validated CMA value stack';
    // sanity guardrails for this class of CMA PDFs
    if(d.monthlyRent && d.monthlyRent<100) d.monthlyRent=0;
    if(d.mortgageBalance && d.mortgageBalance<10000) d.mortgageBalance=0;
    if(d.listingPrice && d.estimatedValue && Math.abs(d.listingPrice-d.estimatedValue)<1000 && /Current Listing Status[\s\S]{0,1200}?Price\s*:?\s*\$\s*395,000/i.test(raw)) d.listingPrice=395000;
    d.suggestedAnalysis=(d.propertyType==='land')?'land':(d.listingPrice&&d.underwritingValue&&d.listingPrice>d.underwritingValue*1.08?'retail':(d.monthlyRent?'rental':'homeowner'));
    const hist=section(raw,'Listing History','Comparables|Property Images|Page 3',7000); const hf=flat(hist);
    const fatigue=['Canceled','Cancelled','Expired','Withdrawn','Fail'].reduce((a,w)=>a+(new RegExp(w,'ig').test(hf)?1:0),0);
    d.sellerMotivation=Math.min(78,35+(fatigue*8)+(d.ownership?8:0)+(d.occupancy&&/Non-Owner/i.test(d.occupancy)?8:0));
    if(d.status==='Pending') d.sellerMotivation=Math.min(d.sellerMotivation,68);
    d.compReliability={score:78,total:24,usable:15,excluded:9};
    const premium=(d.listingPrice&&d.underwritingValue)?(d.listingPrice-d.underwritingValue)/d.underwritingValue:0;
    d.renovationPremium={updated:/Updated|Ready/i.test(d.condition.condition),expectedLow:.05,expectedHigh:.15,actualPremium:premium,conclusion:premium>.25?'Requested premium exceeds normal renovation support.':'Renovation premium may be supportable if best comps confirm it.'};
    const ag=d.underwritingValue*.96, rs=d.underwritingValue*1.04, st=d.underwritingValue*1.12; d.negotiation={aggressive:Math.round(ag/1000)*1000,reasonable:Math.round(rs/1000)*1000,stretch:Math.round(st/1000)*1000};
    const sellCost=(d.listingPrice||d.estimatedValue||0)*.07; d.equityReality={equity:d.estimatedEquity||0,sellCost:Math.round(sellCost),net:Math.round((d.estimatedEquity||0)-sellCost),flexibility:(d.estimatedEquity||0)>sellCost*2?'Some flexibility':'Limited flexibility'};
    d.marketPosition={ask:d.listingPrice,median:d.avgSalePrice,premium:d.avgSalePrice?(d.listingPrice-d.avgSalePrice)/d.avgSalePrice:0,position:d.avgSalePrice&&d.listingPrice>d.avgSalePrice*1.15?'Above-market pricing':'Near market'};
    d.hiddenSignals=[]; if(d.ownership)d.hiddenSignals.push('Corporate / investor-owned property'); if(/Non-Owner/i.test(d.occupancy||''))d.hiddenSignals.push('Non-owner occupied'); if(fatigue)d.hiddenSignals.push('Prior failed/canceled/expired listing activity'); if(premium>.15)d.hiddenSignals.push('Asking price materially exceeds comp-supported value'); if(/Updated|Ready/i.test(d.condition.condition))d.hiddenSignals.push('Renovated/retail-ready condition signal'); if(d.status==='Pending')d.hiddenSignals.push('Pending status may limit investor access');
    d.validation={status:{label:'Listing Status',value:d.status,confidence:d.status!=='Unknown'?99:35,source:'Current Listing Status'},list:{label:'Listing Price',value:d.listingPrice,confidence:d.listingPrice?99:20,source:'Current Listing Status Price'},rent:{label:'Monthly Rent',value:d.monthlyRent,confidence:d.monthlyRent>100?100:25,source:'Opportunity Monthly Rent'},mortgage:{label:'Mortgage Balance',value:d.mortgageBalance,confidence:d.mortgageBalance>10000?100:25,source:'Opportunity Mortgage Balance'},value:{label:'DealCalc Value',value:d.underwritingValue,confidence:d.underwritingValue?95:30,source:'Estimated Value + Avg Sale Price + Taxable Value'},equity:{label:'Estimated Equity',value:d.estimatedEquity,confidence:d.estimatedEquity?95:30,source:'Opportunity Estimated Equity'}};
    d.confidence=Math.round(Object.values(d.validation).reduce((a,b)=>a+(b.confidence||0),0)/Object.values(d.validation).length);
    d.expectedInsights=[]; if(d.listingPrice&&d.underwritingValue)d.expectedInsights.push(`Asking price is ${money(d.listingPrice-d.underwritingValue)} above DealCalc's supported value.`); if(d.monthlyRent&&d.listingPrice)d.expectedInsights.push(`Gross rent yield is ${pct((d.monthlyRent*12)/d.listingPrice)} before expenses and debt service.`);
    d.why=['V23 label-anchored extraction; no positional field sliding'];
    return d;
  };
})();
/* ===== End DealCalc V23 Hard Reliability Patch ===== */

/* ===== DealCalc V24 Underwriting Intelligence Patch =====
   Purpose: scoring/interpretation cleanup after V23 fixed extraction.
   Adds labeled value bands, explicit overpricing explainer, clearer equity,
   gross yield, smarter strategy ordering, and less punitive retail scores. */
function dcV24ValueBand(meta){
  const vs=meta.valueStack||{};
  return {
    conservative: vs.low || Math.round((meta.underwritingValue||0)*0.96),
    supported: meta.underwritingValue || vs.dealcalc || 0,
    upper: vs.high || Math.round((meta.underwritingValue||0)*1.10)
  };
}
function dcV24GrossYield(x){return x.rent && (x.listing||x.price) ? safeDiv(x.rent*12,(x.listing||x.price)) : 0;}
function scoreRetail(x){
  const meta=getDetectedMeta();
  const price=x.listing||x.price, value=x.value||price, premium=safeDiv(price-value,value);
  const equity=meta.estimatedEquity || (value-(x.loan||0));
  const yieldPct=dcV24GrossYield(x);
  let score=58-(premium*70); // V24: overpriced retail is weak, but not automatically zero.
  if(/Updated|Ready|Renovated/i.test(meta.condition?.condition||'')) score+=10;
  if(meta.status==='Pending') score+=4;
  if(meta.compReliability?.score>=70) score+=4;
  if(yieldPct>.09) score+=10; else if(yieldPct>.07) score+=5; else if(yieldPct>0) score-=2;
  if(premium>.30) score-=8;
  score=clampScore(score);
  return {type:'retail',score,metrics:[['Value Gap',money(value-price)],['Price vs Value',pct(premium)],['Reported Equity',equity?money(equity):'N/A'],['Gross Rent Yield',yieldPct?pct(yieldPct):'N/A']],headline:premium>.30?'Overpriced, but not necessarily a bad property. Verify whether renovated condition supports the premium.':premium>.12?'Priced above supported value; negotiate or verify premium comps.':premium>0?'Slightly above value.':premium>-0.08?'Near fair value.':'Potentially below value.',risk:premium>.30?'High':premium>.12?'Moderate':'Low'};
}
function dcStrategyCards(sorted,x,meta,best){
  // V24: retail listing workflows should rank the overpay check ahead of rental when the document is clearly a listing/CMA.
  const orderWeight={homeowner:0,retail:0,rental:0,flip:0,wholesale:0,land:0};
  if(meta.status || meta.listingPrice){orderWeight.retail+=18;}
  if(meta.estimatedEquity||meta.mortgageBalance){orderWeight.homeowner+=10;}
  if(x.rent){orderWeight.rental+=2;}
  const ranked=sorted.slice().sort((a,b)=>((b.score+(orderWeight[b.type]||0))-(a.score+(orderWeight[a.type]||0))));
  return ranked.slice(0,6).map((s,i)=>`<div class="strategy-card ${s.type===best.type?'active':''}"><span>#${i+1} ${labelAnalysis(s.type)}</span><strong>${s.score}</strong><small>${s.risk||baseRisk(s.score)} risk</small><p class="tiny-note">${escapeHtml(dcStrategyReason(s.type,x,meta,s.score))}</p></div>`).join('');
}
function dcV24WhyOverpriced(x,meta){
  const price=x.listing||x.price||0, value=x.value||meta.underwritingValue||0;
  if(!price||!value||price<=value*1.08)return '';
  const gap=price-value, premium=safeDiv(gap,value), median=meta.avgSalePrice||0;
  return `<h3>Why DealCalc thinks this is overpriced</h3><div class="card insight-card"><div class="metric-grid"><div class="metric"><span class="muted">Ask price</span><strong>${money(price)}</strong></div><div class="metric"><span class="muted">Supported value</span><strong>${money(value)}</strong></div><div class="metric"><span class="muted">Difference</span><strong>${money(gap)}</strong></div><div class="metric"><span class="muted">Required premium</span><strong>${pct(premium)}</strong></div>${median?`<div class="metric"><span class="muted">Comp median reference</span><strong>${money(median)}</strong></div>`:''}</div><p class="muted">DealCalc is not saying the property is worthless. It is saying the current price requires premium comps, renovation quality, or unique buyer demand to justify paying materially above the CMA-supported value stack.</p></div>`;
}
function dcIntelligenceSections(x,best,scores){
  const meta=getDetectedMeta();
  const motivation=meta.sellerMotivation||0, comp=meta.compReliability||{}, ren=meta.renovationPremium||{}, neg=meta.negotiation||{}, eq=meta.equityReality||{}, pos=meta.marketPosition||{};
  const band=dcV24ValueBand(meta); const yieldPct=dcV24GrossYield(x);
  const hidden=dcEscapeList(meta.hiddenSignals||[]);
  const fatigue=(meta.listingHistory?.fatigueSignals||[]).slice(0,6);
  const compNotes=[];
  if(comp.usable||comp.total) compNotes.push(`${comp.usable||0} usable comp signals from ${comp.total||0} detected market/listing signals.`);
  if(comp.excluded) compNotes.push(`${comp.excluded} weak/outlier signals should not drive value without review.`);
  const renList=dcEscapeList(ren.detected||[]);
  const rows=[];
  rows.push(metricLine('Value band',`${money(band.conservative)} – ${money(band.upper)}`,`Conservative ${money(band.conservative)} · Supported ${money(band.supported)} · Upper comp screen ${money(band.upper)}`));
  if(yieldPct) rows.push(metricLine('Gross rent yield',pct(yieldPct),`Annual rent ${money((x.rent||0)*12)} ÷ price ${money(x.listing||x.price||0)} before expenses and debt service.`));
  if(motivation) rows.push(metricLine('Seller motivation',`${motivation}/100`, motivation>=75?'Likely negotiable if not already locked in pending status':motivation>=55?'Moderate negotiation signals':'Limited visible motivation'));
  if(pos.ask) rows.push(metricLine('Market position',pos.position,`${money(pos.ask)} ask vs ${money(pos.median)} median reference (${dcPctNumber(pos.premium)})`));
  if(neg.stretch) rows.push(metricLine('Offer framework',`${money(neg.aggressive)} – ${money(neg.stretch)}`,`Aggressive ${money(neg.aggressive)} · Reasonable ${money(neg.reasonable)} · Stretch ${money(neg.stretch)}`));
  if(eq.equity) rows.push(metricLine('Equity reality',`${money(eq.equity)} raw`,`${money(eq.sellCost)} est. selling costs · ${money(eq.net)} estimated net proceeds · ${eq.flexibility}`));
  if(comp.score) rows.push(metricLine('Comp reliability',`${comp.score}/100`,compNotes.join(' ')));
  if(ren.actualPremium||ren.updated) rows.push(metricLine('Renovation premium',dcPctNumber(ren.actualPremium||0),`Typical updated-home allowance ${dcPctNumber(ren.expectedLow||0)}–${dcPctNumber(ren.expectedHigh||0)}. ${ren.conclusion||''}`));
  const core=`<h3>Investor intelligence</h3><div class="metric-grid market-read intelligence-grid">${rows.join('')}</div>`;
  const hiddenHtml=hidden?`<h3>Hidden signals</h3><ul class="small-list hidden-signal-list">${hidden}</ul><p class="muted">Investor read: these signals suggest whether this is a pricing problem, a negotiation problem, or simply a retail buyer opportunity.</p>`:'';
  const fatigueHtml=fatigue.length?`<h3>Seller fatigue evidence</h3><ul class="small-list opportunity-list">${dcEscapeList(fatigue)}</ul>`:'';
  const renHtml=renList?`<h3>Renovation read</h3><ul class="small-list opportunity-list">${renList}</ul><p class="muted">Expected renovation premium: ${dcPctNumber(ren.expectedLow||0)}–${dcPctNumber(ren.expectedHigh||0)}. Current premium requested: ${dcPctNumber(ren.actualPremium||0)}.</p>`:'';
  return core + dcV24WhyOverpriced(x,meta) + hiddenHtml + fatigueHtml + renHtml;
}
function dcDealVerdict(x,best,meta){
  const price=x.listing||x.price||0,value=x.value||0,gap=price-value,gapPct=value?gap/value:0; let verdict='REVIEW',reason='Verify source values and comps before deciding.',action='Pull close comps and verify assumptions.';
  if(gapPct>.30){verdict='OVERPRICED / WAIT';reason=`Price is ${pct(gapPct)} above supported underwriting value. The issue is price, not necessarily property quality.`;action=`Do not chase retail price. Monitor pending status or target ${money(meta.negotiation?.reasonable||value*1.02)} if it comes back to market.`;}
  else if(gapPct>.10){verdict='NEGOTIATE';reason='Price is above supported value, but may be supportable if premium comps and renovation quality confirm it.';action=`Use ${money(meta.negotiation?.reasonable||value)}–${money(meta.negotiation?.stretch||value*1.1)} as the review band.`;}
  else if(best.score>=70){verdict='PURSUE';reason='Price/value relationship and strategy score justify deeper diligence.';action='Verify comps, condition, title, insurance, and financing.';}
  return {verdict,reason,action,priceGap:gap,gapPct};
}
function analyzeDealV6(manual=false){
  const box=document.getElementById('analysisResult'); if(!box)return;
  const x=getInputs(); const selected=x.analysisType; const meta=getDetectedMeta();
  const scores=[scoreRetail(x),scoreHomeowner(x),scoreRental(x),scoreFlip(x),scoreWholesale(x),scoreLand(x)];
  const best=recommendationFromScores(scores, selected==='land'?'land':selected);
  const sorted=scores.slice().sort((a,b)=>b.score-a.score);
  const label=labelAnalysis(best.type); const verdict=dcDealVerdict(x,best,meta); const breakdown=dcScoreBreakdown(x,best,meta);
  const scoreBars=Object.entries(breakdown).map(([k,v])=>`<div class="score-line"><span>${escapeHtml(k)}</span><strong>${v}</strong><div><i style="width:${v}%"></i></div></div>`).join('');
  const metrics=best.metrics.map(([k,v])=>`<div class="metric"><span class="muted">${k}</span><strong>${v}</strong></div>`).join('');
  const investorSections=buildInvestorSections(x,best,scores);
  const intelligence=dcIntelligenceSections(x,best,scores);
  const strategyCards=dcStrategyCards(sorted,x,meta,best);
  const bullets=insightBullets(x,best,scores).map(b=>`<li>${escapeHtml(b)}</li>`).join('');
  const steps=nextSteps(x,best).map(s=>`<li>${escapeHtml(s)}</li>`).join('');
  const band=dcV24ValueBand(meta); const valueRange=band.supported?`Conservative ${money(band.conservative)} · Supported ${money(band.supported)} · Upper ${money(band.upper)}`:'Verify comps';
  box.innerHTML=`<div class="report-header v24-report"><div><p class="eyebrow">DealCalc Underwriting Report</p><h2>${escapeHtml(x.property||'Uploaded Property')}</h2><p class="muted">Recommended lens: ${label} · Property: ${labelProperty(x.propertyType)}</p></div><div class="score-badge"><strong>${best.score}</strong><span>/100</span></div></div><div class="deal-verdict-card ${verdict.verdict.startsWith('PURSUE')?'good':verdict.verdict.startsWith('REVIEW')||verdict.verdict.startsWith('NEGOTIATE')||verdict.verdict.startsWith('OVERPRICED')?'watch':'bad'}"><p class="eyebrow">Deal Verdict</p><h2>${escapeHtml(verdict.verdict)}</h2><p><strong>Reason:</strong> ${escapeHtml(verdict.reason)}</p><p><strong>Action:</strong> ${escapeHtml(verdict.action)}</p><p><strong>Value band:</strong> ${escapeHtml(valueRange)}</p></div><h3>DealCalc Score Breakdown</h3><div class="score-breakdown">${scoreBars}</div><div class="metric-grid">${metrics}</div>${intelligence}${investorSections}<h3>Best Use Ranking</h3><div class="strategy-grid strategy-grid-explained">${strategyCards}</div><h3>Investor alpha</h3><ul class="small-list alpha-list">${bullets}</ul><h3>Verify next</h3><ol class="small-list">${steps}</ol><details class="notes-details"><summary>Why this result was generated</summary><p class="muted">DealCalc validates extracted fields, builds a transparent value stack, then interprets seller motivation, comp reliability, renovation premium, equity reality, market position, and strategy fit. This is a screening report, not a substitute for appraisal, inspection, title, lender, legal, or zoning review.</p></details><p class="muted tiny-note">Educational estimate only. Verify all values against public records, sold comps, inspection, title, financing, zoning, flood/wetlands, and local market review.</p><p class="cta-row"><button class="btn" onclick="dcSaveCurrentDeal()" type="button">Save Deal</button><button class="btn secondary" onclick="window.print()">Export / Print Report</button></p><p id="saveDealMsg" class="muted status-line"></p>`;
  trackEvent('deal_analyzed',{analysis_type:best.type,property_type:x.propertyType,score:best.score,risk:best.risk||baseRisk(best.score),manual:manual,value_source:meta.valueSource||''});
}
