// Test de la logique : node tests/game.test.js
const fs=require('fs'),path=require('path'),vm=require('vm'); const store={};
let clock=Date.UTC(2026,9,10,8,0);
const ctx={console,Math,JSON,Object,Array,Map,Set,String,Number,Infinity,isFinite,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)}}};
ctx.Date=class extends Date{ constructor(...a){ super(...(a.length?a:[clock])); } static now(){ return clock; } }; ctx.Date.UTC=Date.UTC;
vm.createContext(ctx); for(const f of ['data.js','network.js','game.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx,{filename:f});
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
console.log(fails?fails+' échec(s)':'TOUS LES TESTS PASSENT'); process.exit(fails?1:0);
