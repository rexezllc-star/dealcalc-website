
// DealCalc Calculator Engine V14 - unique formulas per calculator, calculator UX + formula update
(function(){
  const $=(id)=>document.getElementById(id);
  const v=(id)=>Number((($(id)?.value||'')+'').replace(/,/g,''))||0;
  const money=(n)=>isFinite(n)?n.toLocaleString(undefined,{style:'currency',currency:'USD',maximumFractionDigits:0}):'$0';
  const pct=(n,d=1)=>isFinite(n)?`${n.toFixed(d)}%`:'0%';
  const num=(n,d=2)=>isFinite(n)?n.toLocaleString(undefined,{maximumFractionDigits:d}):'0';
  const metric=(label,value,note='')=>`<div class="metric"><span>${label}</span><strong>${value}</strong>${note?`<small>${note}</small>`:''}</div>`;
  const insight=(text,kind='')=>`<div class="insight ${kind}">${text}</div>`;
  const set=(html)=>{ const r=$('calcResult'); if(r) r.innerHTML=html; try{ if(window.gtag) gtag('event','calculator_completed',{calculator:document.body.dataset.calc}); }catch(e){} };
  function calc(){
    const type=document.body.dataset.calc;
    if(type==='mao'){
      const arv=v('arv'), rule=v('rule')/100, repairs=v('repairs'), fee=v('assignmentFee'), closing=v('closingCosts'), holding=v('holdingCosts');
      const mao=arv*rule-repairs-fee-closing-holding;
      const deductions=repairs+fee+closing+holding;
      set(`<h3>Maximum Allowable Offer</h3><div class="score">${money(mao)}</div><div class="metric-grid">${metric('ARV rule value',money(arv*rule))}${metric('Total deductions',money(deductions))}${metric('Rule used',pct(rule*100,0))}${metric('Desired fee',money(fee))}</div>${insight(mao>0?'This is your ceiling offer before negotiation. If the seller asks above this number, your wholesale margin is likely compressed.':'The assumptions do not support a positive offer. The ARV, repair budget, or target fee needs to change before this is viable.','watch')}`);
    } else if(type==='arv'){
      const ss=v('subjectSqft'), adj=v('conditionAdjustment');
      const comps=[[v('comp1Price'),v('comp1Sqft')],[v('comp2Price'),v('comp2Sqft')],[v('comp3Price'),v('comp3Sqft')]].filter(c=>c[0]>0);
      const avgPrice=comps.reduce((a,c)=>a+c[0],0)/(comps.length||1);
      const ppsfs=comps.filter(c=>c[1]>0).map(c=>c[0]/c[1]);
      const avgPpsf=ppsfs.reduce((a,b)=>a+b,0)/(ppsfs.length||1);
      const ppsfValue=ss&&avgPpsf?ss*avgPpsf:0;
      const arv=(ppsfValue||avgPrice)+adj;
      set(`<h3>Estimated ARV</h3><div class="score">${money(arv)}</div><div class="metric-grid">${metric('Average comp price',money(avgPrice))}${metric('Average $/sq ft',money(avgPpsf))}${metric('Subject sq ft value',money(ppsfValue))}${metric('Adjustment',money(adj))}</div>${insight('Best practice: use recent sold comps within the same neighborhood, similar condition, size, bed/bath count, and property type. Active listings should support the conclusion but should not drive ARV alone.')}`);
    } else if(type==='assignment'){
      const fee=v('buyerPrice')-v('contractPrice')-v('transactionCosts')-v('marketingCosts');
      const roi=v('emd')?fee/v('emd')*100:0;
      set(`<h3>Assignment Fee Result</h3><div class="score">${money(fee)}</div><div class="metric-grid">${metric('Contract price',money(v('contractPrice')))}${metric('End buyer price',money(v('buyerPrice')))}${metric('Net costs',money(v('transactionCosts')+v('marketingCosts')))}${metric('Return on EMD',pct(roi))}</div>${insight(fee>0?'Positive spread. Confirm the end buyer still has enough margin after repairs, closing costs, resale risk, and their required profit.':'No assignment spread exists at these numbers. Either negotiate lower or find a buyer willing to pay more.','watch')}`);
    } else if(type==='doubleClose'){
      const spread=v('saleB')-v('purchaseA'), costs=v('closingA')+v('closingB')+v('fundingFee')+v('otherCosts'), profit=spread-costs, margin=v('saleB')?profit/v('saleB')*100:0;
      set(`<h3>Double Close Result</h3><div class="score">${money(profit)}</div><div class="metric-grid">${metric('A-B / B-C spread',money(spread))}${metric('Closing + funding costs',money(costs))}${metric('Net margin',pct(margin))}${metric('Break-even B-C price',money(v('purchaseA')+costs))}</div>${insight(profit>0?'The spread appears sufficient before taxes. Verify title timing, transactional funding, and whether both closings can happen as scheduled.':'The spread is too tight for a double close under these assumptions.','watch')}`);
    } else if(type==='landFlip'){
      const basis=v('purchasePrice')+v('closingCosts')+v('dueDiligence')+v('holdingCosts')+v('marketingCosts'), profit=v('resalePrice')-basis, roi=basis?profit/basis*100:0, maxOffer=v('resalePrice')-v('closingCosts')-v('dueDiligence')-v('holdingCosts')-v('marketingCosts')-v('targetProfit');
      set(`<h3>Land Flip Result</h3><div class="score">${money(profit)}</div><div class="metric-grid">${metric('Total basis',money(basis))}${metric('ROI',pct(roi))}${metric('Max offer for target profit',money(maxOffer))}${metric('Target profit',money(v('targetProfit')))}</div>${insight('For land, prioritize land-only sold comps, buildability, zoning, flood/wetland risk, road access, utilities, setbacks, and nearby new construction demand.')}`);
    } else if(type==='rehab'){
      const vals=[v('demo'),v('exterior'),v('interior'),v('mechanicals'),v('kitchenBath'),v('permits')];
      const labels=['Demo / Cleanout','Roof / Exterior','Interior Finishes','Mechanicals','Kitchen / Bath','Permits / Misc'];
      const base=vals.reduce((a,b)=>a+b,0), contingency=base*v('contingency')/100, total=base+contingency;
      set(`<h3>Rehab Estimate</h3><div class="score">${money(total)}</div><div class="metric-grid">${metric('Base repair budget',money(base))}${metric('Contingency reserve',money(contingency))}${metric('Contingency used',pct(v('contingency'),0))}${metric('Largest line item',labels[vals.indexOf(Math.max(...vals))]||'N/A')}</div>${insight('This is a planning estimate. Lock final numbers only after contractor walk-throughs, inspection findings, permit review, and material/labor pricing.')}`);
    } else if(type==='roi'){
      const roi=v('cashInvested')?v('netProfit')/v('cashInvested')*100:0, ann=v('cashInvested')&&v('holdMonths')?roi*(12/v('holdMonths')):0, multiple=v('cashInvested')?(v('cashInvested')+v('netProfit'))/v('cashInvested'):0, margin=v('salePrice')?v('netProfit')/v('salePrice')*100:0;
      set(`<h3>ROI Result</h3><div class="score">${pct(roi)}</div><div class="metric-grid">${metric('Net profit',money(v('netProfit')))}${metric('Annualized ROI',pct(ann))}${metric('Equity multiple',num(multiple,2)+'x')}${metric('Profit margin',pct(margin))}</div>${insight('Compare ROI against risk and time. A smaller profit over a short hold period can beat a larger profit that ties up capital for too long.')}`);
    } else if(type==='cashFlow'){
      const gross=v('monthlyRent')+v('otherIncome'), vacancy=gross*v('vacancy')/100, mgmt=gross*v('management')/100, opEx=v('taxes')+v('insurance')+v('maintenance')+v('utilities')+mgmt+vacancy, noi=gross-opEx, cash=noi-v('mortgage'), dscr=v('mortgage')?noi/v('mortgage'):0;
      set(`<h3>Monthly Cash Flow</h3><div class="score">${money(cash)}</div><div class="metric-grid">${metric('Gross monthly income',money(gross))}${metric('Monthly NOI',money(noi))}${metric('Operating expenses',money(opEx))}${metric('DSCR',num(dscr,2))}</div>${insight(cash>=0?'Positive cash flow before income taxes and major capital events. Still reserve for vacancy, repairs, and capital expenditures.':'Negative cash flow. Review rent assumptions, mortgage payment, taxes, insurance, vacancy, and maintenance reserves.','watch')}`);
    } else if(type==='capRate'){
      const egi=v('annualRent')*(1-v('vacancy')/100), noi=egi-v('annualExpenses'), cap=v('propertyValue')?noi/v('propertyValue')*100:0, target=v('targetCap')?noi/(v('targetCap')/100):0;
      set(`<h3>Cap Rate Result</h3><div class="score">${pct(cap)}</div><div class="metric-grid">${metric('Effective gross income',money(egi))}${metric('Annual NOI',money(noi))}${metric('Cap rate',pct(cap))}${metric('Value at target cap',money(target))}</div>${insight('Cap rate is an unlevered income metric. It excludes mortgage terms, appreciation, income taxes, and financing structure.')}`);
    } else if(type==='wholesale'){
      const buyerMax=v('arv')-v('repairs')-v('buyerProfit')-v('closingCosts'), spread=buyerMax-v('sellerPrice'), works=spread>=v('targetFee');
      set(`<h3>Wholesale Deal Check</h3><div class="score">${works?'Works':'Too Tight'}</div><div class="metric-grid">${metric('End buyer max price',money(buyerMax))}${metric('Available spread',money(spread))}${metric('Target fee',money(v('targetFee')))}${metric('Seller price',money(v('sellerPrice')))}</div>${insight(works?'The deal supports your target assignment fee under the buyer profit assumption.':'The seller price is too high for the target buyer profit and assignment fee.','watch')}`);
    }
  }
  window.DealCalcCalc={calc};
  document.addEventListener('DOMContentLoaded',()=>{
    const b=document.querySelector('[data-calc-button]'); if(b) b.addEventListener('click',calc);
    document.querySelectorAll('[data-auto-calc] input').forEach(i=>i.addEventListener('change',calc));
  });
})();
