const L=require('./lib.js');
const j=x=>JSON.stringify(x);
const ck=(n,c,extra)=>console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+(extra||'')));
(async()=>{
let p=await L.boot('2026-11-02T09:00:00');
const mk=async(a)=>{ await p.evaluate(a=>{S=freshState();V.setup={step:0,a:a};buildFromSetup();render();},a); };
const base={source:'salary',incAmt:'250000',incEvery:'month',next:'2026-11-22',apps:[{name:'Moniepoint',bal:'250000'}],food:'2000',foodPer:'day',transport:'1000',transportPer:'day',data:'10000',dataPer:'month',rent:'240000',rentDue:'2027-05',family:'25000',fitChoice:'fit'};
await mk(base); await L.click(p,'opening');
// first-cycle proration
const needs=await p.evaluate(()=>S.budgets.map(b=>[b.name,cycNeed(b)]));console.log('first cycle needs (20 days left of 31)',j(needs));
ck('food prorated to 20 days',needs.find(n=>n[0]==='Food')[1]===40000);
await L.click(p,'confirm-split');
console.log('audit',j(await p.evaluate(()=>audit())));
console.log('leftovers after split',await p.evaluate(()=>potBalance(sweepTarget())));
// TOP UP: add school fees with date
await p.evaluate(()=>{S.budgets.push({id:uid(),created:today(),name:'School fees',group:'Savings',kind:'pot',period:'month',amount:0,order:4,account:acctByRole('save').id,target:0,fixed:true,targetDate:'',roll:3});save();});
const fid=await p.evaluate(()=>S.budgets.find(b=>b.name==='School fees').id);
await L.sheet(p,'edit-simple',{id:fid}); await L.set(p,{'q-target':'150000','q-tdate':'2027-05'}); await L.click(p,'save-simple',fid);
const tp=await p.evaluate(()=>S.topups);console.log('topups',j(tp));
await L.click(p,'topup',fid);
ck('topup opens source sheet, not Money in', await p.evaluate(()=>V.sheet&&V.sheet.type)==='topup');
console.log((await L.txt(p)).slice(-420));
const srcs=await p.evaluate(()=>Array.from(document.querySelectorAll('[data-act="topup-from"]')).map(e=>e.getAttribute('data-v')+':'+e.textContent));console.log('sources',srcs);
const before=await p.evaluate(()=>({lo:potBalance(sweepTarget()),sf:potBalance(B(S.budgets.find(b=>b.name==='School fees').id))}));
await L.click(p,'topup-from',fid,await p.evaluate(()=>sweepTarget().id));
const after=await p.evaluate(()=>({lo:potBalance(sweepTarget()),sf:potBalance(S.budgets.find(b=>b.name==='School fees')),funded:funded(S.budgets.find(b=>b.name==='School fees')),need:cycNeed(S.budgets.find(b=>b.name==='School fees')),top:S.topups,toAssign:toAssign()}));
console.log('before',j(before),'after',j(after));
ck('leftovers reduced and fees funded',after.lo<before.lo&&after.sf>0&&after.funded>=after.need);
ck('card gone',!(await p.evaluate(()=>upNext().some(n=>/Top up/.test(n.t)))));
console.log('audit',j(await p.evaluate(()=>audit())));
// FIT loop
await mk(Object.assign({},base,{incAmt:'100000',apps:[{name:'M',bal:'100000'}],fees:'150000',feesMonths:'3',feesDue:'2027-01'}));
console.log('upnext',j(await p.evaluate(()=>upNext().map(n=>n.t))));
await L.sheet(p,'fit');await L.click(p,'apply-fit');
const un=await p.evaluate(()=>upNext().map(n=>n.t+' | '+n.s));console.log('after apply',j(un));
ck('no endless plan-costs alert',!un.some(t=>/plan costs/.test(t)));
ck('commitment cards instead',un.some(t=>/cannot be ready/.test(t)));
await L.sheet(p,'fit');console.log((await L.txt(p)).slice(-330));
// POT START
await mk(base);
await p.evaluate(()=>{S.budgets.find(b=>b.name==='Rent').start=0;});
await L.sheet(p,'edit-budget',{id:await p.evaluate(()=>S.budgets.find(b=>b.name==='Rent').id)}); await L.set(p,{'e-start':'100000'}); await L.click(p,'save-budget',await p.evaluate(()=>S.budgets.find(b=>b.name==='Rent').id));
console.log('toAssign after adding 100k held before opening',await p.evaluate(()=>toAssign()),'opening',await p.evaluate(()=>openingAmount()));
await L.click(p,'opening');await L.click(p,'confirm-split');
console.log('audit pot-held',j(await p.evaluate(()=>audit())));
ck('rent holds the 100k plus its split',await p.evaluate(()=>potBalance(S.budgets.find(b=>b.name==='Rent'))>=100000));
// GOALS include Save first
await mk(base); await p.evaluate(()=>{S.budgets.push({id:uid(),created:today(),name:'Laptop',group:'Savings',kind:'pot',period:'month',amount:0,order:6,account:acctByRole('save').id,target:400000,goal:true,qpos:101});});
console.log('spare for goals',await p.evaluate(()=>spareMonthly()),'plan',await p.evaluate(()=>planMonthly(S.budgets)),'sf',await p.evaluate(()=>sfMonthly(S.budgets,250000)));
console.log('ERR',p.errs.join('|')||'none');await p.b.close();
})();
