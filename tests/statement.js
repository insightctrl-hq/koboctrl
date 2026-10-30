// Import of a generated statement: totals, duplicates, order, damaged files, bank detection.
const L=require('./lib.js');const G=L.G;const j=x=>JSON.stringify(x);const ck=(n,c,e)=>console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+(e||'')));
const state=p=>p.evaluate(()=>({bal:acctBalance(S.accounts[0]),tx:S.tx.length,feed:S.feed.length,uns:unsortedTotal(),aud:audit().diff,issues:audit().issues.length}));
(async()=>{
 const f=G.write('main.xlsx',{seed:3,start:'2026-08-03',days:90}),X=f.expected;console.log('generated',j(X));
 ck('generator has the quirks',X.blankType>5&&X.vat>5&&X.stamp>2&&X.own>2&&X.airtime>2&&X.refunds>=0&&X.failed===1);
 let p=await L.fresh(X.opening);
 await L.pickFile(p,f.path);
 const info=await p.evaluate(()=>({bank:V.imp.p.bank,good:V.imp.p.good,held:V.imp.p.held,bad:V.imp.p.bad,c:V.imp.p.checks,sd:V.imp.p.sumDebit,sc:V.imp.p.sumCredit,from:V.imp.p.from,to:V.imp.p.to}));
 ck('bank detected from the file',info.bank==='Moniepoint');
 ck('every row chained, failed row skipped',info.good===X.rows&&info.held===0&&!info.bad,j(info));
 ck('header totals and closing match',info.c.debitOk&&info.c.creditOk&&info.c.closeOk);
 ck('sums equal the generator',Math.abs(info.sd-X.totalDebit)<0.005&&Math.abs(info.sc-X.totalCredit)<0.005);
 await p.evaluate(()=>{V.imp.from=V.imp.p.from;render();});
 await L.click(p,'stmt-go','','review'); ck('past cycles ask for a confirm',await p.evaluate(()=>V.imp.confirm===true));
 await L.click(p,'stmt-go','','keep');
 const s1=await state(p);console.log('after',j(s1));
 ck('closing balance equals the statement',Math.abs(s1.bal-X.closing)<0.005,s1.bal+' vs '+X.closing);
 ck('conserved',Math.abs(s1.aud)<0.01&&s1.issues===0,j(s1));
 const flows=await p.evaluate(()=>{let d=0,c=0;S.feed.forEach(f=>{if(f.m<0)d-=f.m;else c+=f.m;});return {d:Math.round(d*100)/100,c:Math.round(c*100)/100,n:S.feed.length}});
 ck('feed totals equal header debit and credit',Math.abs(flows.d-X.totalDebit)<0.01&&Math.abs(flows.c-X.totalCredit)<0.01,j(flows));
 ck('VAT rows joined to their payment',flows.n===X.rows-X.vat,flows.n+' vs '+(X.rows-X.vat));
 ck('transfers to the holder suggested as own account',await p.evaluate(()=>S.feed.filter(f=>f.o).length)>=X.own);
 // second import
 await p.evaluate(()=>{closeSheet();V.tab='settings';render();}); await L.pickFile(p,f.path);
 ck('second import adds nothing',(await p.evaluate(()=>stmtPlan(V.imp).add.length))===0);
 await p.evaluate(()=>{V.imp=null;closeSheet();render();});
 // shuffled
 const fs2=G.write('shuffled.xlsx',{seed:3,start:'2026-08-03',days:90,shuffle:true});
 let p2=await L.fresh(X.opening); await L.pickFile(p2,fs2.path); await p2.evaluate(()=>{V.imp.from=V.imp.p.from;render();}); await L.click(p2,'stmt-go','','review'); await L.click(p2,'stmt-go','','keep');
 const s2=await state(p2); const sig=pp=>pp.evaluate(()=>S.feed.map(f=>f.r+'|'+f.m+'|'+f.st).sort().join('\n'));
 ck('shuffled file gives the same balance and rows',Math.abs(s2.bal-X.closing)<0.005&&s2.feed===s1.feed&&(await sig(p))===(await sig(p2)),j(s2));
 // tampered
 const ft=G.write('tampered.xlsx',{seed:3,start:'2026-08-03',days:90,tamper:100});
 let p3=await L.fresh(X.opening); await L.pickFile(p3,ft.path); const t3=await p3.evaluate(()=>({good:V.imp.p.good,held:V.imp.p.held,gap:V.imp.p.gap&&V.imp.p.gap.kind}));
 ck('row off the chain is flagged and later rows held back',t3.gap==='bad'&&t3.held>0&&t3.good>0&&t3.good<X.rows,j(t3));
 ck('the sheet names the row and the held-back count',/does not add up/.test(await p3.evaluate(()=>document.querySelector('.sheet').innerText))&&/held back/.test(await p3.evaluate(()=>document.querySelector('.sheet').innerText)));
 // deleted
 const fd=G.write('deleted.xlsx',{seed:3,start:'2026-08-03',days:90,drop:120});
 let p4=await L.fresh(X.opening); await L.pickFile(p4,fd.path); const t4=await p4.evaluate(()=>({good:V.imp.p.good,held:V.imp.p.held,gap:V.imp.p.gap&&V.imp.p.gap.kind,miss:V.imp.p.gap&&V.imp.p.gap.missing}));
 ck('missing row flagged with the missing amount',t4.gap==='gap'&&t4.held>0&&Math.abs(Math.abs(t4.miss)-Math.abs(fd.expected.dropped))<0.01,j([t4,fd.expected.dropped]));
 // unknown bank
 const fu=G.write('unknown.xlsx',{seed:3,start:'2026-08-03',days:30,cols:{'Balance Before (NGN)':'Previous balance'}});
 let p5=await L.fresh(X.opening); await L.pickFile(p5,fu.path);
 ck('unknown bank gets a plain message',/not supported yet/.test(await p5.evaluate(()=>V.imp.error||'')));
 ck('button reads Import bank statement',/Import bank statement/.test(await p5.evaluate(()=>{closeSheet();V.imp=null;render();return document.querySelector('[data-act="stmt-pick"]').innerText;})));
 console.log('errs',j([p.errs,p2.errs,p3.errs,p4.errs,p5.errs]));
 for(const x of [p,p2,p3,p4,p5]) await x.b.close();
})().catch(e=>{console.log('FAIL crashed',e.message);process.exit(1);});
