const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>{errs.push('DIALOG '+d.message());d.dismiss();});
await p.goto('http://localhost:8765/index.html');await p.evaluate(()=>localStorage.clear());await p.reload();await require('./lib.js').ready(p);
const X='"><img src=x id=pwn onerror="window.__pwn=1">\'<b id=pwn2>';
await p.evaluate((X)=>{ V.setup.a={source:'salary',hustle:true,incAmt:'250000',incEvery:'month',next:addDays(today(),20),apps:[{name:X+'A',bal:'182400'},{name:X+'B',bal:'24000'}],food:'2000',transport:'1000',data:'10000',dataPer:'month',rent:'240000',family:'25000',bizcost:'5000',dx:[{name:X+'L',amt:'4000',per:'week'}],goals:[{name:X+'G',amt:600000,date:'',fixed:false}],hh:{Gas:'3000'},hhEvery:{Gas:1},hhName:X+'H',hhX:'2000',fitChoice:'fit'}; buildFromSetup();
 S.budgets.forEach(function(b){ b.name = X + b.name; if (b.parent) b.parent = X + b.parent; b.group = X + b.group; });
 S.tx.push({id:'i1',type:'in',account:S.accounts[0].id,amount:250000,date:today(),at:1,note:X+'in'});
 var f=S.budgets.filter(function(b){return b.kind==='spend';})[0]; S.tx.push({id:'o1',type:'out',budgetId:f.id,amount:1200,note:X+'note',date:today(),at:2});
 S.quick=[{label:X+'Q',amount:500,budgetId:f.id}]; S.pending=[{id:'pq',from:S.accounts[0].id,to:S.accounts[1].id,amount:5000,reason:X+'reason'}];
 save(); V.tab='plan'; render(); },X);
const check=async(tag)=>{const r=await p.evaluate(()=>({img:!!document.querySelector('#pwn'),b:!!document.querySelector('#pwn2'),fired:!!window.__pwn}));if(r.img||r.b||r.fired)console.log('INJECTED at',tag,JSON.stringify(r));};
for(const t of ['plan','spend','goals','progress','settings']){await p.evaluate(t=>{V.tab=t;V.sheet=null;render();},t);await check('tab '+t);}
const types=["all-next","backup","break","budget","check","check-result","clear","close-view","cooldown","covered","del-in","edit-account","edit-budget","edit-plan","edit-simple","feedback","fit","hh-setup","log","overcheck","possible","raise","restore","sf-edit","split","tx","withdraw"];
for(const ty of types){ const ok=await p.evaluate(ty=>{ try{ var b=S.budgets.filter(function(x){return x.kind==='spend';})[0], g=S.budgets.filter(function(x){return isGoal(x);})[0]||b, pot=S.budgets.filter(function(x){return isPot(x);})[0];
  var d={id:(ty==='possible'||ty==='withdraw'?(g||pot).id:ty==='tx'||ty==='del-in'?'o1':ty==='edit-account'?S.accounts[0].id:b.id), budgetId:b.id, amt:1000, diffs:[{acct:S.accounts[0].id,diff:-500,exp:1000}], pairs:[], mode:'spend'};
  V.tab='plan'; V.sheet={type:ty,data:d}; render(); return 'ok'; }catch(e){ return 'ERR '+e.message; } },ty); if(ok!=='ok') console.log(ty,ok); await check('sheet '+ty); }
// interact: open each budget detail
const ids=await p.evaluate(()=>S.budgets.map(b=>b.id));
for(const id of ids){await p.evaluate(id=>{V.sheet={type:'budget',data:{id:id}};render();},id);await check('budget '+id);}
await p.evaluate((X)=>{S.close={label:X,lines:[X,X],seen:false,month:'2026-10',earlier:[{label:X,lines:[X]}]};V.sheet={type:'close-view',data:{}};render();},X);await check('close-view');
// setup screens
await p.evaluate(()=>{S.setupDone=false;render();});
for(let i=0;i<10;i++){await p.evaluate(i=>{V.setup.step=i;try{render();}catch(e){}},i);await check('setup '+i);}
console.log('done; errors:',errs.slice(0,5).join(' | ')||'none');await b.close();})();
