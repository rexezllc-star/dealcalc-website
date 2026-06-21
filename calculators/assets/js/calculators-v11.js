
// DealCalc Calculator Engine V11 - unique models per calculator
(function(){
  const $=(id)=>document.getElementById(id);
  const v=(id)=>Number((($(id)?.value||'')+'').replace(/,/g,''))||0;
  const money=(n)=>isFinite(n)?n.toLocaleString(undefined,{style:'currency',currency:'USD',maximumFractionDigits:0}):'$0';
  const pct=(n,d=1)=>isFinite(n)?`${n.toFixed(d)}%`:'0%';
  const num=(n,d=2)=>isFinite(n)?n.toLocaleString(undefined,{maximumFractionDigits:d}):'0';
  const metric=(label,value,note='')=>`<div class="metric"><span>${label}</span><strong>${value}</strong>${note?`<small>${note}</small>`:''}</div>`;
  const verdict=(text,kind='')=>`<div class="insight ${kind}">${text}</div>`;
  const set=(html)=>{ const r=$('calcResult'); if(r) r.innerHTML=html; try{gtag&&gtag('event','calculator_completed',{calculator:document.body.dataset.calc})}catch(e){} };
  function calc(){
    const type=document.body.dataset.calc;
    if(type==='mao'){
      const arv=v('arv'), rule=v('rule')/100, repairs=v('repairs'), fee=v('assignmentFee'), closing=v('closingCosts'), holding=v('holdingCosts');
      const mao=arv*rule-repairs-fee-closing-holding;
      const allIn=mao+repairs+closing+holding+fee;
      set(`<h3>Maximum Allowable Offer</h3><div class="score">${money(mao)}</div><div class="metric-grid">${metric('All-in ceiling',money(allIn))}${metric('Total deductions',money(repairs+fee+closing+holding))}${metric('Rule used',pct(rule*100,0))}</div>${verdict(mao>0?'This is your ceiling offer before negotiation. Leave room for inspection surprises and buyer pushback.':'The assumptions do not support a positive offer. Reduce repairs, fee, or price expectations.')}`);
    } else if(type==='arv'){
      const ss=v('subjectSqft'), adj=v('conditionAdjustment');
      const comps=[[v('comp1Price'),v('comp1Sqft')],[v('comp2Price'),v('comp2Sqft')],[v('comp3Price'),v('comp3Sqft')]].filter(c=>c[0]>0);
      const prices=comps.map(c=>c[0]); const avgPrice=prices.reduce((a,b)=>a+b,0)/(prices.length||1);
      const ppsfs=comps.filter(c=>c[1]>0).map(c=>c[0]/c[1]); const avgPpsf=ppsfs.reduce((a,b)=>a+b,0)/(ppsfs.length||1);
      const ppsfValue=ss&&avgPpsf?ss*avgPpsf:0; const arv=(ppsfValue||avgPrice)+adj;
      set(`<h3>Estimated ARV</h3><div class="score">${money(arv)}</div><div class="metric-grid">${metric('Avg comp price',money(avgPrice))}${metric('Avg $/sq ft',money(avgPpsf))}${metric('Sq ft adjusted value',money(ppsfValue))}</div>${verdict('Use sold comps first. Active listings and automated estimates should support, not replace, closed comparable sales.')}`);
    } else if(type==='assignment'){
      const fee=v('buyerPrice')-v('contractPrice')-v('transactionCosts')-v('marketingCosts'), roi=v('emd')?fee/v('emd')*100:0;
      set(`<h3>Assignment Fee Result</h3><div class="score">${money(fee)}</div><div class="metric-grid">${metric('Contract price',money(v('contractPrice')))}${metric('Buyer price',money(v('buyerPrice')))}${metric('Return on EMD',pct(roi))}</div>${verdict(fee>0?'Positive spread. Confirm the end buyer still has enough margin after repairs, closing costs, and resale risk.':'No assignment spread exists at these numbers.')}`);
    } else if(type==='doubleClose'){
      const spread=v('saleB')-v('purchaseA'), costs=v('closingA')+v('closingB')+v('fundingFee')+v('otherCosts'), profit=spread-costs, margin=v('saleB')?profit/v('saleB')*100:0;
      set(`<h3>Double Close Result</h3><div class="score">${money(profit)}</div><div class="metric-grid">${metric('A-B / B-C spread',money(spread))}${metric('Total closing/funding costs',money(costs))}${metric('Net margin',pct(margin))}</div>${verdict(profit>0?'The spread appears sufficient before taxes. Verify transactional funding, title timing, and whether both closings can occur as planned.':'The spread is too tight for a double close under these assumptions.')}`);
    } else if(type==='landFlip'){
      const basis=v('purchasePrice')+v('closingCosts')+v('dueDiligence')+v('holdingCosts')+v('marketingCosts'), profit=v('resalePrice')-basis, roi=basis?profit/basis*100:0, maxOffer=v('resalePrice')-v('closingCosts')-v('dueDiligence')-v('holdingCosts')-v('marketingCosts')-v('targetProfit');
      set(`<h3>Land Flip Result</h3><div class="score">${money(profit)}</div><div class="metric-grid">${metric('Total basis',money(basis))}${metric('ROI',pct(roi))}${metric('Max offer for target profit',money(maxOffer))}</div>${verdict('For land, prioritize land-only sold comps, access, zoning, flood/wetland risk, utilities, road frontage, and buildability.')}`);
    } else if(type==='rehab'){
      const base=v('demo')+v('exterior')+v('interior')+v('mechanicals')+v('kitchenBath')+v('permits'), contingency=base*v('contingency')/100, total=base+contingency;
      set(`<h3>Rehab Estimate</h3><div class="score">${money(total)}</div><div class="metric-grid">${metric('Base repair budget',money(base))}${metric('Contingency reserve',money(contingency))}${metric('Largest line item', ['Demo','Exterior','Interior','Mechanicals','Kitchen/Bath','Permits'][[v('demo'),v('exterior'),v('interior'),v('mechanicals'),v('kitchenBath'),v('permits')].indexOf(Math.max(v('demo'),v('exterior'),v('interior'),v('mechanicals'),v('kitchenBath'),v('permits')))])}</div>${verdict('This is a planning estimate. Always verify with contractor bids and inspection findings before locking your offer.')}`);
    } else if(type==='roi'){
      const roi=v('cashInvested')?v('netProfit')/v('cashInvested')*100:0, ann=v('cashInvested')&&v('holdMonths')?roi*(12/v('holdMonths')):0, multiple=v('cashInvested')?(v('cashInvested')+v('netProfit'))/v('cashInvested'):0;
      set(`<h3>ROI Result</h3><div class="score">${pct(roi)}</div><div class="metric-grid">${metric('Net profit',money(v('netProfit')))}${metric('Annualized ROI',pct(ann))}${metric('Equity multiple',num(multiple,2)+'x')}</div>${verdict('Use ROI with hold period, risk, taxes, and capital availability. A shorter project can have a lower dollar profit but better annualized return.')}`);
    } else if(type==='cashFlow'){
      const gross=v('monthlyRent')+v('otherIncome'), vacancy=gross*v('vacancy')/100, mgmt=gross*v('management')/100, opEx=v('taxes')+v('insurance')+v('maintenance')+v('utilities')+mgmt+vacancy, noi=gross-opEx, cash=noi-v('mortgage'), dscr=v('mortgage')?noi/v('mortgage'):0;
      set(`<h3>Monthly Cash Flow</h3><div class="score">${money(cash)}</div><div class="metric-grid">${metric('Monthly NOI',money(noi))}${metric('Operating expenses',money(opEx))}${metric('DSCR',num(dscr,2))}</div>${verdict(cash>=0?'Positive cash flow before income taxes and major capital events.':'Negative cash flow. Check rent, debt payment, taxes, insurance, and repair reserves.')}`);
    } else if(type==='capRate'){
      const egi=v('annualRent')*(1-v('vacancy')/100), noi=egi-v('annualExpenses'), cap=v('propertyValue')?noi/v('propertyValue')*100:0, target=v('targetCap')?noi/(v('targetCap')/100):0;
      set(`<h3>Cap Rate Result</h3><div class="score">${pct(cap)}</div><div class="metric-grid">${metric('Annual NOI',money(noi))}${metric('Effective gross income',money(egi))}${metric('Value at target cap',money(target))}</div>${verdict('Cap rate is an unlevered income metric. It excludes mortgage payments, appreciation, financing terms, and tax effects.')}`);
    } else if(type==='wholesale'){
      const buyerMax=v('arv')-v('repairs')-v('buyerProfit')-v('closingCosts'), spread=buyerMax-v('sellerPrice'), works=spread>=v('targetFee');
      set(`<h3>Wholesale Deal Check</h3><div class="score">${works?'Works':'Too Tight'}</div><div class="metric-grid">${metric('End buyer max price',money(buyerMax))}${metric('Available spread',money(spread))}${metric('Target fee',money(v('targetFee')))}</div>${verdict(works?'The deal supports your target assignment fee under the buyer profit assumption.':'The seller price is too high for the target buyer profit and assignment fee.')}`);
    }
  }
  window.DealCalcCalc={calc};
  document.addEventListener('DOMContentLoaded',()=>{ document.querySelectorAll('[data-auto-calc] input').forEach(i=>i.addEventListener('input',()=>{})); const b=document.querySelector('[data-calc-button]'); if(b) b.addEventListener('click',calc); });
})();
