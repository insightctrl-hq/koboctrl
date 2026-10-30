const L=require('./lib.js');
(async()=>{let p=await L.boot('2026-11-02T09:00:00');
const base={source:'salary',incAmt:'250000',incEvery:'month',next:'2026-11-22',apps:[{name:'Moniepoint',bal:'250000'}],food:'2000',foodPer:'day',transport:'1000',transportPer:'day',data:'10000',dataPer:'month'};
await p.evaluate(a=>{S=freshState();V.setup={step:0,a:a};buildFromSetup();render();},base); await L.click(p,'opening'); await L.click(p,'confirm-split');
const r=await p.evaluate(()=>{const a=coveredUntil().have;const st=sweepTarget();S.tx.push({id:uid(),type:'in',amount:25000,date:today(),account:S.accounts[0].id});S.tx.push({id:uid(),type:'alloc',budgetId:st.id,amount:25000,sf:true,month:cyc(),date:today()});const b=coveredUntil().have;return {a,b,audit:audit().diff}});
console.log(JSON.stringify(r),r.a===r.b?'PASS sf deposit not counted':'FAIL');
await p.b.close();})();
