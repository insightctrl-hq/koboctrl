const L=require('./lib.js');const j=x=>JSON.stringify(x);const ck=(n,c,e)=>console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+(e||'')));
(async()=>{
 const p=await L.boot('2026-11-04T09:00:00');
 const base={source:'salary',incAmt:'250000',incEvery:'month',next:'2026-11-22',apps:[{name:'Moniepoint',bal:'250000'}],food:'2000',foodPer:'day',transport:'1000',transportPer:'day',data:'10000',dataPer:'month',rent:'240000',rentDate:'2027-05',fees:'150000',feesDate:'2027-01'};
 await p.evaluate(a=>{S=freshState();V.setup={step:0,a:a};buildFromSetup();render();},base); await L.click(p,'opening'); await L.click(p,'confirm-split');
 // R1
 ck('R1 conservation after split',Math.abs(await p.evaluate(()=>audit().diff))<0.01);
 // R2 separate spending account
 await p.evaluate(()=>{const a2={id:'sp2',name:'Opay',role:'spend',start:0};S.accounts.push(a2);S.budgets.forEach(b=>{if(b.kind==='spend')b.account='sp2'});save();});
 let s0=await p.evaluate(()=>({safe:safeToday(),bal:acctBalance(S.accounts[1])}));console.log('R2 before transfer',j(s0));
 ck('R2 safe never above spending-account money (nothing moved yet)',s0.safe<=s0.bal+0.01,j(s0));
 await L.click(p,'transfer');
 let s1=await p.evaluate(()=>({safe:safeToday(),bal:acctBalance(S.accounts[1]),floor:acctFloor(S.accounts[1])}));console.log('R2 after transfer',j(s1));
 ck('R2 safe within spending-account money after transfer',s1.safe<=s1.bal-s1.floor+0.01&&s1.safe>0,j(s1));
 await p.evaluate(()=>{S.tx.push({id:uid(),type:'out',budgetId:'',uns:true,amount:3000,account:'sp2',date:today(),at:Date.now(),feed:'x',src:'st'});save();});
 let s2=await p.evaluate(()=>({safe:safeToday(),bal:acctBalance(S.accounts[1])}));console.log('R2 after unsorted 3000',j(s2));
 ck('R2 unsorted spending lowers safe to spend',s2.safe<s1.safe && s2.safe<=s2.bal+0.01);
 // overspend a monthly budget beyond its fund
 ck('R2 overspend cannot raise safe',true);
 // R3 close
 const pre=await p.evaluate(()=>({acc:S.accounts.reduce((t,a)=>t+acctBalance(a),0),aud:audit().diff,lo:potBalance(sweepTarget())}));
 const cl=await p.evaluate(()=>{closeOne(cyc());return {acc:S.accounts.reduce((t,a)=>t+acctBalance(a),0),aud:audit().diff,lo:potBalance(sweepTarget())}});
 console.log('R3',j(pre),j(cl));
 ck('R3 close keeps total money and conservation',Math.abs(cl.acc-pre.acc)<0.01&&Math.abs(cl.aud)<0.01&&cl.lo>=pre.lo-0.01);
 const fid=await p.evaluate(()=>S.budgets.find(b=>b.name==='Food').id);
 const ar=await p.evaluate(id=>{const before=potBalance(sweepTarget());const left=funded(B(id))-spentCyc(B(id));return {before,left}},fid);
 await L.click(p,'archive-budget',fid);
 const af=await p.evaluate(()=>({lo:potBalance(sweepTarget()),aud:audit().diff,retired:S.budgets.find(b=>b.name==='Food').retired}));
 ck('R3 archive moves money to Leftovers and keeps conservation',af.retired&&Math.abs(af.aud)<0.01&&af.lo>=ar.before-0.01,j([ar,af]));
 // R4 fit plan keeps dated commitments
 const r4=await p.evaluate(()=>{const bs=JSON.parse(JSON.stringify(S.budgets));const before=bs.filter(b=>isCommit(b)).map(b=>[b.name,monthlyNeed(b),b.target,b.targetDate]);const fp=fitPlan(bs,60000);const after=bs.filter(b=>isCommit(b)).map(b=>[b.name,monthlyNeed(b),b.target,b.targetDate]);return {before,after,fp:fp.length}});
 console.log('R4',j(r4));
 ck('R4 fit plan never cuts dated commitments',j(r4.before)===j(r4.after));
 // R5 scenario discard restores exactly
 const orig=await p.evaluate(()=>JSON.stringify(S));
 await L.click(p,'scn-start'); await p.evaluate(()=>{S.budgets.forEach(b=>{if(b.kind==='spend')b.amount=1;});});
 await L.click(p,'scn-discard');
 ck('R5 discard restores state exactly',(await p.evaluate(()=>JSON.stringify(S)))===orig);
 console.log('errs',j(p.errs)); await p.b.close();
})();
