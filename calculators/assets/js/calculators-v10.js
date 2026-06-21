(function(){
  const $ = (id) => document.getElementById(id);
  const val = (id) => Number(($(id)?.value || '0').replace?.(/,/g,'') || $(id)?.value || 0) || 0;
  const pct = (id) => val(id)/100;
  const money = (n) => isFinite(n) ? n.toLocaleString(undefined,{style:'currency',currency:'USD',maximumFractionDigits:0}) : '$0';
  const num = (n,d=1) => isFinite(n) ? n.toLocaleString(undefined,{maximumFractionDigits:d}) : '0';
  const percent = (n,d=1) => isFinite(n) ? `${n.toFixed(d)}%` : '0%';
  function track(name, data){ try{ if(window.gtag) window.gtag('event', name, data||{}); }catch(e){} }
  function result(html){ const box=$('calcResult'); if(box) box.innerHTML=html; track('calculator_completed',{calculator:document.body.dataset.calc||'unknown'}); }
  function metric(label,value,note=''){return `<div class="metric"><span>${label}</span><strong>${value}</strong>${note?`<small>${note}</small>`:''}</div>`}
  function verdict(text, cls=''){return `<p class="insight ${cls}">${text}</p>`}
  window.DealCalcV10 = {
    mao(){
      const arv=val('arv'), repairs=val('repairs'), fee=val('fee'), rule=pct('rule')||0.7, closing=val('closing'), holding=val('holding');
      const mao=arv*rule-repairs-fee-closing-holding;
      const spread=arv-mao-repairs-closing-holding;
      result(`<h3>Maximum Allowable Offer</h3><div class="score">${money(mao)}</div><div class="metric-grid">${metric('Investor spread before fee',money(spread-fee))}${metric('Rule discount',percent(rule*100,0))}${metric('Total deductions',money(repairs+fee+closing+holding))}</div>${verdict(mao>0?'Use this as your ceiling offer. If the seller wants more, renegotiate the fee, repair estimate, or exit price.':'The deal does not support a positive offer under these assumptions.','')}`);
    },
    arv(){
      const sqft=val('subjectSqft'), c1=val('comp1'), c2=val('comp2'), c3=val('comp3'), ppsf=val('ppsf'), adjust=val('adjustments');
      const comps=[c1,c2,c3].filter(x=>x>0); const avg=comps.length?comps.reduce((a,b)=>a+b,0)/comps.length:0;
      const ppsfValue=ppsf&&sqft?ppsf*sqft:0; const arv=(avg||ppsfValue)+adjust;
      const confidence=comps.length>=3?'Higher':comps.length>=1?'Medium':'Low';
      result(`<h3>Estimated ARV</h3><div class="score">${money(arv)}</div><div class="metric-grid">${metric('Comp average',money(avg))}${metric('Price/sq ft value',money(ppsfValue))}${metric('Confidence',confidence)}</div>${verdict('Best practice: weight the closest, most similar sold comps more heavily than active listings or automated estimates.')}`);
    },
    assignment(){
      const contract=val('contractPrice'), buyer=val('buyerPrice'), tc=val('transactionCosts'), emd=val('emd');
      const fee=buyer-contract-tc; const roi=emd?fee/emd*100:0;
      result(`<h3>Assignment Fee</h3><div class="score">${money(fee)}</div><div class="metric-grid">${metric('Buyer price',money(buyer))}${metric('Seller contract',money(contract))}${metric('Return on EMD',percent(roi))}</div>${verdict(fee>0?'The assignment spread is positive. Confirm the end buyer still has enough margin after repairs and closing costs.':'No assignment spread exists at these numbers. Lower the contract price or increase buyer price.')}`);
    },
    doubleClose(){
      const a=val('aPurchase'), b=val('bSale'), aClose=val('aClosing'), bClose=val('bClosing'), funding=val('fundingFee'), misc=val('misc');
      const profit=b-a-aClose-bClose-funding-misc; const margin=b?profit/b*100:0;
      result(`<h3>Double Close Profit</h3><div class="score">${money(profit)}</div><div class="metric-grid">${metric('A-B spread',money(b-a))}${metric('Total transaction costs',money(aClose+bClose+funding+misc))}${metric('Profit margin',percent(margin))}</div>${verdict(profit>0?'The double close is profitable before taxes. Verify title, transactional funding, and same-day funding timing.':'The spread is not enough to cover double close costs.')}`);
    },
    landFlip(){
      const buy=val('purchase'), resale=val('resale'), close=val('closing'), due=val('dueDiligence'), hold=val('holding'), marketing=val('marketing');
      const cost=buy+close+due+hold+marketing; const profit=resale-cost; const roi=cost?profit/cost*100:0; const maxOffer=resale-close-due-hold-marketing-val('targetProfit');
      result(`<h3>Land Flip Result</h3><div class="score">${money(profit)}</div><div class="metric-grid">${metric('Total basis',money(cost))}${metric('ROI',percent(roi))}${metric('Max offer for target profit',money(maxOffer))}</div>${verdict('For vacant land, prioritize recent land-only sold comps, zoning, access, utilities, flood/wetland risk, and buildability over automated value estimates.')}`);
    },
    rehab(){
      const exterior=val('exterior'), interior=val('interior'), mechanical=val('mechanical'), roof=val('roof'), permits=val('permits'), contingency=pct('contingency');
      const base=exterior+interior+mechanical+roof+permits; const total=base*(1+contingency);
      result(`<h3>Estimated Rehab Budget</h3><div class="score">${money(total)}</div><div class="metric-grid">${metric('Base repairs',money(base))}${metric('Contingency',money(total-base))}${metric('Contingency rate',percent(contingency*100,0))}</div>${verdict('Use this as a planning estimate. Contractor bids, permit requirements, structural issues, and utility condition can materially change the final budget.')}`);
    },
    roi(){
      const invested=val('invested'), profit=val('profit'), months=val('months')||12; const roi=invested?profit/invested*100:0; const annual=invested?((profit/invested)*(12/months))*100:0;
      result(`<h3>Return on Investment</h3><div class="score">${percent(roi)}</div><div class="metric-grid">${metric('Net profit',money(profit))}${metric('Cash invested',money(invested))}${metric('Annualized ROI',percent(annual))}</div>${verdict('Annualized ROI is useful for comparing deals with different hold periods, but it does not account for reinvestment risk or taxes.')}`);
    },
    cashFlow(){
      const rent=val('rent'), other=val('otherIncome'), vacancy=pct('vacancy'), taxes=val('taxes'), insurance=val('insurance'), repairs=val('repairs'), mgmt=pct('management'), utilities=val('utilities'), mortgage=val('mortgage');
      const gross=rent+other; const vacancyLoss=gross*vacancy; const mgmtCost=gross*mgmt; const opEx=taxes+insurance+repairs+utilities+mgmtCost; const noi=gross-vacancyLoss-opEx; const cash=noi-mortgage; const dscr=mortgage?noi/mortgage:0;
      result(`<h3>Monthly Cash Flow</h3><div class="score">${money(cash)}</div><div class="metric-grid">${metric('Monthly NOI',money(noi))}${metric('Operating expenses',money(opEx+vacancyLoss))}${metric('DSCR',num(dscr,2))}</div>${verdict(cash>=0?'Positive monthly cash flow before income taxes and capital reserves.':'Negative monthly cash flow. Review rent, financing, taxes, insurance, and maintenance assumptions.')}`);
    },
    capRate(){
      const value=val('value'), annualRent=val('annualRent'), vacancy=pct('vacancy'), opEx=val('annualExpenses');
      const egi=annualRent*(1-vacancy); const noi=egi-opEx; const cap=value?noi/value*100:0; const valueAtTarget=val('targetCap')? noi/(pct('targetCap')):0;
      result(`<h3>Cap Rate</h3><div class="score">${percent(cap)}</div><div class="metric-grid">${metric('Annual NOI',money(noi))}${metric('Effective gross income',money(egi))}${metric('Value at target cap',money(valueAtTarget))}</div>${verdict('Cap rate compares unlevered income to property value. It excludes debt service, taxes, appreciation, and future rent growth.')}`);
    },
    wholesale(){
      const arv=val('arv'), repairs=val('repairs'), seller=val('sellerPrice'), buyerProfit=val('buyerProfit'), fee=val('fee'), close=val('closing');
      const buyerMax=arv-repairs-buyerProfit-close; const assignment=buyerMax-seller; const yourFee=Math.min(fee, assignment); const pass=assignment>=fee;
      result(`<h3>Wholesale Deal Check</h3><div class="score">${pass?'Works':'Too Tight'}</div><div class="metric-grid">${metric('End buyer max price',money(buyerMax))}${metric('Available assignment spread',money(assignment))}${metric('Target fee supported?',pass?'Yes':'No')}</div>${verdict(pass?'The deal supports your target fee if the buyer accepts the profit assumption.':'The seller price is too high for your target assignment fee and buyer profit assumption.')}`);
    }
  };
})();
