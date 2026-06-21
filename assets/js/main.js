function trackEvent(name,params={}){try{if(window.gtag){gtag('event',name,params)}}catch(e){console.warn(e)}}
function money(n){return Number(n||0).toLocaleString(undefined,{style:'currency',currency:'USD',maximumFractionDigits:0})}
function pct(n){return Number(n||0).toLocaleString(undefined,{style:'percent',maximumFractionDigits:1})}
function val(id){return +document.getElementById(id)?.value||0}
function textVal(id){return (document.getElementById(id)?.value||'').trim()}
function setVal(id,v,force=false){const el=document.getElementById(id); if(el && (force || !el.value) && v){el.value=Math.round(v)}}
function setText(id,v,force=false){const el=document.getElementById(id); if(el && (force || !el.value) && v){el.value=v}}
function clampScore(n){return Math.max(0,Math.min(100,Math.round(n)))}
function baseRisk(score){return score>=80?'Low':score>=65?'Moderate':score>=50?'High':'Very High'}

function calcMAO(){const arv=+document.getElementById('arv')?.value||0, repairs=+document.getElementById('repairs')?.value||0, fee=+document.getElementById('fee')?.value||0, pctRule=(+document.getElementById('rule')?.value||70)/100; const mao=arv*pctRule-repairs-fee; document.getElementById('maoResult').innerHTML=`<h3>Maximum Allowable Offer</h3><div class="score">${money(mao)}</div><p class="muted">Formula: ARV × ${Math.round(pctRule*100)}% − Repairs − Assignment Fee.</p>`; trackEvent('calculator_completed',{calculator:'mao'});}
function analyzeDeal(){return analyzeDealV5 ? analyzeDealV5() : null}

function updateAnalyzerMode(){
  const analysis=document.getElementById('analysisType')?.value||'auto';
  const property=document.getElementById('propertyType')?.value||'auto';
  const effective = analysis==='auto' ? (property==='land'?'land':'flip') : analysis;
  document.querySelectorAll('.mode').forEach(el=>el.classList.add('hidden-field'));
  document.querySelectorAll('.'+effective+'-mode').forEach(el=>el.classList.remove('hidden-field'));
  const fee=document.getElementById('assignmentFee');
  if(fee && fee.previousElementSibling){
    const labels={auto:'Assignment Fee / Desired Profit / Cash Invested',wholesale:'Assignment Fee / Desired Profit',flip:'Target Profit',rental:'Cash Invested / Down Payment',land:'Target Profit / Resale Spread',homeowner:'Agent Commission / Selling Fee',retail:'Negotiation Cushion / Desired Discount'};
    fee.previousElementSibling.textContent=labels[effective]||labels.auto;
  }
}

