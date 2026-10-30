const L=require('./lib.js');
const j=x=>JSON.stringify(x);
const BAD=/NaN|undefined|null|Infinity|₦-|−₦0\b|\[object/;
async function crawl(p,label){
  const out=[];
  const tabs=['plan','spend','goals','progress','settings'];
  for(const t of tabs){ await p.evaluate(t=>{V.sheet=null;V.tab=t;render();},t); const tx=await L.txt(p); const m=tx.match(BAD); if(m) out.push(label+' TAB '+t+': '+tx.slice(Math.max(0,tx.search(BAD)-60),tx.search(BAD)+60)); }
  const ids=await p.evaluate(()=>S.budgets.map(b=>b.id));
  for(const id of ids){ for(const ty of ['budget','edit-simple','edit-budget','possible','raise','break','withdraw']){ try{ await p.evaluate(([t,i])=>{V.tab='plan';openSheet(t,{id:i,budgetId:i});render();},[ty,id]); const tx=await L.txt(p); const m=tx.search(BAD); if(m>=0) out.push(label+' SHEET '+ty+' '+id+': '+tx.slice(Math.max(0,m-60),m+60)); }catch(e){ out.push(label+' CRASH '+ty+' '+e.message.slice(0,100)); } } }
  for(const ty of ['all-next','backup','check','clear','close-view','covered','edit-plan','feedback','fit','hh-setup','log','privacy','restore','sf-edit','split','edit-account']){ try{ await p.evaluate(t=>{openSheet(t,{id:(S.accounts[0]||{}).id});render();},ty); const tx=await L.txt(p); const m=tx.search(BAD); if(m>=0&&ty!=='backup') out.push(label+' SHEET '+ty+': '+tx.slice(Math.max(0,m-60),m+60)); }catch(e){ out.push(label+' CRASH '+ty+' '+e.message.slice(0,100)); } }
  await p.evaluate(()=>{V.sheet=null;render();});
  out.push(...p.errs.splice(0).map(e=>label+' PAGEERROR '+e));
  return out;
}
exports.crawl=crawl;
if(require.main===module)(async()=>{
const p=await L.boot('2026-11-02T09:00:00'); let all=[];
const setup=a=>p.evaluate(a=>{V.setup.a=a;buildFromSetup();render();},a);
const base={source:'salary',hustle:true,incAmt:'250000',incEvery:'month',next:'2026-11-22',apps:[{name:'Moniepoint',bal:'250000'},{name:'GT',bal:'20000'}],food:'2000',foodPer:'day',transport:'1000',transportPer:'day',data:'10000',dataPer:'month',rent:'240000',rentDue:'2027-05',fees:'150000',feesMonths:'3',feesDue:'2027-01',family:'25000',bizcost:'15000',fitChoice:'fit'};
await setup(base); all.push(...await crawl(p,'unsplit'));
await L.click(p,'opening');await L.click(p,'confirm-split'); all.push(...await crawl(p,'split'));
const bid=n=>p.evaluate(n=>S.budgets.find(b=>b.name===n).id,n);
const log=async(amt,bud)=>{ const id=await bid(bud); await L.sheet(p,'log',{budgetId:id}); await L.set(p,{'f-amt':String(amt),'f-note':'x','f-bud':id}); await L.click(p,'save-log'); if(await p.evaluate(()=>V.sheet&&V.sheet.type)==='overcheck') await L.click(p,'over-log'); };
await log(1500,'Food'); await log(30000,'Food'); await log(500,'Data and airtime'); await log(20000,'Rent');
all.push(...await crawl(p,'spent'));
await p.evaluate(()=>{S.budgets.push({id:uid(),created:today(),name:'Laptop',group:'Savings',kind:'pot',period:'month',amount:0,order:6,account:acctByRole('save').id,target:400000,goal:true,qpos:101});save();});
all.push(...await crawl(p,'goal'));
await p.clock.setSystemTime(new Date(2026,10,22,9,0)); all.push(...await crawl(p,'payday-before-pay'));
await L.sheet(p,'log',{mode:'in'}); await L.set(p,{'f-amt':'250000'}); await L.click(p,'save-log'); all.push(...await crawl(p,'paid-unsplit'));
await L.click(p,'confirm-split'); all.push(...await crawl(p,'cycle2'));
await p.clock.setSystemTime(new Date(2027,0,25,9,0)); all.push(...await crawl(p,'2months-later-no-pay'));
// no income user
await p.evaluate(()=>{localStorage.clear();});await p.reload();await L.ready(p);
console.log(all.length?all.join('\n'):'CRAWL CLEAN');
await p.b.close();
})();
