// Test de l'interface (Playwright) : node tests/ui.test.js  — sert le dossier en local et prend des captures
const {chromium}=require('playwright'), http=require('http'), fs=require('fs'), path=require('path');
const ROOT=path.join(__dirname,'..'), OUT=process.env.OUT||path.join(ROOT,'tests','shots'); fs.mkdirSync(OUT,{recursive:true});
const srv=http.createServer((q,r)=>{ const f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0])==='/'?'index.html':decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f,(e,d)=>{ if(e){ r.writeHead(404); r.end(); return; } r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.css')?'text/css':'application/javascript'}); r.end(d); }); }).listen(8765);
(async()=>{ let fails=0; const ok=(c,m)=>{ console.log(c?'ok  ':'ÉCHEC',m); if(!c) fails++; };
  const b=await chromium.launch(); const errs=[];
  for(const [w,h,tag] of [[1280,800,'desktop'],[390,844,'mobile']]){
    const ctx=await b.newContext({viewport:{width:w,height:h}}); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(tag+': '+e.message)); p.on('console',m=>{ if(m.type()==='error'&&!/tile|Failed to load resource/.test(m.text())) errs.push(tag+' console: '+m.text()); });
    await p.goto('http://localhost:8765/'); await p.waitForSelector('#modal:not([hidden])'); await p.screenshot({path:`${OUT}/${tag}-0-accueil.png`});
    await p.selectOption('#ng-hub','KIN'); await p.click('#ng-go'); await p.waitForTimeout(500);
    ok(await p.$eval('#modal',d=>d.hidden),tag+' nouvelle partie lancée');
    // ouvrir Kinshasa–Matadi
    await p.click('[data-act=tab][data-v=open]'); await p.waitForSelector('#preview button');
    ok(/Matadi/.test(await p.textContent('#preview')),tag+' aperçu de ligne vers Matadi');
    await p.screenshot({path:`${OUT}/${tag}-1-ouvrir.png`});
    await p.click('[data-act=openline]'); await p.waitForTimeout(300);
    ok(await p.evaluate(()=>S.lines.length===1),tag+' ligne ouverte');
    await p.click('[data-act=speed][data-v="3600"]'); await p.waitForTimeout(2500);
    ok(await p.evaluate(()=>document.querySelectorAll('.trn').length>0),tag+' train affiché sur la carte');
    await p.screenshot({path:`${OUT}/${tag}-2-train.png`});
    // cliquer sur la gare de Kolwezi via le panneau (ouvrir la fiche gare)
    await p.evaluate(()=>{ UI.sel={type:'st',code:'KWZ'}; renderPanel(); focusStation('KWZ'); }); await p.waitForTimeout(400);
    ok(/Kolwezi/.test(await p.textContent('#panel')),tag+' fiche gare Kolwezi'); await p.screenshot({path:`${OUT}/${tag}-3-kolwezi.png`});
    // fiche tronçon + chantiers
    await p.evaluate(()=>{ UI.sel={type:'edge',id:NET.edges.find(e=>e.a==='LKS'&&e.b==='TNK').id}; renderPanel(); }); ok(/Remettre en état/.test(await p.textContent('#panel')),tag+' fiche tronçon');
    await p.click('[data-act=back]'); await p.click('[data-act=tab][data-v=works]'); ok(/Kinshasa–Brazzaville/.test(await p.textContent('#panel')),tag+' liste des projets');
    await p.screenshot({path:`${OUT}/${tag}-4-chantiers.png`});
    // 1 j/s pendant 4 s → plusieurs jours
    await p.click('[data-act=speed][data-v="86400"]'); await p.waitForTimeout(4000); await p.click('[data-act=speed][data-v="0"]');
    const st=await p.evaluate(()=>({t:S.time,cash:S.cash,hist:S.hist.length}));
    ok(st.t>Date.UTC(2026,0,7),tag+' le temps avance : '+new Date(st.t).toISOString());
    // rechargement réel de la page + absence simulée de 6 h
    await p.evaluate(()=>{ S.paused=false; save(); localStorage.setItem('congo-rail-lr',String(Date.now()-6*3600e3)); const o=JSON.parse(localStorage.getItem('congo-rail-save')); o.lastReal=Date.now()-6*3600e3; localStorage.setItem('congo-rail-save',JSON.stringify(o)); window.__noSave=1; });
    await p.evaluate(()=>{ S._noSave=true; }); await p.reload(); await p.waitForTimeout(800);
    const after=await p.evaluate(()=>({t:S.time,lines:S.lines.length,news:S.news[0].txt}));
    ok(after.lines===1&&after.t>=st.t+6*3600e3-60e3,tag+' rattrapage après rechargement : '+after.news);
    await p.click('[data-act=tab][data-v=lines]'); await p.click('.lrow'); await p.waitForTimeout(200); await p.screenshot({path:`${OUT}/${tag}-5-ligne.png`,fullPage:false});
    ok(/Fiche horaire/.test(await p.textContent('#panel')),tag+' fiche ligne + horaire');
    await ctx.close(); }
  ok(errs.length===0,'aucune erreur JS '+errs.join(' | '));
  await b.close(); srv.close(); console.log(fails?fails+' échec(s)':'TOUS LES TESTS UI PASSENT'); process.exit(fails?1:0); })();
