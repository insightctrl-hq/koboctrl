const {chromium}=require('playwright');
exports.boot=async function(iso){
  const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();
  p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));
  await p.clock.install({time:new Date(iso||'2026-11-02T09:00:00')});
  await p.goto('http://localhost:8765/index.html');await p.evaluate(()=>localStorage.clear());await p.reload();await exports.ready(p);
  await p.evaluate(AUDIT_SRC);
  p.b=b;return p;
};
const AUDIT_SRC=`window.audit=function(){
  var out=[],t=0;
  S.tx.forEach(function(x){ if(!isFinite(x.amount)) out.push('NaN tx '+x.type); });
  var accts=0; S.accounts.forEach(function(a){accts+=acctBalance(a);});
  var net=0; S.budgets.forEach(function(b){
    var v=(b.start||0);
    S.tx.forEach(function(x){
      if(x.type==='alloc'&&x.budgetId===b.id&&!x.carry) v+=x.amount;
      if((x.type==='sweepIn'||x.type==='repayIn')&&x.budgetId===b.id) v+=x.amount;
      if(x.type==='cover'&&x.to===b.id) v+=x.amount;
      if(x.type==='cover'&&x.from===b.id) v-=x.amount;
      if(x.type==='sweep'&&x.from===b.id) v-=x.amount;
      if((x.type==='out'||x.type==='withdraw'||x.type==='potSpend')&&x.budgetId===b.id) v-=x.amount;
    });
    net+=v; });
  var ta=toAssign();
  var openStart=0; // opening 'in' counted in toAssign but accounts hold it in start
  var uns=(typeof unsortedTotal==='function')?unsortedTotal():0; var diff=Math.round((accts-(ta+net-uns))*100)/100;
  return {accts:accts,toAssign:ta,net:net,diff:diff,issues:out};
};`;
exports.AUDIT_SRC=AUDIT_SRC;
exports.click=async function(p,act,id,v){
  await p.evaluate(([a,i,vv])=>{var b=document.createElement('button');b.setAttribute('data-act',a);if(i)b.setAttribute('data-id',i);if(vv)b.setAttribute('data-v',vv);document.body.appendChild(b);b.click();b.remove();},[act,id||'',v||'']);
};
exports.set=async function(p,vals){ await p.evaluate(vs=>{for(const k in vs){const e=document.getElementById(k);if(!e){throw new Error('no input '+k);}e.value=vs[k];}},vals); };
exports.sheet=async function(p,type,data){ await p.evaluate(([t,d])=>{openSheet(t,d||{});render();},[type,data||{}]); };
exports.txt=async function(p){return (await p.textContent('#app')).replace(/\s+/g,' ').trim();};
/* A finished set-up with the usual first account. Returns the page. */
exports.base={source:'salary',incAmt:'250000',incEvery:'month',next:'2026-11-22',apps:[{name:'Moniepoint',bal:'150000'}],food:'2000',foodPer:'day',transport:'1000',transportPer:'day',data:'10000',dataPer:'month'};
exports.setup=async function(p,over){
  const a=Object.assign({},exports.base,over||{});
  await p.evaluate(a=>{S=freshState();V.setup={step:0,a:a};buildFromSetup();save();V.tab='settings';render();},a);
  await exports.click(p,'opening');
  await p.evaluate(()=>{V.tab='settings';render();});
};
exports.idle=p=>p.evaluate(()=>storeIdle());
exports.ready=async function(p){ for(let i=0;i<200;i++){ const ok=await p.evaluate(()=>typeof S==='object'&&S!==null&&typeof STORE==='object'&&!!STORE.mode).catch(()=>false); if(ok) break; await new Promise(r=>setTimeout(r,50)); } await p.evaluate(()=>storeIdle()); };
/* A page with a clock, a finished set-up that started before the statement, and a statement file ready to pick. */
exports.G=require('./gen-statement.js');
exports.pickFile=async function(p,path){
  const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.evaluate(()=>document.querySelector('[data-act="stmt-pick"]').click())]);
  await fc.setFiles(path);
  for(let i=0;i<400;i++){ const d=await p.evaluate(()=>V.imp&&(V.imp.p||V.imp.error)?1:0); if(d) return; await new Promise(r=>setTimeout(r,50)); }
  throw new Error('statement did not load');
};
/* The statement is generated, never read from disk outside the temp folder. */
exports.fresh=async function(opening,started){
  const p=await exports.boot('2026-11-02T09:00:00');
  await exports.setup(p,{apps:[{name:'Moniepoint',bal:String(opening)}]});
  await p.evaluate(s=>{S.started=s;save();V.tab='settings';render();},started||'2026-08-01');
  return p;
};
