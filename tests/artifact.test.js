// Teste la page autonome comme dans le lecteur claude.ai : cadre isolé (sandbox), stockage du navigateur bloqué.
// node tests/artifact.test.js <page.html>
const {chromium}=require('playwright'), fs=require('fs'), http=require('http');
const page=fs.readFileSync(process.argv[2],'utf8');
const doc='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'+page+'</body></html>';
const srv=http.createServer((q,r)=>{ if(q.url==='/inner'){ r.writeHead(200,{'content-type':'text/html; charset=utf-8',
  'content-security-policy':"default-src 'none'; script-src 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'unsafe-inline' https://fonts.googleapis.com; img-src data: blob:; font-src https://fonts.gstatic.com"}); r.end(doc); }
  else { r.writeHead(200,{'content-type':'text/html'}); r.end('<html><body style="margin:0"><iframe sandbox="allow-scripts" src="/inner" style="border:0;width:100vw;height:100vh"></iframe></body></html>'); } }).listen(8766);
(async()=>{ let fails=0; const ok=(c,m)=>{ console.log(c?'ok  ':'ÉCHEC',m); if(!c) fails++; };
  const b=await chromium.launch(); const errs=[];
  for(const [w,h,tag] of [[1280,800,'bureau'],[390,844,'mobile']]){
    const p=await (await b.newContext({viewport:{width:w,height:h}})).newPage();
    p.on('pageerror',e=>errs.push(tag+': '+e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push(tag+' console: '+m.text()); });
    await p.goto('http://localhost:8766/'); const f=p.frames()[1]; await p.waitForTimeout(1500);
    ok(await f.$eval('#modal',d=>!d.hidden&&/Commencer/.test(d.textContent)).catch(()=>false),tag+' écran de nouvelle partie affiché');
    await f.click('#ng-go'); await p.waitForTimeout(500);
    ok(await f.evaluate(()=>!!document.querySelector('.leaflet-container')&&S.hubs[0]==='KIN'),tag+' carte et partie lancées');
    ok(/Hakvision Rail/.test(await f.textContent('header')),tag+' nom « Hakvision Rail »');
    await f.click('[data-act=tab][data-v=open]'); await f.waitForSelector('#preview button'); await f.click('[data-act=openline]');
    await f.click('[data-act=speed][data-v="3600"]'); await p.waitForTimeout(2000);
    ok(await f.evaluate(()=>S.lines.length===1&&document.querySelectorAll('.trn').length>0),tag+' ligne ouverte, train sur la carte');
    console.log('   indicateur :',await f.textContent('#saved'));
    await p.screenshot({path:(process.env.OUT||'/tmp')+`/artifact-${tag}.png`}); }
  ok(errs.length===0,'aucune erreur JS '+errs.join(' | '));
  await b.close(); srv.close(); process.exit(fails?1:0); })();
