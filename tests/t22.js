const {chromium}=require('playwright');(async()=>{
const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
await p.goto('http://localhost:8765/index.html');await p.evaluate(()=>localStorage.clear());await p.reload();await require('./lib.js').ready(p);
await p.evaluate(()=>{ V.setup.a={source:'salary',hustle:true,incAmt:'250000',incEvery:'month',next:addDays(today(),20),apps:[{name:'Moniepoint',bal:'182400'},{name:'Opay',bal:'24000'}],food:'2000',foodPer:'day',transport:'1000',transportPer:'day',data:'10000',dataPer:'month',rent:'240000',family:'25000',bizcost:'15000',fitChoice:'fit'}; buildFromSetup(); render(); });
await p.evaluate(()=>{document.querySelector('[data-act="opening"]').click();});await p.waitForTimeout(100);
await p.evaluate(()=>{document.querySelector('[data-act="confirm-split"]').click();});await p.waitForTimeout(100);
await p.evaluate(()=>{V.tab='spend';V.sheet=null;render();});
const t=(await p.textContent('#app')).replace(/\s+/g,' ');console.log(t);
console.log('height',await p.evaluate(()=>document.body.scrollHeight));
await p.screenshot({path:'shots/spend.png',fullPage:true});
await b.close();})();
