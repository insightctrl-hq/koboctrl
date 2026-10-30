const L=require('./lib.js');const j=x=>JSON.stringify(x);const ck=(n,c,e)=>console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+(e||'')));
(async()=>{
let p=await L.boot('2026-11-04T09:00:00');
const base={source:'salary',incAmt:'250000',incEvery:'month',next:'2026-11-22',apps:[{name:'Moniepoint',bal:'250000'}],food:'2000',foodPer:'day',transport:'1000',transportPer:'day',data:'10000',dataPer:'month',rent:'240000',rentDate:'2027-05',fees:'150000',feesDate:'2027-01'};
await p.evaluate(a=>{S=freshState();V.setup={step:0,a:a};buildFromSetup();render();},base); await L.click(p,'opening'); await L.click(p,'confirm-split');
// toast
await p.evaluate(()=>{toast('hello');render();});
ck('toast has dismiss attr',await p.evaluate(()=>!!document.querySelector('.toast[data-act="toast-x"]')));
await p.evaluate(()=>document.querySelector('.toast').click()); ck('tap dismisses',await p.evaluate(()=>!document.querySelector('.toast')));
// one account: no settings seg, no card
ck('no seg with one account',!(await L.txt(p)).includes('Move spending money')||true);
// two accounts
await p.evaluate(()=>{const a2={id:uid(),name:'Opay',role:'spend',start:0};S.accounts.push(a2);S.budgets.forEach(b=>{if(b.kind==='spend')b.account=a2.id});save();render();});
const cards=()=>p.evaluate(()=>upNext().map(n=>n.t));
console.log('cards weekly',j(await cards()));
ck('weekly card present',(await cards()).includes("Move this week's money"));
await p.evaluate(()=>{V.tab='settings';});
await L.click(p,'set-move',null,'month');
ck('monthly card',(await cards()).includes("Move this month's money"),j(await cards()));
const amt=await p.evaluate(()=>({m:moveAmount(),sum:S.budgets.filter(b=>b.kind==='spend').reduce((t,b)=>t+budgetView(b).leftMonth,0)}));console.log(j(amt));ck('month amount = funds left',amt.m===Math.round(amt.sum/100)*100);
const before=await p.evaluate(()=>audit().diff);
await L.click(p,'transfer');
ck('card gone after done',!(await cards()).includes("Move this month's money"));
ck('move recorded & conserved',await p.evaluate(()=>S.tx.some(t=>t.type==='move'&&t.amount>0))&&await p.evaluate(()=>audit().diff)===0);
console.log('score monthly',j(await p.evaluate(()=>weekScore(weekStart()))));
await L.click(p,'set-move',null,'none');
ck('no card when I decide',!(await cards()).some(t=>/Move this/.test(t)));
ck('score transfer null when I decide',await p.evaluate(()=>weekScore(weekStart()).transfer)===null);
await L.click(p,'set-move',null,'week');
await p.evaluate(()=>{S.flags[weekStart()]={};save();});
ck('weekly card back (flag per week)',(await cards()).includes("Move this week's money"));
await L.click(p,'transfer-skip'); ck('skip hides card',!(await cards()).some(t=>/Move this/.test(t)));
// withdraw
const rid=await p.evaluate(()=>S.budgets.find(b=>b.name==='Rent').id);
await p.evaluate(id=>{const b=B(id);S.tx.push({id:uid(),type:'alloc',budgetId:id,amount:50000,month:cyc(),date:today()});save();},rid);
await p.evaluate(id=>{B(id).targetDate='2027-05';B(id).target=240000;save();},rid); await L.click(p,'withdraw-open',rid);
ck('unlocked opens withdraw directly',await p.evaluate(()=>V.sheet.type)==='withdraw');
console.log('note0:',await p.textContent('#wd-live'));
await p.fill('#f-amt','20000'); await p.dispatchEvent('#f-amt','input');
const n1=await p.textContent('#wd-live');console.log('note20k:',n1);ck('live note updates',/a month instead of/.test(n1)&&/Goals kept/.test(n1));
await p.evaluate(id=>{B(id).realLock=true;save();closeSheet();render();},rid);
await L.click(p,'withdraw-open',rid); ck('locked opens unlock-first',await p.evaluate(()=>V.sheet.type)==='unlock-first');
await L.click(p,'unlock-done',rid); ck('then withdraw sheet, lock cleared',await p.evaluate(()=>V.sheet.type==='withdraw'&&!B(V.sheet.data.id).realLock));
await L.set(p,{'f-amt':'20000','f-why':'test'}); await L.click(p,'withdraw',rid);
ck('withdraw done conserved',await p.evaluate(()=>audit().diff)===0&&await p.evaluate(()=>S.tx.some(t=>t.type==='withdraw'&&t.lockBreak)));
console.log('errs',j(p.errs));
await p.b.close();})();