function extractNumberAfter(text, labels){
  for(const label of labels){
    const safe=label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const re=new RegExp(safe+'\\s*[:\\-]?\\s*\\$?([0-9][0-9,]*(?:\\.[0-9]+)?)','i');
    const m=text.match(re); if(m) return Number(m[1].replace(/,/g,''))||0;
  }
  return 0;
}
function extractTextAfter(text, labels){
  for(const label of labels){
    const safe=label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const re=new RegExp(safe+'\\s*[:\\-]?\\s*([^\\n|]+)','i');
    const m=text.match(re); if(m) return m[1].trim().slice(0,120);
  }
  return '';
}
function detectPropertyType(text){
  const t=text.toLowerCase();
  if(/property type:\s*land|land use:\s*residential-vacant land|vacant land|lot size[^\n]*(21,?7|43,?5)|seller financing.*lot/i.test(text)) return 'land';
  if(/property type:\s*single family|single family \(sfr\)|land use:\s*single family residential|bedrooms:\s*\d|bathrooms:\s*\d|living area:\s*[0-9,]+/i.test(text)) return 'sfr';
  if(/duplex|triplex|fourplex|multifamily|multi-family|units/i.test(text)) return 'multi';
  if(/condo|townhome|townhouse/i.test(text)) return 'condo';
  return 'unknown';
}
function detectAnalysisGoal(text, propertyType, fields){
  const t=text.toLowerCase();
  const listing=fields.listingPrice||0, value=fields.estimatedValue||0, rent=fields.monthlyRent||0, loan=fields.loanBalance||0;
  if(propertyType==='land') return 'land';
  if(rent>0 && /(monthly rent|rent estimate|average monthly rent|tenant|lease)/i.test(text)) return 'rental';
  if(loan>0 && value>0 && /(estimated equity|mortgage balance|combined loan to value|loan to value|open liens)/i.test(text)) return 'homeowner';
  if(listing>0 && value>0 && listing > value*1.1) return 'retail';
  if(/repair|rehab|renovation|arv|after repair/i.test(text)) return 'flip';
  return 'flip';
}
function extractDealFields(text){
  const flat=text.replace(/\r/g,'\n').replace(/[ \t]+/g,' ');
  const oneLine=flat.replace(/\s+/g,' ');
  const fields={};
  fields.address=(flat.match(/Comparative Market Analysis\s+([^\n]+)/i)?.[1]||extractTextAfter(flat,['Property Address','Situs Address'])).trim();
  fields.estimatedValue=extractNumberAfter(oneLine,['Estimated Value','ARV','After Repair Value','Resale Value']);
  fields.listingPrice=extractNumberAfter(oneLine,['Current Listing Status Status Pending Date 5/16/2026 Price','List Price','Listing Price','Listed At','Asking Price']);
  // More reliable CMA current listing price parser: Current Listing Status ... Price: $395,000
  const cls=oneLine.match(/Current Listing Status.*?Price\s*:?\s*\$?([0-9,]+)/i); if(cls) fields.listingPrice=Number(cls[1].replace(/,/g,''));
  const listHist=oneLine.match(/Listing History.*?(?:Active|Pending|Active - New Listing|Active - Price)\s*\$([0-9,]+)/i); if(!fields.listingPrice && listHist) fields.listingPrice=Number(listHist[1].replace(/,/g,''));
  fields.purchasePrice=extractNumberAfter(oneLine,['Purchase Price','Offer Price','Seller Asking Price','Sale Price']);
  fields.loanBalance=extractNumberAfter(oneLine,['Mortgage Balance','Loan Balance','Payoff','Open Liens']);
  fields.estimatedEquity=extractNumberAfter(oneLine,['Estimated Equity']);
  fields.monthlyRent=extractNumberAfter(oneLine,['Monthly Rent','Average Monthly Rent']);
  fields.avgSalePrice=extractNumberAfter(oneLine,['Avg. Sale Price','Average Sale Price']);
  fields.propertyTax=extractNumberAfter(oneLine,['Property Tax']);
  fields.squareFeet=extractNumberAfter(oneLine,['Square Feet','Living Area']);
  fields.beds=extractNumberAfter(oneLine,['Bedrooms','Beds']);
  fields.baths=extractNumberAfter(oneLine,['Bathrooms','Baths']);
  fields.dom=extractNumberAfter(oneLine,['Days on Market','Average DOM']);
  fields.repairs=extractNumberAfter(oneLine,['Repairs','Repair Costs','Rehab','Renovation']);
  return fields;
}
function summarizeExtraction(fields, propertyType, goal){
  const items=[];
  if(fields.address)items.push(['Address',fields.address]);
  items.push(['Detected Property Type',propertyType]);
  items.push(['Suggested Analysis',goal]);
  if(fields.estimatedValue)items.push(['Estimated Value',money(fields.estimatedValue)]);
  if(fields.listingPrice)items.push(['Listing Price',money(fields.listingPrice)]);
  if(fields.avgSalePrice)items.push(['Avg. Sale Price',money(fields.avgSalePrice)]);
  if(fields.loanBalance)items.push(['Mortgage Balance',money(fields.loanBalance)]);
  if(fields.estimatedEquity)items.push(['Estimated Equity',money(fields.estimatedEquity)]);
  if(fields.monthlyRent)items.push(['Monthly Rent',money(fields.monthlyRent)]);
  if(fields.squareFeet)items.push(['Sq Ft',fields.squareFeet.toLocaleString()]);
  const html='<h3>PDF Detection Summary</h3><div class="metric-grid">'+items.map(([k,v])=>`<div class="metric"><span class="muted">${k}</span><strong>${v}</strong></div>`).join('')+'</div><p class="muted">You can override the property type or analysis goal before running the analysis.</p>';
  const box=document.getElementById('extractionSummary'); if(box){box.innerHTML=html; box.classList.remove('hidden-field');}
}
function applyExtractedNumbers(text){
  const fields=extractDealFields(text);
  const propertyType=detectPropertyType(text);
  const goal=detectAnalysisGoal(text,propertyType,fields);
  const propEl=document.getElementById('propertyType'); if(propEl && propEl.value==='auto') propEl.value=propertyType;
  const goalEl=document.getElementById('analysisType'); if(goalEl && goalEl.value==='auto') goalEl.value=goal;
  setText('propertyLabel',fields.address);
  setVal('listingPrice',fields.listingPrice);
  setVal('purchasePrice',fields.listingPrice || fields.purchasePrice || fields.estimatedValue);
  setVal('analyzerArv',fields.estimatedValue || fields.avgSalePrice);
  setVal('loanBalance',fields.loanBalance);
  setVal('monthlyRent',fields.monthlyRent);
  if(fields.propertyTax && !val('monthlyExpenses')) setVal('monthlyExpenses', Math.round(fields.propertyTax/12));
  summarizeExtraction(fields,propertyType,goal);
  updateAnalyzerMode();
  trackEvent('pdf_numbers_extracted',{property_type:propertyType,analysis_goal:goal});
}

