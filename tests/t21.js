const {chromium}=require('playwright');(async()=>{
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/index.html');await p.evaluate(()=>localStorage.clear());await p.reload();await require('./lib.js').ready(p);
const txt=async()=>(await p.textContent('#app')).replace(/\s+/g,' ').trim();
// plan A
await p.evaluate(()=>{V.setup.a={source:'salary',incAmt:'777000',incEvery:'month',next:addDays(today(),20),apps:[{name:'GTBank',bal:'333000'}],food:'4444',foodPer:'day',transport:'1111',transportPer:'day',data:'9999',dataPer:'month',rent:'480000',family:'55000',fitChoice:'fit'};buildFromSetup();render();});
// set emergency and household like a user would
await p.evaluate(()=>{var f=S.budgets.find(b=>b.kind==='floor'); if(f){f.start=123400;} save();});
const snapA=JSON.stringify(await p.evaluate(()=>S));
// clear
await p.evaluate(()=>{openSheet('clear');render();});await p.evaluate(()=>{const e=document.querySelector('[data-act="do-clear"]');console.log(!!e);e.click();});await p.waitForTimeout(100);
console.log('after clear setupDone',await p.evaluate(()=>S.setupDone), 'budgets',await p.evaluate(()=>S.budgets.length));
// plan B
await p.evaluate(()=>{V.setup.a={source:'salary',incAmt:'200000',incEvery:'month',next:addDays(today(),20),apps:[{name:'Opay',bal:'50000'}],food:'2000',foodPer:'day',transport:'500',transportPer:'day',data:'5000',dataPer:'month',rent:'',family:'',fitChoice:'fit'};buildFromSetup();render();});
const st=await p.evaluate(()=>S);
console.log(JSON.stringify(st.budgets.map(b=>[b.name,b.kind,b.amount,b.start,b.target])));
console.log('settings',JSON.stringify(st.settings),'income',JSON.stringify(st.income));
for(const tab of ['plan','spend','goals','settings']){await p.evaluate(t=>{V.tab=t;render();},tab);const t=await txt();const hits=['777,000','333,000','4,444','1,111','9,999','480,000','55,000','123,400','40,000','42,000'].filter(x=>t.includes(x));console.log(tab,hits.join(' '));}
console.log('home',(await (async()=>{await p.evaluate(()=>{V.tab='plan';render();});return (await txt()).slice(0,1500)})()));
console.log('ERR',errs.join('|')||'none');await b.close();})();
