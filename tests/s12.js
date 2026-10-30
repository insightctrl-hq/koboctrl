const L=require('./lib.js');const j=x=>JSON.stringify(x);const ck=(n,c,e)=>console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+(e||'')));
(async()=>{
let p=await L.boot('2026-11-02T09:00:00');
const base={source:'salary',incAmt:'250000',incEvery:'month',next:'2026-11-22',apps:[{name:'Moniepoint',bal:'250000'}],food:'2000',foodPer:'day',transport:'1000',transportPer:'day',data:'10000',dataPer:'month'};
await p.evaluate(a=>{S=freshState();V.setup={step:0,a:a};buildFromSetup();render();},base); await L.click(p,'opening'); await L.click(p,'confirm-split');
const fid=await p.evaluate(()=>S.budgets.find(b=>b.name==='Food').id);
const info=()=>p.evaluate(()=>{const f=S.budgets.find(b=>b.name==='Food');const v=budgetView(f);return {day:today(),limit:v.limit,left:v.left,leftMonth:v.leftMonth,toAssign:toAssign(),aud:audit().diff}});
console.log('day1',j(await info()));
await p.evaluate(()=>{const f=S.budgets.find(b=>b.name==='Food');S.tx.push({id:uid(),type:'out',budgetId:f.id,amount:20000,date:today(),account:S.accounts[0].id});save();});
let i=await info();console.log('after 20000',j(i)); 
await p.clock.setSystemTime(new Date(2026,10,3,9,0)); i=await info();console.log('day2',j(i));
ck('day2 limit honest (<2000, >0)',i.limit>0&&i.limit<2000);
ck('limit*days left <= fund', i.limit*(await p.evaluate(()=>cycDaysLeft()))<=i.leftMonth+10);
await p.evaluate(()=>{S.tx.push({id:uid(),type:'out',budgetId:S.budgets.find(b=>b.name==='Food').id,amount:1000,date:today(),account:S.accounts[0].id});save();});
// refill
await L.sheet(p,'budget',{id:fid});
ck('refill button shown',(await p.textContent('.sheet')).includes('Add money to Food'));
await L.click(p,'refill-spend',fid);
ck('topup sheet opens',await p.evaluate(()=>V.sheet&&V.sheet.type)==='topup');
console.log((await p.evaluate(()=>document.querySelector('.sheet').innerText.replace(/\s+/g,' '))).slice(0,300));
const src=await p.evaluate(()=>Array.from(document.querySelectorAll('[data-act="topup-from"]')).map(e=>e.getAttribute('data-v')+':'+e.textContent));console.log(j(src));
await p.evaluate(()=>{});
await L.click(p,'topup-from',fid,await p.evaluate(()=>sweepTarget().id));
i=await info();console.log('after refill',j(i));
ck('limit back to 2000',i.limit===2000);ck('conserved',i.aud===0);
await p.b.close();})();
