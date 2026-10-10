// Test de la logique du jeu dans Node : node tests/sim.test.js
const fs=require('fs'), path=require('path'), vm=require('vm');
const store={}; const ctx={console,Math,Date,JSON,Object,Array,Map,Set,String,Number,Infinity,isFinite,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};
vm.createContext(ctx);
for(const f of ['data.js','network.js','sim.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx,{filename:f});
vm.runInContext('this.__g={get S(){return S},set S(v){S=v},STATIONS,MODELS,NET,rt,newGame,openLine,previewLine,advance,routeOf,trainsNeeded,weeklyEst,buyHub,startBuild,startWork,borrow,fmtMoney,fmtDur,lineById,tripsOf,legPos,econOf,load,save,catchUp,PROJECTS,RIVAL_LINES,shortestPath,TRACKS};',ctx);
const G=ctx.__g; let fails=0; const ok=(c,m)=>{ if(!c){ fails++; console.log('ÉCHEC :',m); } else console.log('ok  ',m); };
ctx.Math.random=(()=>{ let s=42; return ()=>(s=(s*16807)%2147483647)/2147483647; })();
G.newGame('Test','KIN',150e6); G.rt();
// toutes les données référencent des gares existantes
ok(G.TRACKS.every(t=>G.STATIONS[t[0]]&&G.STATIONS[t[1]]),'voies → gares existantes');
ok(G.RIVAL_LINES.every(r=>G.STATIONS[r[1]]&&G.STATIONS[r[2]]&&G.MODELS[r[3]]),'lignes concurrentes valides');
ok(G.PROJECTS.every(p=>p.path.every(c=>G.STATIONS[c])),'projets valides');
const R=G.rt(); const bad=R.rivals.filter(L=>!G.routeOf(L)); ok(bad.length===0,'itinéraire pour chaque concurrent '+bad.map(l=>l.op+' '+l.a+'-'+l.b).join(','));
// itinéraires typiques
for(const [a,b,m] of [['KIN','MAT','PAX_C'],['KWZ','LOB','FRT_C'],['LUB','DAR','PAX_C'],['LUB','ILB','PAX_C'],['KLM','DAR','PAX_C'],['PAR','LON','TGV_S'],['MAT','KIN','FRT_C']]){
  const r=G.shortestPath(a,b,G.MODELS[m]); const p=G.previewLine(G.S.hubs.includes(a)?a:(G.S.hubs.push(a),a),b,m,'express',7,6,1);
  ok(r&&!p.err,`${a}→${b} ${m}: ${r?r.nodes.length:0} gares, ${p.r?Math.round(p.r.km):'-'} km, ${p.r?G.fmtDur(p.r.out.T):''}, ${p.need} rame(s), charge ${p.e?p.e.out.load+'/'+p.e.ret.load:''}, recette/sem ${p.est?G.fmtMoney(p.est.rev):''}, coût/sem ${p.est?G.fmtMoney(p.est.cost):''}`);
}
ok(!G.shortestPath('KIS','KIN',G.MODELS.PAX_C),'Kisangani non relié à Kinshasa au départ');
ok(!G.shortestPath('KIN','LUB',G.MODELS.PAX_C),'Kinshasa non relié au Katanga au départ');
// partie : ouvrir des lignes depuis Kinshasa et simuler
G.S.hubs=['KIN']; G.S.cash=150e6;
let e=G.openLine('KIN','MAT','PAX_C','express',7,6,1); ok(!e,'ouvrir Kinshasa–Matadi '+(e||''));
G.buyHub('MAT'); e=G.openLine('MAT','KIN','FRT_C','direct',14,5,1); ok(!e,'ouvrir fret Matadi–Kinshasa '+(e||''));
// position = fonction du temps
const L=G.S.lines[0]; const trips=G.tripsOf(L,G.S.time,G.S.time+2*86400e3); ok(trips.length>0,'trajets planifiés : '+trips.length);
const tr=trips[0], mid=G.legPos(tr.leg,(tr.arr-tr.dep)/2); ok(mid&&isFinite(mid.ll[0]),'position à mi-parcours '+mid.ll.map(x=>x.toFixed(2)).join(',')+' '+mid.kmh+' km/h');
const c0=G.S.cash; G.advance(52*7*86400e3);
const h=G.S.hist; ok(h.length>=51,'52 semaines simulées ('+h.length+' bilans)');
const y=h.reduce((s,w)=>s+w.rev-w.cost+w.tolls,0); console.log('   résultat 1 an :',G.fmtMoney(y),' trésorerie',G.fmtMoney(G.S.cash),' pax/sem',h.at(-1).pax,' t/sem',h.at(-1).tons);
for(const L of G.S.lines){ const w=G.weeklyEst(L); console.log('   ligne',L.a,L.b,L.model,'rames',L.trains,'recette/sem',G.fmtMoney(w.rev),'coût/sem',G.fmtMoney(w.cost)); }
ok(isFinite(G.S.cash),'trésorerie finie');
// chantier : pont Kinshasa–Brazzaville
G.S.cash=2e9; const P=G.PROJECTS[0]; e=G.startBuild(P.path[0],P.path[1],P.g,P.v,false,false,P.km,P.extra,P.name); ok(!e,'pont lancé '+(e||''));
G.advance(30*7*86400e3); ok(G.shortestPath('KIN','PNR',G.MODELS.PAX_C),'Kinshasa ↔ Pointe-Noire après le pont');
// sauvegarde / rechargement
G.save(); const t=G.S.time; G.S=null; ok(G.load()&&G.S.time===t,'sauvegarde rechargée');
// rattrapage hors-ligne
store['hakvision-rail-lr']=String(Date.now()-3*3600e3); G.S.lastReal=Date.now()-3*3600e3; const tt=G.S.time; G.catchUp(); ok(G.S.time-tt>=3*3600e3-1000,'rattrapage de 3 h');
// performance : rattrapage de 30 jours
const t0=Date.now(); G.advance(30*86400e3); console.log('   30 jours simulés en',Date.now()-t0,'ms');
console.log(fails?fails+' échec(s)':'TOUS LES TESTS PASSENT'); process.exit(fails?1:0);
