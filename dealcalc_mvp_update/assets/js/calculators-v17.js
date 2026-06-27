// DealCalc Calculator Engine V17 - Production MVP upgrade
// Adds Rental Property Analyzer and Room-by-Room Rehab Estimator while preserving existing calculators.
(function(){
  const $=(id)=>document.getElementById(id);
  const v=(id)=>Number((($(id)?.value||'')+'').replace(/,/g,''))||0;
  const money=(n)=>isFinite(n)?n.toLocaleString(undefined,{style:'currency',currency:'USD',maximumFractionDigits:0}):'$0';
  const pct=(n,d=1)=>isFinite(n)?`${n.toFixed(d)}%`:'0%';
  const num=(n,d=2)=>isFinite(n)?n.toLocaleString(undefined,{maximumFractionDigits:d}):'0';
  const metric=(label,value,note='')=>`<div class="metric"><span>${label}</span><strong>${value}</strong>${note?`<small>${note}</small>`:''}</div>`;
  const insight=(text,kind='')=>`<div class="insight ${kind}">${text}</div>`;
  const set=(html)=>{ const r=$('calcResult'); if(r) r.innerHTML=html; try{ if(window.gtag) gtag('event','calculator_completed',{calculator:document.body.dataset.calc}); }catch(e){} };
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const pmt=(rate,months,principal)=>{
    if(!principal||!months) return 0;
    const r=rate/100/12;
    if(!r) return principal/months;
    return principal*r*Math.pow(1+r,months)/(Math.pow(1+r,months)-1);
  };
  const grade=(score)=>score>=90?'A':score>=80?'B':score>=70?'C':score>=60?'D':'F';
  function rentalAnalyzer(){
    const purchase=v('purchasePrice'), closing=v('closingCosts'), rehab=v('rehabCosts'), down=v('downPayment'), interest=v('interestRate'), term=v('loanTerm')||30;
    const loanInput=v('loanAmount');
    const loan=loanInput||Math.max(0,purchase-down);
    const cashInvested=down+closing+rehab;
    const monthlyDebt=pmt(interest,term*12,loan);
    const rent=v('monthlyRent'), other=v('otherIncome'), vacancyRate=v('vacancy')||5, rentGrowth=v('rentGrowth');
    const gross=rent+other;
    const vacancyLoss=gross*vacancyRate/100;
    const taxes=v('taxes'), insurance=v('insurance'), hoa=v('hoa'), maintenance=v('maintenance'), capex=v('capex'), management=gross*(v('management')||0)/100, utilities=v('utilities'), misc=v('miscExpenses');
    const opEx=taxes+insurance+hoa+maintenance+capex+management+utilities+misc+vacancyLoss;
    const noiMonthly=gross-opEx, noiAnnual=noiMonthly*12;
    const cashFlow=noiMonthly-monthlyDebt, annualCash=cashFlow*12;
    const totalCost=purchase+closing+rehab;
    const cap=totalCost?noiAnnual/totalCost*100:0;
    const coc=cashInvested?annualCash/cashInvested*100:0;
    const dscr=monthlyDebt?noiMonthly/monthlyDebt:0;
    const grm=gross?purchase/(gross*12):0;
    const breakEven=gross?((opEx-vacancyLoss)+monthlyDebt)/gross*100:0;
    const appreciation=v('appreciation')||3;
    const fiveYearEquityGain=purchase*(Math.pow(1+appreciation/100,5)-1);
    const fiveYearCash=annualCash*5;
    const estimatedIrr=cashInvested?(fiveYearCash+fiveYearEquityGain)/cashInvested/5*100:0;
    let score=50;
    score += clamp(cashFlow/8,-20,25);
    score += clamp((cap-5)*4,-15,20);
    score += clamp((coc-6)*2,-15,20);
    score += clamp((dscr-1.1)*30,-20,20);
    score += breakEven>95?-15:breakEven>88?-8:8;
    score=clamp(Math.round(score),0,100);
    const rec=score>=80?'BUY / STRONG REVIEW':score>=65?'NEGOTIATE / VERIFY':'PASS OR REPRICE';
    const risk=dscr<1.1||cashFlow<0?'High':dscr<1.25||breakEven>88?'Moderate':'Controlled';
    set(`<div class="report-header"><div><p class="eyebrow">Rental Property Analyzer</p><h3>${rec}</h3><p class="muted">Investment grade ${grade(score)} · Risk: ${risk}</p></div><div class="score-badge"><strong>${score}</strong><span>/100</span></div></div>
      <div class="metric-grid market-read">
        ${metric('Monthly cash flow',money(cashFlow),'NOI minus debt service')}
        ${metric('Annual cash flow',money(annualCash),'Before income taxes')}
        ${metric('NOI',money(noiAnnual),'Annualized')}
        ${metric('Cap rate',pct(cap),'NOI / total cost')}
        ${metric('Cash-on-cash',pct(coc),'Annual cash flow / cash invested')}
        ${metric('DSCR',num(dscr,2),dscr>=1.25?'Healthy':'Tight')}
        ${metric('Break-even occupancy',pct(breakEven),'Lower is safer')}
        ${metric('Estimated IRR proxy',pct(estimatedIrr),'Cash flow + appreciation estimate')}
      </div>
      <h3>Underwriting Stack</h3>
      <div class="metric-grid">
        ${metric('Total project cost',money(totalCost))}
        ${metric('Cash invested',money(cashInvested))}
        ${metric('Loan amount',money(loan))}
        ${metric('Monthly debt service',money(monthlyDebt))}
        ${metric('Operating expenses',money(opEx),'Monthly incl. vacancy')}
        ${metric('Gross rent multiplier',num(grm,2)+'x')}
      </div>
      <h3>AI Investor Notes</h3>
      <ul class="small-list">
        <li>${cashFlow>=0?'The asset produces positive monthly cash flow under current assumptions.':'Cash flow is negative; renegotiate price, improve rent, reduce debt service, or pass.'}</li>
        <li>${dscr>=1.25?'DSCR is lender-friendly for many rental scenarios.':'DSCR is below a conservative 1.25x threshold; financing risk is elevated.'}</li>
        <li>${breakEven<=85?'Break-even occupancy leaves reasonable vacancy cushion.':'Break-even occupancy is high; vacancy or rent weakness can erase returns quickly.'}</li>
        <li>Use rent comps, tax records, insurance quotes, and lender terms before treating this as final underwriting.</li>
      </ul>
      <p class="cta-row"><button class="btn" onclick="window.print()" type="button">Export / Print Report</button><a class="btn secondary" href="/tools/ai-deal-analyzer.html">Analyze with AI</a></p>`);
  }
  function rehabAnalyzer(){
    const groups={
      'Exterior':['roof','siding','gutters','driveway','landscaping'],
      'Kitchen':['cabinets','countertops','appliances','kitchenFlooring','kitchenLighting'],
      'Bathrooms':['bathVanity','bathShower','bathToilet','bathTile'],
      'Interior':['flooring','paint','doorsTrim','windows','drywall'],
      'Mechanical':['hvac','plumbing','electrical','waterHeater'],
      'Miscellaneous':['demo','permits','dumpster','pest','otherRehab']
    };
    let subtotal=0, rows='', largest={name:'N/A',value:0};
    Object.entries(groups).forEach(([name,ids])=>{
      const sum=ids.reduce((a,id)=>a+v(id),0); subtotal+=sum; if(sum>largest.value) largest={name,value:sum};
      rows+=`<tr><td>${name}</td><td>${money(sum)}</td><td>${subtotal?pct(sum/Math.max(subtotal,1)*100):'0%'}</td></tr>`;
    });
    const sqft=v('squareFeet'), contingencyPct=v('contingency')||15, contingency=subtotal*contingencyPct/100, total=subtotal+contingency, costSf=sqft?total/sqft:0;
    const suggested= subtotal>75000?20:subtotal>35000?15:10;
    let score=85;
    if(costSf>75) score-=25; else if(costSf>45) score-=12;
    if(contingencyPct<suggested) score-=12;
    if(v('hvac')+v('plumbing')+v('electrical')>25000) score-=12;
    score=clamp(Math.round(score),0,100);
    const risk=score>=78?'Controlled':score>=62?'Moderate':'High';
    set(`<div class="report-header"><div><p class="eyebrow">Room-by-Room Rehab Estimator</p><h3>Repair Risk: ${risk}</h3><p class="muted">Use this as pre-inspection budgeting, then validate with contractor bids.</p></div><div class="score-badge"><strong>${score}</strong><span>/100</span></div></div>
      <div class="metric-grid market-read">
        ${metric('Total rehab budget',money(total))}
        ${metric('Base repair subtotal',money(subtotal))}
        ${metric('Contingency reserve',money(contingency),pct(contingencyPct,0)+' applied')}
        ${metric('Cost per sq ft',money(costSf))}
        ${metric('Largest category',largest.name,money(largest.value))}
        ${metric('Suggested contingency',pct(suggested,0),contingencyPct>=suggested?'Adequate':'Increase reserve')}
      </div>
      <h3>Category Breakdown</h3>
      <table class="audit-table"><thead><tr><th>Category</th><th>Budget</th><th>Share</th></tr></thead><tbody>${rows}</tbody></table>
      <h3>AI Repair Notes</h3>
      <ul class="small-list">
        <li>${costSf>60?'Rehab cost per square foot is high; inspect for structural, mechanical, or permit-driven issues.':'Cost per square foot appears within a normal planning range for light-to-moderate work.'}</li>
        <li>${contingencyPct>=suggested?'Contingency reserve is acceptable for this budget range.':'Contingency looks light for the current scope; increase before making a firm offer.'}</li>
        <li>${v('hvac')+v('plumbing')+v('electrical')>25000?'Mechanical systems are a major budget driver; verify HVAC age, panel capacity, plumbing material, and permit requirements.':'Mechanical budget does not appear to dominate the scope.'}</li>
      </ul>
      <p class="cta-row"><button class="btn" onclick="window.print()" type="button">Export / Print Report</button><a class="btn secondary" href="/calculator/mao-calculator.html">Use in MAO</a></p>`);
  }
  function calc(){
    const type=document.body.dataset.calc;
    if(type==='cashFlow'||type==='rentalAnalyzer') return rentalAnalyzer();
    if(type==='rehab') return rehabAnalyzer();
    if(type==='mao'){
      const arv=v('arv'), rule=v('rule')/100, repairs=v('repairs'), fee=v('assignmentFee'), closing=v('closingCosts'), holding=v('holdingCosts');
      const mao=arv*rule-repairs-fee-closing-holding, deductions=repairs+fee+closing+holding;
      set(`<h3>Maximum Allowable Offer</h3><div class="score">${money(mao)}</div><div class="metric-grid">${metric('ARV rule value',money(arv*rule))}${metric('Total deductions',money(deductions))}${metric('Rule used',pct(rule*100,0))}${metric('Desired fee',money(fee))}</div>${insight(mao>0?'This is your ceiling offer before negotiation.':'The assumptions do not support a positive offer.','watch')}`);
    } else if(type==='arv'){
      const ss=v('subjectSqft'), adj=v('conditionAdjustment'); const comps=[[v('comp1Price'),v('comp1Sqft')],[v('comp2Price'),v('comp2Sqft')],[v('comp3Price'),v('comp3Sqft')]].filter(c=>c[0]>0); const avgPrice=comps.reduce((a,c)=>a+c[0],0)/(comps.length||1); const ppsfs=comps.filter(c=>c[1]>0).map(c=>c[0]/c[1]); const avgPpsf=ppsfs.reduce((a,b)=>a+b,0)/(ppsfs.length||1); const ppsfValue=ss&&avgPpsf?ss*avgPpsf:0; const arv=(ppsfValue||avgPrice)+adj;
      set(`<h3>Estimated ARV</h3><div class="score">${money(arv)}</div><div class="metric-grid">${metric('Average comp price',money(avgPrice))}${metric('Average $/sq ft',money(avgPpsf))}${metric('Subject sq ft value',money(ppsfValue))}${metric('Adjustment',money(adj))}</div>${insight('Use recent sold comps within the same neighborhood and similar condition. Sold comps should carry more weight than active listings.')}`);
    } else if(type==='assignment'){
      const fee=v('buyerPrice')-v('contractPrice')-v('transactionCosts')-v('marketingCosts'); const roi=v('emd')?fee/v('emd')*100:0;
      set(`<h3>Assignment Fee Result</h3><div class="score">${money(fee)}</div><div class="metric-grid">${metric('Contract price',money(v('contractPrice')))}${metric('End buyer price',money(v('buyerPrice')))}${metric('Net costs',money(v('transactionCosts')+v('marketingCosts')))}${metric('Return on EMD',pct(roi))}</div>${insight(fee>0?'Positive spread. Confirm the end buyer still has enough margin.':'No assignment spread exists at these numbers.','watch')}`);
    } else if(type==='doubleClose'){
      const spread=v('saleB')-v('purchaseA'), costs=v('closingA')+v('closingB')+v('fundingFee')+v('otherCosts'), profit=spread-costs, margin=v('saleB')?profit/v('saleB')*100:0;
      set(`<h3>Double Close Result</h3><div class="score">${money(profit)}</div><div class="metric-grid">${metric('A-B / B-C spread',money(spread))}${metric('Closing + funding costs',money(costs))}${metric('Net margin',pct(margin))}${metric('Break-even B-C price',money(v('purchaseA')+costs))}</div>${insight(profit>0?'The spread appears sufficient before taxes.':'The spread is too tight for a double close.','watch')}`);
    } else if(type==='landFlip'){
      const basis=v('purchasePrice')+v('closingCosts')+v('dueDiligence')+v('holdingCosts')+v('marketingCosts'), profit=v('resalePrice')-basis, roi=basis?profit/basis*100:0, maxOffer=v('resalePrice')-v('closingCosts')-v('dueDiligence')-v('holdingCosts')-v('marketingCosts')-v('targetProfit');
      set(`<h3>Land Flip Result</h3><div class="score">${money(profit)}</div><div class="metric-grid">${metric('Total basis',money(basis))}${metric('ROI',pct(roi))}${metric('Max offer for target profit',money(maxOffer))}${metric('Target profit',money(v('targetProfit')))}</div>${insight('Prioritize land-only sold comps, zoning, flood/wetland risk, road access, utilities, setbacks, and nearby new construction demand.')}`);
    } else if(type==='roi'){
      const roi=v('cashInvested')?v('netProfit')/v('cashInvested')*100:0, ann=v('cashInvested')&&v('holdMonths')?roi*(12/v('holdMonths')):0, multiple=v('cashInvested')?(v('cashInvested')+v('netProfit'))/v('cashInvested'):0, margin=v('salePrice')?v('netProfit')/v('salePrice')*100:0;
      set(`<h3>ROI Result</h3><div class="score">${pct(roi)}</div><div class="metric-grid">${metric('Net profit',money(v('netProfit')))}${metric('Annualized ROI',pct(ann))}${metric('Equity multiple',num(multiple,2)+'x')}${metric('Profit margin',pct(margin))}</div>${insight('Compare ROI against risk and time. A short, lower-profit deal can beat a larger profit that ties up capital too long.')}`);
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
    document.querySelectorAll('[data-auto-calc] input,[data-auto-calc] select').forEach(i=>i.addEventListener('change',calc));
  });
})();
