// Test de l'interface dans un vrai navigateur (Playwright).
//  node tests/artifact.test.js <page.html>  → page autonome dans un cadre isolé, stockage bloqué (comme le lecteur claude.ai)
//  node tests/artifact.test.js              → dossier servi en local, avec rechargement et reprise de la sauvegarde
const {chromium}=require('playwright'), fs=require('fs'), http=require('http'), path=require('path');
const ROOT=path.join(__dirname,'..'), OUT=process.env.OUT||'/tmp', single=process.argv[2];
const CSP="default-src 'none'; script-src 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'unsafe-inline' https://fonts.googleapis.com; img-src data: blob:; font-src https://fonts.gstatic.com";
const srv=http.createServer((q,r)=>{ const u=decodeURIComponent(q.url.split('?')[0]);
  if(single){ if(u==='/inner'){ r.writeHead(200,{'content-type':'text/html; charset=utf-8','content-security-policy':CSP});
      r.end('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'+fs.readFileSync(single,'utf8')+'</body></html>'); }
    else { r.writeHead(200,{'content-type':'text/html'}); r.end('<html><body style="margin:0"><iframe sandbox="allow-scripts" src="/inner" style="border:0;width:100vw;height:100vh"></iframe></body></html>'); } return; }
  const f=path.join(ROOT,u==='/'?'index.html':u); fs.readFile(f,(e,d)=>{ if(e){ r.writeHead(404); r.end(); return; } r.writeHead(200,{'content-type':f.endsWith('.html')?'text/html; charset=utf-8':f.endsWith('.css')?'text/css':f.endsWith('.json')?'application/json':'application/javascript'}); r.end(d); }); }).listen(8766);
(async()=>{ let fails=0; const ok=(c,m)=>{ console.log(c?'ok  ':'ÉCHEC',m); if(!c) fails++; };
  const b=await chromium.launch(); const errs=[];
  for(const [w,h,tag] of [[1280,820,'bureau'],[390,844,'mobile']]){
    const ctx=await b.newContext({viewport:{width:w,height:h}}), p=await ctx.newPage();
    p.on('pageerror',e=>errs.push(tag+': '+e.message)); p.on('console',m=>{ if(m.type()==='error'&&!/tile\.openstreetmap|fonts\.g|ERR_|Failed to load resource/.test(m.text())) errs.push(tag+' console: '+m.text()); });
    await p.goto('http://localhost:8766/'); await p.waitForTimeout(1200); const f=single?p.frames()[1]:p;
    ok(/COMMENCER/.test(await f.textContent('#modal')),tag+' écran de nouvelle partie');
    await f.click('[data-act=startgame]'); await f.click('#modal [data-act=close]');
    ok(/HAKVISION RAIL/.test(await f.textContent('#co')),tag+' nom de la compagnie affiché');
    await f.click('#hex [data-v=yard]'); await f.waitForSelector('.mcard'); await p.screenshot({path:`${OUT}/tm-${tag}-1-flotte.png`});
    await f.click('[data-act=mtab][data-v=routes]'); await f.click('[data-act=newroute]'); await f.selectOption('[data-e=b]','MAT'); await f.waitForTimeout(200);
    ok(await f.evaluate(()=>document.querySelectorAll('.stoprow').length===13),tag+' éditeur : 13 gares de Kinshasa à Matadi');
    await p.screenshot({path:`${OUT}/tm-${tag}-2-itineraire.png`});
    await f.click('[data-act=stopsbig]'); await f.click('.stoprow input[data-stop2=KMP]'); await f.waitForTimeout(150);
    ok(await f.evaluate(()=>UI.edit.stops.includes('KMP')&&UI.edit.stops.length<13),tag+' choix des arrêts (Kimpese ajouté)');
    await f.click('[data-act=stopsall]'); await f.click('[data-act=saveroute]'); await f.waitForTimeout(300);
    ok(await f.$eval('#drawer',d=>!d.hidden),tag+' liste « À la gare » ouverte'); await p.screenshot({path:`${OUT}/tm-${tag}-3-gare.png`});
    await f.click('[data-act=departsel]'); await f.waitForTimeout(400);
    ok(await f.evaluate(()=>G.trains[0].state==='enroute'),tag+' train parti');
    await f.click('#drawer [data-act=drawer]'); await f.evaluate(()=>{ G.trains[0].dep-=7*60e3; }); await f.waitForTimeout(800);
    await f.evaluate(()=>openModal('train',G.trains[0].id)); await f.waitForTimeout(200);
    ok(/EN DIRECT/.test(await f.textContent('#modal'))&&/CONTRÔLEURS/.test(await f.textContent('#modal')),tag+' fiche du train : voyageurs en direct et contrôleurs');
    await p.screenshot({path:`${OUT}/tm-${tag}-8-direct.png`}); await f.evaluate(()=>closeModal());
    ok(await f.evaluate(()=>document.querySelectorAll('.tm.enroute').length===1),tag+' train sur la carte'); await p.screenshot({path:`${OUT}/tm-${tag}-4-carte.png`});
    const cash=await f.evaluate(()=>G.cash); await f.evaluate(()=>{ G.trains[0].dep-=20*60e3; }); await f.waitForTimeout(900);
    ok(await f.evaluate(c=>G.cash>c&&G.trains[0].state==='station',cash),tag+' arrivée et recette');
    await f.click('#hex [data-v=world]'); await f.waitForSelector('.regions'); await p.screenshot({path:`${OUT}/tm-${tag}-6-monde.png`});
    await f.evaluate(()=>{ G.cash=3e6; }); await f.click('.regions button:nth-child(6)'); await f.waitForTimeout(300);
    await f.evaluate(()=>openModal('station','PAR')); await f.click('[data-act=hub][data-v=PAR]'); await f.waitForTimeout(300);
    ok(await f.evaluate(()=>G.hubs.includes('PAR')&&document.querySelectorAll('.hubmk').length>=2),tag+' hub établi à Paris, étoiles sur la carte');
    await f.evaluate(()=>closeModal()); await p.screenshot({path:`${OUT}/tm-${tag}-7-europe.png`});
    for(const m of ['check','shop','company','fuel','finance','service','mail','settings']){ await f.evaluate(n=>openModal(n),m); await f.waitForTimeout(80); if(m==='fuel'||m==='check') await p.screenshot({path:`${OUT}/tm-${tag}-5-${m}.png`}); }
    ok(true,tag+' toutes les fenêtres s\'ouvrent');
    await f.evaluate(()=>closeModal()); await f.click('#hex [data-v=yard]'); await f.click('[data-act=mtab][data-v=buy]'); await f.click('[data-act=buy][data-v=MAY3]'); await f.waitForTimeout(200);
    ok(await f.evaluate(()=>G.trains.length===2),tag+' commande d\'un train');
    if(!single){ await f.evaluate(()=>saveAll()); const hubs=await f.evaluate(()=>G.hubs.length); await p.reload(); await p.waitForTimeout(1500);
      ok(await p.evaluate(n=>G.trains.length===2&&G.routes.length===1&&G.hubs.length===n&&!G._fresh,hubs),tag+' partie reprise après rechargement'); }
    await ctx.close(); }
  ok(errs.length===0,'aucune erreur JS '+errs.join(' | '));
  await b.close(); srv.close(); console.log(fails?fails+' échec(s)':'TOUS LES TESTS UI PASSENT'); process.exit(fails?1:0); })();
