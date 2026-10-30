const L=require('./lib.js');const {chromium}=require('playwright');const j=x=>JSON.stringify(x);const ck=(n,c,e)=>console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+(e||'')));
const readIdb=p=>p.evaluate(()=>new Promise(res=>{const r=indexedDB.open('koboctrl',1);r.onsuccess=()=>{const g=r.result.transaction('kv').objectStore('kv').get('state');g.onsuccess=()=>res(g.result||null);};r.onerror=()=>res(null);}));
const fat=n=>{S.feed=[];for(let i=0;i<n;i++){const id=uid();S.tx.push({id:id,type:'out',budgetId:'',uns:false,amount:100+i,account:S.accounts[0].id,note:'Row '+i,date:'2026-10-01',at:i,feed:'r'+i,src:'st'});S.feed.push({r:'r'+i,s:'st',a:S.accounts[0].id,d:'2026-10-01',at:i,m:-(100+i),n:'Payee '+i,i:'Some Bank',w:'POS purchase at DETAIL '+i,b:1000+i,k:'pay',c:0,f:[],y:'p:'+i,tx:[id],st:'ok'});}save();};
(async()=>{
 // 1 write and reload
 let p=await L.boot('2026-11-02T09:00:00'); await L.setup(p);
 ck('mode is IndexedDB',await p.evaluate(()=>STORE.mode)==='idb');
 await p.evaluate(fat,2000); await L.idle(p);
 const size=await p.evaluate(()=>JSON.stringify(S).length);console.log('state size',size);
 ck('state is over 700 KB',size>700000,size);
 const raw=await readIdb(p); ck('IndexedDB holds the same state',raw===await p.evaluate(()=>JSON.stringify(S)));
 const before=await p.evaluate(()=>({tx:S.tx.length,feed:S.feed.length,ta:toAssign(),b:acctBalance(S.accounts[0])}));
 await p.reload(); await L.ready(p);
 const after=await p.evaluate(()=>({tx:S.tx.length,feed:S.feed.length,ta:toAssign(),b:acctBalance(S.accounts[0])}));
 ck('reload keeps everything',j(before)===j(after),j([before,after]));
 // 2 backup round trip
 const bk=await p.evaluate(()=>backupText());
 await p.evaluate(()=>{S=freshState();save();}); await L.idle(p);
 await p.evaluate(t=>applyRestore(JSON.parse(t)),bk); await L.idle(p); await p.reload(); await L.ready(p);
 const rb=await p.evaluate(()=>({tx:S.tx.length,feed:S.feed.length,ta:toAssign()}));
 ck('backup file restores in full and survives reload',rb.tx===before.tx&&rb.feed===before.feed&&Math.abs(rb.ta-before.ta)<0.01,j(rb));
 ck('backup file keeps its format',await p.evaluate(()=>{const o=JSON.parse(backupText());return o.app==='KoboCTRL'&&Array.isArray(o.tx)&&Array.isArray(o.budgets)&&!!o.appVersion;}));
 await p.b.close();
 // 3 migration from the old localStorage copy
 p=await L.boot('2026-11-02T09:00:00'); await L.setup(p); await p.evaluate(fat,2000);
 const legacy=await p.evaluate(()=>JSON.stringify(S)); const legacyTx=await p.evaluate(()=>S.tx.length);
 await p.b.close();
 {const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));p.b=b;
  await p.clock.install({time:new Date('2026-11-02T09:00:00')});
  await p.goto('http://localhost:8765/index.html');await p.evaluate(t=>{localStorage.clear();localStorage.setItem('koboctrl-v1',t);},legacy);await p.reload();await L.ready(p);
  const m=await p.evaluate(()=>({tx:S.tx.length,mode:STORE.mode,ok:storageOK}));
  ck('migration keeps every entry',m.tx===legacyTx&&m.mode==='idb',j(m));
  ck('IndexedDB now holds the migrated state',(await readIdb(p))!==null&&JSON.parse(await readIdb(p)).tx.length===legacyTx);
  ck('old localStorage copy is untouched',await p.evaluate(()=>localStorage.getItem('koboctrl-v1'))===legacy);
  // newer IDB wins
  await p.evaluate(()=>{S.tx.push({id:uid(),type:'out',budgetId:'',uns:true,amount:5,account:S.accounts[0].id,date:today(),at:1});save();});await L.idle(p);await p.reload();await L.ready(p);
  ck('newer IndexedDB copy beats the old copy',await p.evaluate(()=>S.tx.length)===legacyTx+1);
  // IDB wiped
  await p.evaluate(()=>new Promise(res=>{STORE.db.close();const r=indexedDB.deleteDatabase('koboctrl');r.onsuccess=()=>res();r.onerror=()=>res();}));
  await p.reload().catch(()=>{});await L.ready(p);
  const w=await p.evaluate(()=>({tx:S.tx.length,note:STORE.note}));
  ck('wiped IndexedDB falls back to the old copy and says so',w.tx===legacyTx&&/last saved copy/.test(w.note),j(w));
  // write failure falls back to localStorage
  await p.evaluate(()=>{idbPut=function(){return Promise.reject(new Error('quota'));};S.tx.push({id:uid(),type:'out',budgetId:'',uns:true,amount:7,account:S.accounts[0].id,date:today(),at:2});save();});await L.idle(p);
  ck('failed IndexedDB write still reaches localStorage',await p.evaluate(()=>storageOK)===true&&JSON.parse(await p.evaluate(()=>localStorage.getItem('koboctrl-v1'))).tx.length===legacyTx+1);
  await p.reload();await L.ready(p);
  ck('and the next start picks that newer copy',await p.evaluate(()=>S.tx.length)===legacyTx+1);
  await p.b.close();}
 // 4 warning near the quota
 {const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});p=await ctx.newPage();p.b=b;
  await p.addInitScript(()=>{const st=navigator.storage;Object.defineProperty(navigator,'storage',{value:{estimate:()=>Promise.resolve({usage:850,quota:1000}),persist:()=>Promise.resolve(true)},configurable:true});});
  await p.clock.install({time:new Date('2026-11-02T09:00:00')});await p.goto('http://localhost:8765/index.html');await p.evaluate(()=>localStorage.clear());await p.reload();
  await L.setup(p);await p.waitForTimeout(300);await p.evaluate(()=>{checkRoom(0);});await p.waitForTimeout(300);
  ck('warning shows at 85% of the quota',/almost full/.test(await L.txt(p)),(await L.txt(p)).slice(0,120));
  await p.b.close();}
 {const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});p=await ctx.newPage();p.b=b;
  await p.addInitScript(()=>{Object.defineProperty(navigator,'storage',{value:{estimate:()=>Promise.resolve({usage:100,quota:1000}),persist:()=>Promise.resolve(true)},configurable:true});});
  await p.clock.install({time:new Date('2026-11-02T09:00:00')});await p.goto('http://localhost:8765/index.html');await p.evaluate(()=>localStorage.clear());await p.reload();
  await L.setup(p);await p.evaluate(()=>{checkRoom(0);});await p.waitForTimeout(300);
  ck('no warning at 10% of the quota',!/almost full/.test(await L.txt(p)));
  await p.b.close();}
 // 5 no IndexedDB at all
 {const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});p=await ctx.newPage();p.b=b;
  await p.addInitScript(()=>{try{Object.defineProperty(window,'indexedDB',{value:undefined,configurable:true});}catch(e){}});
  await p.clock.install({time:new Date('2026-11-02T09:00:00')});await p.goto('http://localhost:8765/index.html');await p.evaluate(()=>localStorage.clear());await p.reload();
  await L.setup(p);const n=await p.evaluate(()=>({mode:STORE.mode,tx:S.tx.length}));
  ck('falls back to localStorage when IndexedDB is missing',n.mode==='local');
  await p.reload();await L.ready(p);ck('and keeps data',await p.evaluate(()=>S.tx.length)===n.tx&&await p.evaluate(()=>S.setupDone));
  await p.evaluate(()=>checkRoom(4100000));ck('local mode warns above 4 million characters',/almost full/.test(await L.txt(p)));
  await p.b.close();}
})().catch(e=>{console.log('FAIL crashed',e.message);process.exit(1);});
