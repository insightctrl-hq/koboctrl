const { chromium } = require('playwright');
(async()=>{
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/index.html');await p.evaluate(()=>{localStorage.clear();});await p.reload();await require('./lib.js').ready(p);
const txt=async()=>(await p.textContent('#app')).replace(/\s+/g,' ').trim();
await p.evaluate(()=>{ V.setup.a={source:'salary',hustle:false,incAmt:'250000',incEvery:'month',next:addDays(today(),20),apps:[{name:'Moniepoint',bal:'182400'},{name:'Opay',bal:'24000'},{name:'Cash',bal:'6500'}],food:'2000',foodPer:'day',transport:'1000',transportPer:'day',data:'10000',dataPer:'month',rent:'240000',rentDue:'',fees:'',family:'25000',fitChoice:'fit'}; buildFromSetup(); V.tab='plan'; render(); });
console.log('--- unsplit home ---');console.log((await txt()).slice(0,420));
await p.screenshot({path:'shots/home_unsplit.png',fullPage:true});
await p.click('[data-act="opening"]');await p.waitForTimeout(100);
console.log('opening sheet buttons:',await p.$$eval('.sheet [data-act]',e=>e.map(x=>x.dataset.act+':'+x.textContent.trim())));
await p.click('[data-act="confirm-split"]');await p.waitForTimeout(150);
await p.evaluate(()=>{var f=S.budgets.filter(b=>b.name==='Food')[0],t=S.budgets.filter(b=>b.name==='Transport')[0];S.tx.push({id:uid(),type:'out',budgetId:f.id,amount:1200,note:'lunch',date:today(),at:Date.now()});S.tx.push({id:uid(),type:'out',budgetId:t.id,amount:500,note:'bus',date:today(),at:Date.now()});save();render();});
console.log('--- split home ---');console.log((await txt()).slice(0,800));
await p.screenshot({path:'shots/home_split.png',fullPage:true});
console.log('ERRORS',errs.join('|')||'none');await b.close();})();
