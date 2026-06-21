function dcTrack(name, params={}){try{if(window.gtag)gtag('event',name,params)}catch(e){}}
function dcHasSupabaseConfig(){return window.DEALCALC_SUPABASE_URL && !String(window.DEALCALC_SUPABASE_URL).includes('REPLACE_WITH') && window.DEALCALC_SUPABASE_ANON_KEY && !String(window.DEALCALC_SUPABASE_ANON_KEY).includes('REPLACE_WITH')}
function dcClient(){if(!dcHasSupabaseConfig() || !window.supabase)return null; return window.supabase.createClient(window.DEALCALC_SUPABASE_URL, window.DEALCALC_SUPABASE_ANON_KEY)}
function dcLocalDeals(){try{return JSON.parse(localStorage.getItem('dealcalc_saved_deals')||'[]')}catch(e){return []}}
function dcSetLocalDeals(deals){localStorage.setItem('dealcalc_saved_deals',JSON.stringify(deals||[]))}
async function dcCurrentUser(){const sb=dcClient(); if(!sb)return null; const {data}=await sb.auth.getUser(); return data?.user||null}
async function dcUpdateNav(){
  const nav=document.querySelector('.site-header nav'); if(!nav)return;
  const user=await dcCurrentUser();
  const existing=nav.querySelector('[data-auth-link]'); if(existing)existing.remove();
  const a=document.createElement('a'); a.dataset.authLink='true';
  a.href=user?'/dashboard.html':'/auth.html'; a.textContent=user?'Dashboard':'Login'; nav.appendChild(a);
}
async function dcSignup(){
  const email=document.getElementById('authEmail')?.value?.trim(); const password=document.getElementById('authPassword')?.value; const msg=document.getElementById('authMsg');
  if(!email||!password){if(msg)msg.textContent='Enter email and password.'; return}
  const sb=dcClient(); if(!sb){if(msg)msg.textContent='Add Supabase URL and anon key in assets/js/supabase-config.js first.'; return}
  const {error}=await sb.auth.signUp({email,password});
  if(msg)msg.textContent=error?error.message:'Account created. Check your email if confirmation is enabled, then log in.';
  dcTrack('signup_attempt',{success:!error});
}
async function dcLogin(){
  const email=document.getElementById('authEmail')?.value?.trim(); const password=document.getElementById('authPassword')?.value; const msg=document.getElementById('authMsg');
  if(!email||!password){if(msg)msg.textContent='Enter email and password.'; return}
  const sb=dcClient(); if(!sb){if(msg)msg.textContent='Add Supabase URL and anon key in assets/js/supabase-config.js first.'; return}
  const {error}=await sb.auth.signInWithPassword({email,password});
  if(error){if(msg)msg.textContent=error.message; dcTrack('login_attempt',{success:false}); return}
  dcTrack('login_attempt',{success:true}); window.location.href='/dashboard.html';
}
async function dcGoogleLogin(){
  const sb=dcClient(); const msg=document.getElementById('authMsg');
  if(!sb){if(msg)msg.textContent='Add Supabase URL and anon key in assets/js/supabase-config.js first.'; return}
  await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin+'/dashboard.html'}});
}
async function dcLogout(){const sb=dcClient(); if(sb)await sb.auth.signOut(); window.location.href='/';}
function dcSnapshotDeal(){
  const ids=['propertyLabel','propertyType','analysisType','listingPrice','purchasePrice','analyzerArv','analyzerRepairs','assignmentFee','closingCosts','holdingCosts','loanBalance','monthlyRent','monthlyExpenses','salePrepCosts','documentNotes'];
  const data={}; ids.forEach(id=>{const el=document.getElementById(id); if(el)data[id]=el.value||''});
  const result=document.getElementById('analysisResult');
  const scoreText=result?.querySelector('.score-badge strong')?.textContent || '';
  const verdict=result?.querySelector('.verdict strong')?.textContent || '';
  const address=data.propertyLabel || 'Untitled Deal';
  return {address,property_type:data.propertyType||'unknown',analysis_type:data.analysisType||'auto',score:parseInt(scoreText)||null,verdict,inputs:data,report_html:result?.innerHTML||'',created_at:new Date().toISOString()};
}
async function dcSaveCurrentDeal(){
  const msg=document.getElementById('saveDealMsg'); const deal=dcSnapshotDeal();
  if(!deal.report_html){if(msg)msg.textContent='Run an analysis first.'; return}
  const sb=dcClient(); const user=await dcCurrentUser();
  if(sb && user){
    const row={user_id:user.id,address:deal.address,property_type:deal.property_type,analysis_type:deal.analysis_type,score:deal.score,verdict:deal.verdict,inputs:deal.inputs,report_html:deal.report_html};
    const {error}=await sb.from('deals').insert(row);
    if(error){if(msg)msg.textContent=error.message; return}
    if(msg)msg.textContent='Saved to your dashboard.'; dcTrack('deal_saved',{storage:'supabase'}); return;
  }
  const deals=dcLocalDeals(); deals.unshift({...deal,id:crypto.randomUUID?crypto.randomUUID():String(Date.now())}); dcSetLocalDeals(deals.slice(0,50));
  if(msg)msg.innerHTML='Saved locally. <a href="/auth.html">Create an account</a> to save across devices.'; dcTrack('deal_saved',{storage:'local'});
}
async function dcLoadDashboard(){
  const box=document.getElementById('dashboardDeals'); if(!box)return;
  const sb=dcClient(); const user=await dcCurrentUser();
  document.getElementById('dashboardUserEmail') && (document.getElementById('dashboardUserEmail').textContent=user?.email||'Local mode');
  let deals=[];
  if(sb && user){const {data,error}=await sb.from('deals').select('*').order('created_at',{ascending:false}).limit(50); if(error){box.innerHTML='<p class="muted">Could not load saved deals: '+error.message+'</p>'; return} deals=data||[];}
  else {deals=dcLocalDeals();}
  if(!deals.length){box.innerHTML='<div class="card"><h3>No saved deals yet.</h3><p class="muted">Run the AI Deal Analyzer and click Save Deal.</p><a class="btn" href="/tools/ai-deal-analyzer.html">Analyze a Deal</a></div>'; return}
  box.innerHTML=deals.map(d=>`<div class="card deal-card"><div class="deal-card-top"><div><h3>${escapeHtml(d.address||'Untitled Deal')}</h3><p class="muted">${escapeHtml(d.property_type||'Property')} · ${escapeHtml(d.analysis_type||'Analysis')} · ${new Date(d.created_at).toLocaleDateString()}</p></div><div class="mini-score">${d.score||'—'}</div></div><p><strong>${escapeHtml(d.verdict||'Saved analysis')}</strong></p><button class="btn secondary" onclick='dcOpenSavedDeal(${JSON.stringify(d.id||d.created_at)})'>View Details</button></div>`).join('');
}
function dcOpenSavedDeal(id){
  const deals=dcLocalDeals(); const d=deals.find(x=>(x.id||x.created_at)===id); const modal=document.getElementById('savedDealDetail'); if(!modal||!d)return;
  modal.innerHTML=`<div class="card"><h2>${escapeHtml(d.address||'Saved Deal')}</h2><div>${d.report_html||'<p>No report saved.</p>'}</div></div>`;
}
function escapeHtml(str=''){return String(str).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]))}
document.addEventListener('DOMContentLoaded',()=>{dcUpdateNav(); dcLoadDashboard();});