function analyzeDealV5(){
  let selected=document.getElementById('analysisType')?.value||'auto';
  const property=document.getElementById('propertyType')?.value||'auto';
  const notes=textVal('documentNotes');
  if(selected==='auto') selected=detectAnalysisGoal(notes, property==='auto'?detectPropertyType(notes):property, extractDealFields(notes));
  if(selected==='auto') selected='flip';
  const label=textVal('propertyLabel')||'Deal Analysis';
  const list=val('listingPrice'), price=val('purchasePrice')||list, arv=val('analyzerArv')||list||price, repairs=val('analyzerRepairs'), fee=val('assignmentFee'), closing=val('closingCosts'), holding=val('holdingCosts'), loan=val('loanBalance'), rent=val('monthlyRent'), expenses=val('monthlyExpenses'), prep=val('salePrepCosts');
  const resale=arv||list||price;
  let score=50, title='Deal Analysis', rec='Review the extracted numbers and verify comps.', metrics=[], notesOut=[], profit=0;
  if(selected==='land'){
    title='Vacant Land Analysis'; profit=resale-price-closing-holding-fee; const margin=resale?profit/resale:0, markup=price?profit/price:0, loanRisk=loan&&resale?loan/resale:0;
    score+=profit>50000?25:profit>20000?15:profit>5000?6:-15; score+=margin>.3?18:margin>.15?10:margin<.08?-10:0; score+=loanRisk>.8?-12:0; score+=holding<5000?5:-5;
    rec=score>=80?'Strong land opportunity if access, zoning, utilities, flood/wetlands, and title check out.':score>=65?'Workable land opportunity. Verify buildability and actual land comps.':score>=50?'Borderline land deal. You need cleaner comps or a lower acquisition price.':'Weak land deal unless price or terms improve materially.';
    metrics=[['Projected Land Profit',money(profit)],['Profit Margin',pct(margin)],['Markup on Cost',pct(markup)],['Detected Property Type',property]];
    notesOut=[profit>0?'Resale spread is positive.':'Resale spread is negative.', margin>.15?'Margin provides some room for negotiation.':'Margin is thin for land liquidity risk.', 'For land, verify access, zoning, utilities, flood zone, wetlands, HOA, liens, and recent lot-only comps.'];
  } else if(selected==='homeowner'){
    title='Homeowner Equity Analysis'; const saleCosts=fee+closing+prep; const grossEquity=resale-loan; const netEquity=resale-loan-saleCosts; const ltv=resale?loan/resale:0;
    score+=netEquity>100000?25:netEquity>50000?15:netEquity>10000?5:-15; score+=ltv<.6?15:ltv<.8?8:ltv>.95?-15:0; score+=list&&resale&&list>resale*1.1?-8:0;
    rec=score>=80?'Strong equity position. Compare selling, refinancing, HELOC, or holding.':score>=65?'Healthy equity position. Confirm payoff, liens, and sale costs.':score>=50?'Some equity, but transaction costs matter. Confirm net proceeds carefully.':'Limited equity based on inputs. Be careful with sale costs, payoff, liens, and concessions.';
    metrics=[['Gross Equity',money(grossEquity)],['Estimated Net Equity',money(netEquity)],['Loan-to-Value',pct(ltv)],['Estimated Sale Costs',money(saleCosts)]];
    notesOut=[netEquity>0?'Estimated net equity is positive after sale costs.':'Estimated net equity may be low or negative after sale costs.', ltv<.8?'Loan-to-value appears manageable.':'Loan-to-value is high.', 'Confirm mortgage payoff, taxes, liens, agent fees, concessions, and repair credits.'];
  } else if(selected==='rental'){
    title='Rental / Buy & Hold Analysis'; const cashInvested=fee||Math.max(0,price-loan)+repairs+closing; const monthlyCashFlow=rent-expenses; const annualCashFlow=monthlyCashFlow*12; const coc=cashInvested?annualCashFlow/cashInvested:0; const equity=resale-price-repairs; const grossRentYield=price?rent*12/price:0;
    score+=monthlyCashFlow>500?20:monthlyCashFlow>200?10:monthlyCashFlow>0?4:-15; score+=coc>.12?18:coc>.08?10:coc<.04?-10:0; score+=grossRentYield>.09?8:grossRentYield<.05?-8:0; score+=equity>20000?8:equity<0?-10:0;
    rec=score>=80?'Strong rental candidate based on cash flow and return. Verify rent comps and operating expenses.':score>=65?'Potentially workable rental. Confirm taxes, insurance, repairs, financing, and vacancy.':score>=50?'Borderline rental. Cash flow or return may be thin.':'Weak rental based on current assumptions.';
    metrics=[['Monthly Cash Flow',money(monthlyCashFlow)],['Cash-on-Cash Return',pct(coc)],['Gross Rent Yield',pct(grossRentYield)],['Estimated Equity',money(equity)]];
    notesOut=[monthlyCashFlow>0?'Rental appears cash-flow positive.':'Rental appears cash-flow negative.', coc>.08?'Cash-on-cash return is attractive.':'Cash-on-cash return may be low.', 'Verify actual rent, taxes, insurance, vacancy, repairs, management, and loan terms.'];
  } else if(selected==='retail'){
    title='Retail Listing / Overpay Check'; const overpay=list&&resale?list-resale:price-resale; const discountNeeded=Math.max(0,overpay); const listToValue=resale?list/resale:0;
    score=70; score+=overpay<=0?15:overpay<resale*.05?2:overpay<resale*.15?-15:-30; score+=rent&&price?(rent*12/price>.07?8:-4):0;
    rec=score>=80?'Listing appears reasonably priced or below value based on extracted value. Still verify comps.':score>=65?'Possibly fair, but negotiate and confirm value.':score>=50?'Likely overpriced relative to extracted value. Require discount or stronger comps.':'Materially overpriced based on the PDF numbers. Avoid overpaying unless new comps justify it.';
    metrics=[['Listing Price',money(list||price)],['Estimated Value',money(resale)],['Price Above Value',money(overpay)],['List-to-Value',pct(listToValue)]];
    notesOut=[overpay>0?'Listing price is above the extracted estimated value.':'Listing price is at or below extracted estimated value.', discountNeeded>0?'Minimum value-gap discount needed: '+money(discountNeeded)+'.':'No value-gap discount indicated by extracted values.', 'Use this for homeowner, retail buyer, or investor overpay checks.'];
  } else if(selected==='wholesale'){
    title='Wholesale Assignment Analysis'; const mao=resale*.70-repairs-fee; profit=resale-price-repairs-closing-holding-fee; const spread=mao-price; const repairRatio=resale?repairs/resale:1;
    score+=profit>30000?20:profit>15000?12:profit>5000?5:-15; score+=spread>15000?15:spread>0?8:-18; score+=repairRatio<.15?10:repairRatio>.30?-10:0;
    rec=score>=80?'Strong wholesale candidate. Lock terms, verify buyer appetite, and confirm assignability.':score>=65?'Workable wholesale deal. Verify comps, title, access, and buyer spread.':score>=50?'Borderline. Renegotiate purchase price or reduce fee expectations.':'Pass or renegotiate hard before contracting.';
    metrics=[['MAO',money(mao)],['Est. Profit / Spread',money(profit)],['Spread to MAO',money(spread)],['Repair Ratio',pct(repairRatio)]];
    notesOut=[spread>=0?'Purchase price is inside the MAO range.':'Purchase price is above the MAO range.', profit>0?'Projected spread is positive before taxes.':'Projected spread is negative or too tight.', repairRatio<.2?'Repair ratio appears manageable.':'Repair ratio may create execution risk.'];
  } else {
    title='Fix & Flip Analysis'; profit=resale-price-repairs-closing-holding; const projectCost=price+repairs+closing+holding; const roi=projectCost?profit/projectCost:0; const margin=resale?profit/resale:0;
    score+=profit>50000?25:profit>25000?15:profit>10000?6:-18; score+=roi>.25?15:roi>.15?8:roi<.08?-12:0; score+=margin>.18?10:margin<.08?-10:0;
    rec=score>=80?'Strong flip candidate if comps, contractor bids, and timeline are reliable.':score>=65?'Potentially workable flip. Tighten repair estimate and resale comps.':score>=50?'Borderline flip. Profit may not justify execution risk.':'Weak flip candidate unless purchase price improves.';
    metrics=[['Projected Flip Profit',money(profit)],['ROI on Project Cost',pct(roi)],['Profit Margin',pct(margin)],['Total Project Cost',money(projectCost)]];
    notesOut=[profit>0?'Projected flip profit is positive.':'Projected flip profit is negative.', roi>.15?'ROI clears a reasonable flip screen.':'ROI may be too thin for flip risk.', repairs/resale>.3?'Repair load is heavy relative to resale value.':'Repair load appears manageable.'];
  }
  score=clampScore(score); const risk=baseRisk(score);
  const metricHtml=metrics.map(([k,v])=>`<div class="metric"><span class="muted">${k}</span><strong>${v}</strong></div>`).join('');
  const noteHtml=notesOut.map(n=>`<li>${n}</li>`).join('');
  document.getElementById('analysisResult').innerHTML=`<p class="eyebrow">${label}</p><div class="score">${score}</div><h3>${title}</h3><p><span class="pill">Risk: ${risk}</span><span class="pill">Analysis: ${selected}</span><span class="pill">Property: ${property}</span></p><div class="metric-grid">${metricHtml}</div><div class="recommendation"><strong>Recommendation:</strong><br>${rec}</div><h4>Analysis Notes</h4><ul class="small-list">${noteHtml}</ul><p class="muted">Educational estimate only. Verify comps, title, taxes, repairs, financing, insurance, local rules, and transaction costs before making a decision.</p><p><button class="btn secondary" onclick="window.print()">Print / Save PDF</button></p>`;
  trackEvent('deal_analyzed',{analysis_type:selected,property_type:property,score:score,risk:risk});
}
function analyzeDealV2(){return analyzeDealV5()}
function clearAnalyzer(){['propertyLabel','listingPrice','purchasePrice','analyzerArv','analyzerRepairs','assignmentFee','closingCosts','holdingCosts','loanBalance','monthlyRent','monthlyExpenses','salePrepCosts','documentNotes'].forEach(id=>{const el=document.getElementById(id); if(el)el.value=''}); const a=document.getElementById('analysisType'); if(a)a.value='auto'; const p=document.getElementById('propertyType'); if(p)p.value='auto'; const box=document.getElementById('extractionSummary'); if(box){box.innerHTML=''; box.classList.add('hidden-field');} const r=document.getElementById('analysisResult'); if(r)r.innerHTML='<h3>Deal analysis will appear here.</h3><p class="muted">Upload a PDF to auto-detect property type and recommended analysis, or manually choose your strategy.</p>'; const s=document.getElementById('pdfStatus'); if(s)s.textContent='No PDF uploaded yet.'; updateAnalyzerMode();}
async function handleDealPdfUpload(event){const file=event.target.files?.[0]; const status=document.getElementById('pdfStatus'); const notes=document.getElementById('documentNotes'); if(!file)return; if(status)status.textContent='Reading PDF locally and detecting deal type...'; try{if(window.pdfjsLib){pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; const buf=await file.arrayBuffer(); const pdf=await pdfjsLib.getDocument({data:buf}).promise; let out=''; for(let i=1;i<=Math.min(pdf.numPages,12);i++){const page=await pdf.getPage(i); const content=await page.getTextContent(); out+=content.items.map(item=>item.str).join(' ')+'\n\n';} if(notes)notes.value=out.slice(0,20000); applyExtractedNumbers(out); if(status)status.textContent=`PDF loaded: ${file.name}. Extracted text from ${Math.min(pdf.numPages,12)} page(s) and suggested an analysis.`; trackEvent('deal_pdf_uploaded',{pages:pdf.numPages});}else{if(status)status.textContent='PDF reader did not load. Paste the deal details manually.';}}catch(err){console.error(err); if(status)status.textContent='Could not read this PDF. It may be scanned/protected. Paste the key numbers manually.'; trackEvent('deal_pdf_upload_failed',{});}}

document.addEventListener('submit',e=>{if(e.target.matches('[data-track-form]'))trackEvent('contact_submit',{form:e.target.dataset.trackForm})});
document.addEventListener('DOMContentLoaded',updateAnalyzerMode);
