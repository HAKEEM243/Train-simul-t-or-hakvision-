// Test de la logique : node tests/game.test.js
const fs=require('fs'),path=require('path'),vm=require('vm'); const store={};
let clock=Date.UTC(2026,9,10,8,0);
const ctx={console,Math,JSON,Object,Array,Map,Set,String,Number,Infinity,isFinite,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)}}};
ctx.Date=class extends Date{ constructor(...a){ super(...(a.length?a:[clock])); } static now(){ return clock; } }; ctx.Date.UTC=Date.UTC;
vm.createContext(ctx); for(const f of ['data.js','data-world.js','rails.js','network.js','game.js','passengers.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx,{filename:f});
const run=c=>vm.runInContext(c,ctx); let fails=0; const ok=(c,m)=>{ console.log(c?'ok  ':'ÉCHEC',m); if(!c) fails++; };
run(`newGame('Test','KIN')`);
ok(run(`G.trains.length===1&&G.points===200`),'partie : 1 train, 200 points');
ok(run(`createRoute(1,'KIN','MAT','express')`)===null,'itinéraire Kinshasa–Matadi');
const p=run(`(()=>{ const p=tripPlan(G.trains[0]); return {pax:p.pax,tons:p.tons,rev:Math.round(p.rev),fuel:Math.round(p.fuel),T:fmtDurGame(p.T),km:Math.round(p.km)}; })()`); console.log('   trajet',JSON.stringify(p));
ok(run(`depart(G.trains[0])`)===null&&run(`G.trains[0].state`)==='enroute','départ');
const pos=run(`(()=>{ const tr=G.trains[0], g=geom(routeOfTrain(tr)); return legPos(g.out,(Date.now()-tr.dep)/tr.dur*g.out.T); })()`); ok(pos&&isFinite(pos.ll[0]),'position calculée');
const dur=run(`G.trains[0].dur`); console.log('   durée réelle',Math.round(dur/60e3),'min');
clock+=dur+1000; const cash0=run('G.cash'); run('tick()'); ok(run(`G.trains[0].state`)==='station'&&run('G.cash')>cash0,'arrivée + recette '+run('fmt$(G.cash-'+cash0+')'));
ok(run(`depart(G.trains[0])`)===null&&run(`G.trains[0].dir`)==='ret','retour');
ok(run(`claim('route1')`)===null&&run('G.points')===220,'objectif réclamé');
ok(run(`buyTrain('KIV6')`)!==null,'fret niveau 2 bloqué au niveau 1');
ok(run(`buyTrain('MAY3')`)===null&&run(`G.trains[1].state`)==='pending','commande → en attente');
clock+=10*60e3; run('tick()'); ok(run(`G.trains[1].state`)==='yard','livraison');
ok(/voie/.test(run(`canServe('ATL2','KIN','MAT')`)),'écartement incompatible refusé');
// absence de 12 h avec pilote automatique
run(`G.points+=100; setAuto(G.trains[0],true); G.fuel=G.fuelCap;`); clock+=12*3600e3; const t0=run('G.stats.trips'); run('tick()');
ok(run('G.stats.trips')-t0>=3,'pilote auto pendant l\'absence : '+(run('G.stats.trips')-t0)+' trajets, usure '+run('Math.round(G.trains[0].wear)')+' %, gazole '+run('Math.round(G.fuel)')+' L');
ok(run(`buyFuel('fuel',5000)`)===null||run('G.fuel')>=run('G.fuelCap')-1,'achat de gazole');
ok(run(`repair(G.trains[0])`)===null&&run('G.trains[0].wear')===0,'réparation');
run('save()'); run('G=null'); ok(run('load()')&&run('G.trains.length')===2,'sauvegarde rechargée');
// quelques itinéraires du monde
for(const [m,a,b] of [['KT12','LUB','KWZ'],['KT12','KWZ','LOB'],['UBM','KIS','UBD'],['KT12','PNR','BZV'],['ATL2','PAR','LON'],['KT12','KLM','DAR']]){ const e=run(`canServe('${m}','${a}','${b}')`); ok(!e,`${a}→${b} ${m} ${e||''}`); }
// données du monde
ok(run(`TRACKS.every(t=>STATIONS[t[0]]&&STATIONS[t[1]])`),'toutes les voies relient des gares existantes');
ok(run(`Object.values(STATIONS).every(s=>COUNTRIES[s.c]&&REGIONS[COUNTRIES[s.c][1]])`),'chaque gare a un pays et une région');
ok(run(`START_CITIES.every(c=>STATIONS[c]&&MODELS[starterModel(c)]&&reachable(c,MODELS[starterModel(c)]).size>0)`),'chaque ville de départ a un train de départ qui peut rouler');
console.log('   ',run(`Object.keys(STATIONS).length`),'gares,',run(`TRACKS.length`),'tronçons,',run(`new Set(Object.values(STATIONS).map(s=>s.c)).size`),'pays');
for(const [m,a,b] of [['VOL2','MOW','VVO'],['GAN2','DEL','CCU'],['HIR1','NYC','LAX'],['HIR1','SYD','PER'],['HIR1','PAR','IST'],['HIR1','PEK','SIN'],['HIR1','TOR','MEX'],['GAN2','BUE','MZA'],['KT12','LOS','KAN'],['KT12','LUB','MPM']]){
  const e=run(`canServe('${m}','${a}','${b}')`); ok(m==='HIR1'&&a==='PEK'?!!e:!e,`${a}→${b} ${m} ${e||''}`); }
// hubs
run(`G.cash=5e6`); ok(run(`createRoute(G.trains[1].id,'PAR','LON','express')`)!==null,'pas de ligne sans hub');
ok(run(`buyHub('PAR')`)===null&&run(`G.hubs.includes('PAR')`),'hub établi à Paris ('+run(`fmt$(hubCost('PAR'))`)+')');
ok(/hub/.test(run(`buyHub('PAR')`)),'pas deux fois le même hub');
ok(/voie/.test(run(`buyHub('GOM')`)),'pas de hub sans voie ferrée (Goma)');
run(`G.level=3; G.slots=20; buyTrain('ATL2');`); clock+=6*60e3; run('tick()'); const tid=run(`G.trains.find(t=>t.model==='ATL2').id`);
ok(run(`createRoute(${tid},'PAR','LON','express')`)===null,'ligne Paris–Londres depuis le hub de Paris');
ok(run(`(()=>{ const o=JSON.parse(JSON.stringify(G)); delete o.hubs; return adopt(o)&&G.hubs.includes('KIN')&&G.hubs.includes('PAR'); })()`),'anciennes sauvegardes : hubs reconstitués');
// arrêts, montées/descentes, fraude
run(`newGame('Arrêts','KIN'); G.cash=1e6`);
ok(run(`createRoute(G.trains[0].id,'KIN','MAT')`)===null,'ligne omnibus Kinshasa–Matadi');
const pl=run(`(()=>{ const p=tripPlan(G.trains[0]); return p.stops.map(s=>stationName(s.code)+' +'+s.on+' -'+s.off+' ='+s.onboard+' (attente '+s.wait+'/'+s.max+')').join('\\n')+'\\nfraudeurs '+p.fraud+', verbalisés '+p.caught+', amendes $'+p.fines+', perte $'+p.lost+', subvention '+p.sub+'%, contrôleurs $'+p.ctrlCost; })()`); console.log(pl.replace(/^/gm,'     '));
ok(run(`tripPlan(G.trains[0]).stops.length`)===13,'13 arrêts sur Kinshasa–Matadi');
ok(run(`(()=>{ const p=tripPlan(G.trains[0]); return p.stops.reduce((s,x)=>s+x.on,0)>0&&p.stops.at(-1).onboard===0; })()`),'montées et descentes cohérentes');
const r0=run(`G.routes[0].id`);
ok(run(`updateRoute(${r0},{direct:true})`)===null&&run(`tripPlan(G.trains[0]).stops.length`)===2,'trajet direct : 2 arrêts');
ok(run(`updateRoute(${r0},{direct:false,stops:['KIN','KSG','MBG','KMP','MAT']})`)===null&&run(`tripPlan(G.trains[0]).stops.map(s=>s.code).join()`)==='KIN,KSG,MBG,KMP,MAT','arrêts choisis : Kasangulu, Mbanza-Ngungu, Kimpese');
const f0=run(`tripPlan(G.trains[0]).caught`); run(`G.trains[0].ctrl=0`); const f1=run(`tripPlan(G.trains[0])`);
ok(f1.caught===0&&f1.fraud>run(`(G.trains[0].ctrl=2,tripPlan(G.trains[0]).fraud)`),'contrôleurs : moins de fraude, des amendes ('+f0+' verbalisés avec 1 contrôleur)');
const w0=run(`poolNow('KIN')`); run(`depart(G.trains[0])`); ok(run(`poolNow('KIN')`)<w0,'les voyageurs qui montent quittent la gare');
clock+=5*60e3; const pr=run(`(()=>{ const x=tripProgress(G.trains[0]); return x&&x.onboard>=0; })()`); ok(pr,'voyageurs à bord pendant le trajet');
run(`G.trains[0].speed=0.6`); clock+=60*60e3; run('tick()'); ok(run(`tripPlan(G.trains[0]).fuel`)<run(`(G.trains[0].speed=1,tripPlan(G.trains[0]).fuel)`),'rouler moins vite consomme moins');
ok(run(`setService(G.trains[0],false)`)===null&&run(`G.trains[0].state`)==='yard'&&run(`setService(G.trains[0],true)`)===null&&run(`G.trains[0].state`)==='station','garage puis remise en service');
// manifeste des passagers
run(`newGame('Manifeste','KIN'); G.cash=1e6; createRoute(G.trains[0].id,'KIN','MAT'); G.trains[0].ctrl=2; depart(G.trains[0])`);
const mf=run(`(()=>{ const tr=G.trains[0], M=manifestOf(tr), x=tr.trip; const nat={}; M.pax.forEach(p=>nat[p.nat]=(nat[p.nat]||0)+1);
  return {n:M.pax.length,pax:x.pax,fr:M.pax.filter(p=>p.fraud).length,xf:x.fraud,ca:M.pax.filter(p=>p.caught).length,xc:x.caught,cd:nat.CD/M.pax.length,
    ok:M.pax.every(p=>STATIONS[p.from]&&STATIONS[p.to]&&p.i<p.j&&p.first&&p.last&&p.how&&p.why&&p.age>0),ex:M.pax.slice(0,4).map(p=>p.flag+' '+p.first+' '+p.last+', '+p.age+' ans, '+p.job+' : '+stationName(p.from)+' → '+stationName(p.to)+' · '+p.how+' · '+p.why+' · '+p.bag+(p.fraud?' · FRAUDE'+(p.caught?' verbalisé':''):'')),
    again:JSON.stringify(manifestOf(tr).pax[5])}; })()`);
ok(mf.n===mf.pax,'manifeste : '+mf.n+' voyageurs = trajet ('+mf.pax+')');
ok(mf.fr===mf.xf&&mf.ca===mf.xc,'fraudeurs ('+mf.fr+') et verbalisés ('+mf.ca+') identiques au trajet');
ok(mf.ok,'chaque voyageur a nom, âge, gares, moyen d\'arrivée et motif');
ok(mf.cd>0.6,'ligne au Congo : majorité de Congolais ('+Math.round(mf.cd*100)+' %)');
mf.ex.forEach(e=>console.log('     '+e));
run(`MANIFEST_CACHE.clear()`); ok(run(`JSON.stringify(manifestOf(G.trains[0]).pax[5])`)===mf.again,'manifeste identique après rechargement (déterministe)');
clock+=60*60e3; run('tick()'); ok(run(`manifestOf(G.trains[0],G.trains[0].last).pax.length`)===mf.n,'manifeste du dernier trajet conservé');
console.log(fails?fails+' échec(s)':'TOUS LES TESTS PASSENT'); process.exit(fails?1:0);
