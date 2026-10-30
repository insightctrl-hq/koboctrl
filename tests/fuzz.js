const L=require('./lib.js');
const j=x=>JSON.stringify(x);
function rng(seed){ let s=seed; return ()=>{ s=(s*1664525+1013904223)%4294967296; return s/4294967296; }; }
(async()=>{
const seed=+process.argv[2]||1, N=+process.argv[3]||150, R=rng(seed);
const p=await L.boot('2026-11-02T09:00:00');
const kinds=['salary','allowance','mix'];
const src=kinds[seed%3];
const weekly=src==='allowance';
await p.evaluate(([src,weekly])=>{V.setup.a={source:src,hustle:src==='mix',incAmt:weekly?'10000':'250000',incEvery:weekly?'week':'month',next:src==='mix'?'':addDays(today(),weekly?3:20),apps:[{name:'A',bal:weekly?'6000':'250000'}],food:weekly?'700':'2000',foodPer:'day',transport:weekly?'300':'1000',transportPer:'day',data:weekly?'1500':'10000',dataPer:weekly?'week':'month',rent:src==='allowance'?'':'240000',rentDue:'2027-06',fees:'',family:weekly?'1000':'25000',bizcost:'10000',fitChoice:'fit'};buildFromSetup();render();},[src,weekly]);
await L.click(p,'opening');await L.click(p,'confirm-split');
const viol=[]; let day=new Date(2026,10,2,9,0);
const names=()=>p.evaluate(()=>S.budgets.filter(b=>!b.retired).map(b=>[b.id,b.name,b.kind]));
for(let i=0;i<N;i++){
  const r=R(); let op='';
  try{
  const bs=await names();
  if(r<0.35){ // spend
    const sp=bs.filter(b=>['spend','bill','refill'].includes(b[2])); const b=sp[Math.floor(R()*sp.length)]; const amt=Math.round(R()*R()*8000/100)*100+100; op='spend '+b[1]+' '+amt;
    await L.sheet(p,'log',{budgetId:b[0]}); await L.set(p,{'f-amt':String(amt),'f-note':'x','f-bud':b[0]}); await L.click(p,'save-log'); if(await p.evaluate(()=>V.sheet&&V.sheet.type)==='overcheck') await L.click(p,'over-log');
  } else if(r<0.5){ // advance day(s)
    const d=1+Math.floor(R()*4); day=new Date(day.getTime()+d*864e5); op='advance '+d; await p.clock.setSystemTime(day);
  } else if(r<0.6){ // income
    const amt=Math.round((R()<0.5?(weekly?10000:250000):R()*30000)/100)*100+100; op='income '+amt; await L.sheet(p,'log',{mode:'in'}); await L.set(p,{'f-amt':String(amt),'f-src':'x'}); await L.click(p,'save-log');
  } else if(r<0.72){ op='split'; if(await p.evaluate(()=>toAssign())>0){ await L.sheet(p,'split'); await L.click(p,'confirm-split'); } }
  else if(r<0.78){ op='pay bills'; for(const b of bs.filter(b=>b[2]==='bill')){ const due=await p.evaluate(id=>{var b=B(id),v=budgetView(b);return b.amount-v.paid;},b[0]); if(due>0) await L.click(p,'pay-bill',b[0]); } }
  else if(r<0.84){ // withdraw from a pot
    const pots=bs.filter(b=>b[2]==='pot'||b[2]==='floor'); const b=pots[Math.floor(R()*pots.length)]; const bal=await p.evaluate(id=>potBalance(B(id)),b[0]); if(bal>100){ const amt=Math.max(100,Math.round(bal*R()/100)*100); op='withdraw '+b[1]+' '+amt; await L.sheet(p,'withdraw',{id:b[0]}); await L.set(p,{'f-amt':String(amt),'f-why':'x'}); await L.click(p,'withdraw',b[0]); } }
  else if(r<0.9){ // edit amount
    const sp=bs.filter(b=>['spend','bill'].includes(b[2])); const b=sp[Math.floor(R()*sp.length)]; const f=0.5+R(); op='edit '+b[1]+' x'+f.toFixed(2); const cur=await p.evaluate(id=>B(id).amount,b[0]); await L.sheet(p,'edit-simple',{id:b[0]}); await L.set(p,{'q-amt':String(Math.round(cur*f/100)*100||100)}); await L.click(p,'save-simple',b[0]);
    if(R()<0.6){ const tp=await p.evaluate(()=>Object.keys(S.topups||{})); for(const id of tp){ await L.click(p,'topup',id); const st=await p.evaluate(()=>V.sheet&&V.sheet.type); if(st==='topup'){ const srcs=await p.evaluate(()=>Array.from(document.querySelectorAll('[data-act="topup-from"]')).map(e=>e.getAttribute('data-v'))); if(srcs.length) await L.click(p,'topup-from',id,srcs[0]); } } }
  } else if(r<0.94){ op='unassign'; if(await p.evaluate(()=>toAssign())<=-100) await L.click(p,'unassign'); }
  else if(r<0.97){ op='undo'; await L.click(p,'undo'); }
  else { op='check'; }
  await p.evaluate(()=>{ if(V.sheet&&['overcheck','cooldown'].includes(V.sheet.type)) closeSheet(); render(); });
  const a=await p.evaluate(()=>audit());
  if(Math.abs(a.diff)>1&&!(op==='undo')) viol.push(i+' '+op+' diff '+a.diff+' accts '+a.accts+' ta '+a.toAssign);
  if(a.issues.length) viol.push(i+' '+op+' issues '+a.issues);
  const bad=await p.evaluate(()=>{ const t=document.getElementById('app').textContent; return /NaN|undefined|Infinity/.test(t)?t.match(/.{30}(NaN|undefined|Infinity).{30}/)[0]:'' ; });
  if(bad) viol.push(i+' '+op+' TEXT '+bad);
  }catch(e){ viol.push(i+' '+op+' CRASH '+e.message.slice(0,140)); await p.evaluate(()=>{V.sheet=null;render();}); }
  if(p.errs.length){ viol.push(i+' '+op+' PAGEERR '+p.errs.splice(0).join('|').slice(0,160)); }
  if(viol.length>8) break;
}
console.log('seed',seed,src,weekly?'weekly':'',viol.length?viol.join('\n'):'FUZZ CLEAN');
await p.b.close();
})();
