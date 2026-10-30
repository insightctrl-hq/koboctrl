const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:1});const p=await ctx.newPage();
await p.goto('http://localhost:8765/index.html');await p.evaluate(()=>localStorage.clear());await p.reload();await require('./lib.js').ready(p);
await p.evaluate(()=>{V.setup.a={source:'salary',hustle:true,apps:[{name:'Moniepoint',bal:'182400'},{name:'Opay',bal:'24000'}]};});
for(const k of ['source','next','accounts','daily','fixed']){await p.evaluate(k=>{V.setup.step=STEPS.findIndex(s=>s.k===k);render();},k);await p.screenshot({path:'shots/setup_'+k+'.png'});}
await b.close();})();
