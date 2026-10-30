// Start from, history rows, past cycles, balance difference, backup before import, sorting, return from Add account.
const L=require('./lib.js');const G=L.G;const fs=require('fs');const j=x=>JSON.stringify(x);const ck=(n,c,e)=>console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+(e||'')));
const day=r=>new Date(r.ts*1000).toISOString().slice(0,10);
const balBefore=(f,d)=>{const r=f.rows.find(x=>day(x)>=d);return r.before/100;};
const st=p=>p.evaluate(()=>({bal:acctBalance(S.accounts[0]),aud:audit().diff,issues:audit().issues.length,uns:unsortedTotal(),lo:potBalance(sweepTarget()),ta:toAssign(),safe:safeToday(),tx:S.tx.length,feed:S.feed.length,hist:S.tx.filter(t=>t.type==='hist').length,unsDates:S.tx.filter(t=>t.uns).map(t=>t.date).sort()}));
async function run(p,from,mode){ // mode: 'fix' | 'keep'
  await p.evaluate(f=>{V.imp.from=f;render();},from);
  const need=await p.evaluate(()=>stmtPlan(V.imp).needsReview);
  if(need){await L.click(p,'stmt-go','','review');}
  await L.click(p,'stmt-go','',mode||'keep');
}
(async()=>{
 const f=G.write('imp.xlsx',{seed:5,start:'2026-08-03',days:90}),X=f.expected;console.log('generated',j(X));
 // ---- A. default start is the first day of the current cycle
 let p=await L.fresh(Math.round(balBefore(f,'2026-10-22')),'2026-10-01');
 await L.pickFile(p,f.path);
 const cs=await p.evaluate(()=>cyc());
 ck('Start from defaults to the first day of the current cycle',await p.evaluate(()=>V.imp.from)===cs&&cs==='2026-10-22',cs);
 ck('it can move back to the first row of the statement',await p.evaluate(()=>{const e=document.getElementById('imp-from');return e.min===V.imp.p.from;}));
 await p.evaluate(()=>{const e=document.getElementById('imp-from');e.value='2026-08-03';e.dispatchEvent(new Event('change',{bubbles:true}));});
 ck('the old clamp to the app start date is gone',await p.evaluate(()=>V.imp.from)==='2026-08-03');
 await p.b.close();

 // ---- B. current cycle only: no confirm unless there is a difference, hand entry is matched
 p=await L.fresh(Math.round(balBefore(f,'2026-10-22')),'2026-10-01'); await L.pickFile(p,f.path);
 const pay=f.rows.find(r=>day(r)>='2026-10-22'&&r.fee>0&&r.ben&&r.ben!==f.holder);
 const food=await p.evaluate(()=>S.budgets.find(b=>b.name==='Food').id);
 await p.evaluate(([b,a,d])=>{S.tx.push({id:uid(),type:'out',budgetId:b,amount:a,date:d,account:S.accounts[0].id,note:'mine',at:Date.now()});save();},[food,(pay.deb-pay.fee)/100,day(pay)]);
 const plB=await p.evaluate(()=>{const x=stmtPlan(V.imp);return {matched:x.matched,cycles:x.cycles,diff:x.diff,rev:x.needsReview,hist:x.hist}});
 ck('hand entry matched, not doubled',plB.matched===1,j(plB));
 ck('this cycle only, rounding only: no review step',plB.cycles===0&&Math.abs(plB.diff)<1&&!plB.rev&&plB.hist===0,j(plB));
 await L.click(p,'stmt-go','','keep');
 const sB=await st(p);
 ck('closing balance equals the statement',Math.abs(sB.bal-X.closing)<0.005,sB.bal);ck('conserved',Math.abs(sB.aud)<0.01&&sB.issues===0);
 ck('matched entry now holds the statement amount, fees included',await p.evaluate(()=>{const m=S.tx.filter(t=>t.note==='mine')[0],fr=S.feed.find(x=>x.tx.indexOf(m.id)>=0);return !!fr&&Math.abs(m.amount-Math.abs(fr.m))<0.01&&m.amount>0;}));
 const safeNow=sB.safe; const loNow=sB.lo;
 await p.b.close();

 // ---- C. back to the first row, app started in September: history, past cycles, confirm, backup
 const SD=[...Array(28)].map((_,i)=>'2026-09-'+String(i+1).padStart(2,'0')).find(d=>{try{return balBefore(f,d)>30000}catch(e){return false}});console.log('app start used',SD);
 const startBal=balBefore(f,SD);
 p=await L.fresh(Math.round(startBal),SD); await L.pickFile(p,f.path);
 const pre=await p.evaluate(()=>({tx:S.tx.length,lo:potBalance(sweepTarget())}));
 await p.evaluate(()=>{V.imp.from='2026-08-03';render();});
 const plC=await p.evaluate(()=>{const x=stmtPlan(V.imp);return {hist:x.hist,cycles:x.cycles,diff:x.diff,rev:x.needsReview,pastUns:x.pastUns,pastIn:x.pastIn,recDate:x.recDate,stBal:x.stBal,exp:x.exp}});console.log('plan',j(plC));
 const expHist=f.rows.filter(r=>day(r)<SD).length;
 ck('rows before the app started are counted as history',plC.hist>0&&plC.hist<=expHist,j([plC.hist,expHist]));
 ck('balance is compared at the app start date',plC.recDate===SD&&Math.abs(plC.stBal-startBal)<0.005&&Math.abs(plC.diff)<1,j(plC));
 const nCycles=await p.evaluate(()=>{const s={};stmtPlan(V.imp).add.forEach(e=>{if(e.it.d<cyc())s[cycOf(e.it.d)]=1});return Object.keys(s).length});
 ck('past cycles counted',plC.cycles===nCycles&&nCycles>=2,j([plC.cycles,nCycles]));
 await L.click(p,'stmt-go','','review');
 const txtC=await p.evaluate(()=>document.querySelector('.sheet').innerText.replace(/\s+/g,' '));console.log(txtC.slice(0,520));
 ck('review screen shows past cycles, history and the statement balance',/Past cycles added/.test(txtC)&&/Before the app started/.test(txtC)&&/Statement balance on/.test(txtC)&&/Confirm and import/.test(txtC));
 const [dl]=await Promise.all([p.waitForEvent('download'),L.click(p,'stmt-go','','keep')]);
 const bk=JSON.parse(fs.readFileSync(await dl.path(),'utf8'));
 ck('a backup file downloads before the import',/before-import/.test(dl.suggestedFilename())&&bk.app==='KoboCTRL'&&bk.tx.length===pre.tx,dl.suggestedFilename()+' '+bk.tx.length+' vs '+pre.tx);
 const sC=await st(p);console.log('after',j({bal:sC.bal,aud:sC.aud,hist:sC.hist,uns:sC.uns,lo:sC.lo,ta:sC.ta,safe:sC.safe}));
 ck('closing balance equals the statement',Math.abs(sC.bal-X.closing)<0.005,sC.bal);
 ck('conserved',Math.abs(sC.aud)<0.01&&sC.issues===0,j(sC.aud));
 ck('history rows exist and change no balance',sC.hist===plC.hist&&sC.hist>0);
 ck('nothing from past cycles is left unsorted',sC.unsDates.every(d=>d>='2026-10-22'),j(sC.unsDates.slice(0,3)));
 ck('Safe to spend is the same as importing this cycle alone',sC.safe===safeNow,sC.safe+' vs '+safeNow);
 ck('money in from past cycles reached Leftovers',Math.abs((sC.lo-pre.lo)-(plC.pastIn-plC.pastUns))<0.5,j([sC.lo,pre.lo,plC.pastIn,plC.pastUns]));
 const cr=await require('./crawl.js').crawl(p,'imported'); ck('no broken text on any screen after importing history',cr.length===0,cr.slice(0,3).join(' | '));
 // restore the backup
 await p.evaluate(t=>applyRestore(JSON.parse(t)),JSON.stringify(bk)); const rs=await p.evaluate(()=>({tx:S.tx.length,feed:S.feed.length,hist:S.tx.filter(t=>t.type==='hist').length}));
 ck('the backup restores the state from before the import',rs.tx===pre.tx&&rs.hist===0,j(rs));
 await p.b.close();

 // ---- D. balance difference: shown, confirmed, corrected two ways
 for(const sign of [1,-1]){
   p=await L.fresh(Math.round(startBal)+sign*5000,SD); await L.pickFile(p,f.path); await p.evaluate(()=>{V.imp.from='2026-08-03';render();});
   const pl=await p.evaluate(()=>{const x=stmtPlan(V.imp);return {diff:x.diff,net:x.pastIn-x.pastUns}});
   ck('difference of '+(sign>0?'+':'-')+'5000 is found (statement minus app)',Math.abs(pl.diff-(-sign*5000))<1,j(pl));
   await L.click(p,'stmt-go','','review'); const t=await p.evaluate(()=>document.querySelector('.sheet').innerText.replace(/\s+/g,' '));
   ck('review shows the difference and both choices',/Difference/.test(t)&&/Correct my balance and import/.test(t)&&/Import without correcting/.test(t));
   const before=await p.evaluate(()=>({lo:potBalance(sweepTarget()),ta:toAssign()}));
   await L.click(p,'stmt-go','','fix'); const s=await st(p);
   ck('after correcting, balance equals the statement',Math.abs(s.bal-X.closing)<0.005,s.bal);
   ck('after correcting, every naira still has one place',Math.abs(s.aud)<0.01&&s.issues===0,j(s.aud));
   ck(sign>0?'a shortfall comes out of Leftovers':'money the statement has and the app lacked lands in Leftovers',Math.abs((s.lo-before.lo)-(pl.net-sign*5000))<1.5,j([s.lo,before.lo,pl.net]));
   await p.b.close();
 }
 p=await L.fresh(Math.round(startBal)+5000,SD); await L.pickFile(p,f.path); await p.evaluate(()=>{V.imp.from='2026-08-03';render();}); await L.click(p,'stmt-go','','review'); await L.click(p,'stmt-go','','keep');
 const sK=await st(p); ck('without correcting, the difference stays visible in the balance',Math.abs(sK.bal-(X.closing+5000))<1,sK.bal); await p.b.close();

 // ---- E. a later import does not correct twice
 p=await L.fresh(Math.round(startBal)+5000,SD); await L.pickFile(p,f.path); await p.evaluate(()=>{V.imp.from='2026-10-22';render();});
 await L.click(p,'stmt-go','','review'); await L.click(p,'stmt-go','','fix');
 await p.evaluate(()=>{closeSheet();V.imp=null;V.tab='settings';render();}); await L.pickFile(p,f.path); await p.evaluate(()=>{V.imp.from='2026-10-22';render();});
 const again=await p.evaluate(()=>{const x=stmtPlan(V.imp);return {diff:x.diff,add:x.add.length}});
 ck('importing again finds no new difference and no new rows',again.diff===0&&again.add===0,j(again));
 await p.b.close();

 // ---- F. sorting, own account, close, delete (current cycle import)
 p=await L.fresh(Math.round(balBefore(f,'2026-10-22')),'2026-10-01');
 await p.evaluate(()=>{S.accounts.push({id:'opay1',name:'Opay',role:'other',start:0});save();});
 await L.pickFile(p,f.path); await L.click(p,'stmt-go','','keep');
 ck('sort list opens after import',await p.evaluate(()=>V.sheet&&V.sheet.type)==='feed');
 const row=await p.evaluate(()=>{const c={};S.feed.forEach((x,i)=>{if(x.st==='uns'&&x.m<0&&x.y&&x.y.startsWith('p:')&&!x.o){(c[x.y]=c[x.y]||[]).push(i)}});const k=Object.keys(c).sort((a,b)=>c[b].length-c[a].length)[0];return {k,idx:c[k][0],n:c[k].length,sum:c[k].reduce((t,i)=>t+Math.abs(S.feed[i].m),0)}});console.log('payee',j(row));
 const trn=await p.evaluate(()=>S.budgets.find(b=>b.name==='Transport').id);
 await L.click(p,'feed-open',String(row.idx)); await p.evaluate(t=>{document.getElementById('fr-b').value=t;},trn);
 const b0=await p.evaluate(()=>unsortedTotal()); await L.click(p,'feed-save',String(row.idx));
 const a0=await p.evaluate(()=>({uns:unsortedTotal(),rule:Object.keys(S.rules.pay).length,aud:audit().diff}));
 ck('every row for that payee is sorted at once',Math.abs((b0-a0.uns)-row.sum)<0.01,j([b0,a0,row]));ck('conserved after sorting',Math.abs(a0.aud)<0.01);ck('payee remembered',a0.rule===1);
 // ---- G. Add account returns to the row
 const own=await p.evaluate(()=>S.feed.findIndex(x=>x.st==='uns'&&x.m<0));
 await L.click(p,'feed-open',String(own)); await L.click(p,'feed-mode','','own'); await L.click(p,'feed-add-account',String(own));
 ck('Add account opens the account sheet',await p.evaluate(()=>V.sheet.type)==='edit-account');
 await L.set(p,{'a-name':'Kuda Savings','a-start':'0'}); await L.click(p,'save-account','');
 const back=await p.evaluate(()=>({t:V.sheet&&V.sheet.type,i:V.sheet&&V.sheet.data.i,mode:V.sheet&&V.sheet.data.mode,sel:document.getElementById('fr-a')&&document.getElementById('fr-a').selectedOptions[0].text}));
 ck('after saving, the row being sorted is back on screen',back.t==='feed-row'&&String(back.i)===String(own)&&back.mode==='own',j(back));
 ck('the new account is already chosen',back.sel==='Kuda Savings',j(back));
 ck('Back from the row still returns to the list',await p.evaluate(()=>{closeSheet();return V.sheet&&V.sheet.type;})==='feed');
 // own account move
 const mv=await p.evaluate(()=>S.feed.findIndex((x,i)=>x.st==='uns'&&x.m<0&&i!==-1));
 const bb=await p.evaluate(()=>[acctBalance(S.accounts[0]),acctBalance(S.accounts[1])]);
 await L.click(p,'feed-open',String(mv)); await L.click(p,'feed-mode','','own'); await p.evaluate(()=>{document.getElementById('fr-a').value='opay1';document.getElementById('fr-rem').checked=false;}); await L.click(p,'feed-save',String(mv));
 const ex=await p.evaluate(i=>Math.abs(S.feed[i].m)-S.feed[i].c,mv); const ba=await p.evaluate(()=>[acctBalance(S.accounts[0]),acctBalance(S.accounts[1]),audit().diff]);
 ck('own-account move: money arrives net of the fee, total unchanged',Math.abs(ba[1]-bb[1]-ex)<0.01&&Math.abs(ba[2])<0.01,j([bb,ba,ex]));
 // close
 const lo=await p.evaluate(()=>({before:potBalance(sweepTarget()),uns:unsortedTotal()}));
 const cv=await p.evaluate(()=>{const v=convertUnsAtClose('2099-01-01',sweepTarget());return {v,after:potBalance(sweepTarget()),uns:unsortedTotal(),aud:audit().diff}});
 ck('close moves unsorted into Leftovers and keeps conservation',cv.uns===0&&Math.abs(cv.aud)<0.01&&Math.abs((lo.before-cv.after)-cv.v)<0.01);
 const dropped=await p.evaluate(()=>{const x=S.feed.find(y=>y.st==='ok'&&y.tx.length);const id=x.tx[0];S.tx=S.tx.filter(t=>t.id!==id);dropFeedFor(id);return x.st});
 ck('deleting an imported entry drops its feed row',dropped==='drop');
 console.log('errs',j(p.errs));await p.b.close();
})().catch(e=>{console.log('FAIL crashed',e.message);process.exit(1);});
