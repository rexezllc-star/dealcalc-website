
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    if(document.querySelector('.sticky-quick')) return;
    var div=document.createElement('div'); div.className='sticky-quick';
    div.innerHTML='<a href="/tools/ai-deal-analyzer.html">Analyze Deal</a><a href="/calculators.html">Calculators</a><a href="/learn/">Learn</a>';
    document.body.appendChild(div);
  });
})();
