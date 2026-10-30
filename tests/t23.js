const {chromium}=require('playwright');(async()=>{
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/index.html');await p.evaluate(()=>localStorage.clear());await p.reload();await require('./lib.js').ready(p);
const txt=async()=>(await p.textContent('#app')).replace(/\s+/g,' ').trim();
const ck=(n,c)=>console.log((c?'PASS ':'FAIL ')+n);
// go to review step
await p.evaluate(()=>{V.setup.a={source:'salary',hustle:true,incAmt:'250000',incEvery:'month',next:addDays(today(),20),apps:[{name:'Moniepoint',bal:'182400'},{name:'Opay',bal:'24000'}],food:'2000',foodPer:'day',transport:'1000',transportPer:'day',data:'10000',dataPer:'month',rent:'240000',family:'25000',bizcost:'15000',fitChoice:'fit'};V.setup.step=STEPS.length-1;render();});
let t=await txt();console.log(t.slice(0,900));
ck('review shows rent monthly', t.includes('Rent')&&t.includes('₦20,000'));
ck('button label', t.includes('Open my home screen'));
// edit food
await p.click('[data-act="setup-edit"][data-id="food"]');await p.waitForTimeout(80);
await p.fill('#se-amt','3,000');await p.selectOption('#se-per','day');await p.click('[data-act="setup-edit-save"]');await p.waitForTimeout(80);
t=await txt();ck('food edited to 3,000', t.includes('₦3,000')&&!t.includes('Save'+'x'));
// remove transport
await p.click('[data-act="setup-edit"][data-id="transport"]');await p.waitForTimeout(80);await p.click('[data-act="setup-edit-remove"]');await p.waitForTimeout(80);
t=await txt();ck('transport removed', !t.includes('Transport'));
// edit rent
await p.click('[data-act="setup-edit"][data-id="rent"]');await p.waitForTimeout(80);await p.fill('#se-amt','360,000');await p.click('[data-act="setup-edit-save"]');await p.waitForTimeout(80);
t=await txt();ck('rent now 30,000 a month', t.includes('₦30,000')&&t.includes('₦360,000 a year'));
await p.screenshot({path:'shots/review.png',fullPage:true});
await p.click('[data-act="setup-next"]');await p.waitForTimeout(150);
let st=await p.evaluate(()=>S);
ck('setupDone', st.setupDone);
ck('no emergency pot', !st.budgets.some(b=>b.kind==='floor'));
ck('food 3000 built', st.budgets.find(b=>b.name==='Food').amount===3000);
ck('no transport', !st.budgets.some(b=>b.name==='Transport'));
t=await txt();console.log('HOME',t.slice(0,600));
ck('no where-did-it-go yet', !t.includes('Where did it go'));
ck('no savings group on plan', !/Rent₦|of ₦360,000/.test(t));
ck('tab named Savings', t.includes('Savings'));
// savings tab
await p.click('[data-act="tab"][data-v="goals"]');await p.waitForTimeout(80);t=await txt();console.log('SAVINGS',t.slice(0,900));
ck('rent on savings tab', t.includes('Rent'));
ck('emergency note', t.includes('Add as a goal')&&t.includes('three months'));
await p.screenshot({path:'shots/savings.png',fullPage:true});
await p.click('[data-act="add-em-goal"]');await p.waitForTimeout(100);
st=await p.evaluate(()=>S);const eg=st.budgets.find(b=>b.name==='Emergency money');ck('goal created', eg&&eg.goal&&eg.target>0);console.log('target',eg&&eg.target);
await p.evaluate(()=>{closeSheet();render();});t=await txt();ck('note gone after add', !t.includes('Add as a goal'));
// skip household
await p.evaluate(()=>{V.tab='plan';render();});
t=await txt();ck('household card present', t.includes('Add household items')||t.includes('Up next'));
console.log(await p.evaluate(()=>upNext().map(n=>n.t)));
await p.evaluate(()=>{S.dismissed.dfHH=1;S.dismissed.dfGoal=1;save();render();});
t=await txt();ck('see skipped link or see all', t.includes('See all')||t.includes('See skipped'));
await p.evaluate(()=>{openSheet('all-next');render();});t=await txt();ck('skipped section', t.includes('Skipped')&&t.includes('Add household items'));
await p.click('[data-act="skip-undo"][data-id="dfHH"]');await p.waitForTimeout(100);
t=await txt();ck('hh sheet opened', t.includes('Household')||t.includes('household'));
ck('flag cleared', !(await p.evaluate(()=>S.dismissed.dfHH)));
await p.evaluate(()=>{closeSheet();render();});
// eye
await p.evaluate(()=>{V.tab='plan';render();});
await p.click('.eye');await p.waitForTimeout(60);t=await txt();ck('amounts hidden', t.includes('₦•••••')&&!/₦\d/.test(t));
await p.evaluate(()=>{V.tab='spend';render();});t=await txt();ck('hidden on spend too', !/₦\d/.test(t));
await p.reload();await require('./lib.js').ready(p);await p.waitForTimeout(100);t=await txt();ck('hidden survives reload', t.includes('₦•••••'));
await p.click('.eye');await p.waitForTimeout(60);t=await txt();ck('amounts back', /₦\d/.test(t));
console.log('ERR',errs.join('|')||'none');await b.close();})();
