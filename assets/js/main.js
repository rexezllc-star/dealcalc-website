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
