/* =========================================================
   Hakvision Rail — logique du jeu
   Une ligne = un train. Le joueur fait partir ses trains ; à l'arrivée, la recette est encaissée et le train
   attend en gare. Le jeu se joue en temps réel (accéléré) : les trajets continuent quand le jeu est fermé.
   La position d'un train est une fonction du temps (départ + durée), rien n'est simulé image par image.
   ========================================================= */
'use strict';
const SAVE_KEY='hakvision-rail-v2', SAVE_V=2;
const ROUTE_COLORS=['#9b2fae','#e0457b','#0f9d8a','#2563eb','#f97316','#65a30d','#7c3aed','#db2777','#0891b2','#ca8a04'];
const now=()=>Date.now();
let G=null;                    // état unique du jeu (sauvegardé tel quel)
let SAVE_INFO={local:false,at:0};

/* ---------- partie ---------- */
function newGame(name,start){
  const t=now();
  G={v:SAVE_V,name:name||'Hakvision Rail',start:start||'KIN',cash:400000,points:200,xp:0,level:1,
     fuel:15000,fuelCap:30000,energy:20000,energyCap:60000,slots:8,scale:30,
     trains:[],routes:[],seq:1,routeSeq:0,stats:{trips:0,pax:0,tons:0,rev:0,km:0,repairs:0,fuelBuys:0,stations:[]},
     ledger:[],mail:[],claimed:{},priceHist:[],debt:0,lastDaily:0,created:t,lastSeen:t,hubs:[start||'KIN']};
  addTrain(starterModel(G.start),'yard');
  mail('Bienvenue chez '+G.name+' !','Votre premier hub est à '+stationName(G.start)+' et votre premier train ('+MODELS[G.trains[0].model].name+') vous attend au dépôt. Ouvrez le DÉPÔT → ITINÉRAIRES pour créer une ligne depuis votre hub, puis faites partir le train depuis la liste « À la gare ». Établissez des hubs partout dans le monde pour y ouvrir des lignes.');
  G.lastDaily=Math.floor(t/864e5); return G;
}
/* ---------- hubs : chaque ligne part d'un hub ---------- */
function gaugesAt(c){ net(); return new Set(NET.adj[c].filter(e=>!e.hs&&!e.ferry).map(e=>e.g)); }
function starterModel(c){ const g=gaugesAt(c); return g.has('C')?'KT12':g.has('S')?'HIR1':g.has('B')?'GAN2':g.has('R')?'VOL2':g.has('M')?'UBM':'KT12'; }
function hubCost(c){ const R=regionOf(c); return Math.round(R.hub*60000*(1+STATIONS[c].p/8)/1000)*1000; }
function buyHub(c){ if(G.hubs.includes(c)) return 'C\'est déjà un de vos hubs.'; net(); if(!NET.adj[c].filter(e=>!e.hs).length) return 'Pas de voie ferrée en service dans cette ville.';
  const k=hubCost(c); if(G.cash<k) return 'Il faut '+fmt$(k)+' pour établir ce hub.'; G.cash-=k; G.hubs.push(c); book('buy',k);
  mail('Nouveau hub : '+stationName(c),'Vous pouvez maintenant créer des lignes au départ de '+stationName(c)+' ('+COUNTRIES[STATIONS[c].c][0]+'). Pensez à commander un train adapté à l\'écartement local ('+[...gaugesAt(c)].map(g=>GAUGES[g]).join(', ')+').'); return null; }
function addTrain(model,state,until){ const m=MODELS[model], n=G.trains.filter(t=>t.model===model).length+1;
  const tr={id:G.seq++,model,name:m.name+' #'+n,wear:0,state:state||'yard',route:null,at:'a',dep:0,dur:0,dir:'out',since:now(),until:until||0,auto:false,trip:null};
  G.trains.push(tr); return tr; }
function mail(title,body){ G.mail.unshift({t:now(),title,body,read:false}); if(G.mail.length>60) G.mail.length=60; }
const trainById=id=>G.trains.find(t=>t.id===id);
const routeById=id=>G.routes.find(r=>r.id===id);
const routeOfTrain=tr=>tr.route?routeById(tr.route):null;
const stationName=c=>STATIONS[c]?STATIONS[c].n:c;

/* ---------- niveaux et points ---------- */
const xpFor=l=>Math.round(120*Math.pow(1.55,l-1));
function addXp(x){ G.xp+=x; while(G.xp>=xpFor(G.level)){ G.xp-=xpFor(G.level); G.level++; G.points+=25; G.slots+=1;
  mail('Niveau '+G.level+' atteint ! 🎉','+25 points et +1 emplacement au dépôt. '+(Object.values(MODELS).filter(m=>m.lvl===G.level).map(m=>'Nouveau matériel : '+m.name+'.').join(' ')||'')); } }
function dailyBonus(){ const d=Math.floor(now()/864e5); if(G.lastDaily!==d){ G.lastDaily=d; G.points+=10; G.cash+=0; return true; } return false; }

/* ---------- prix du marché (déterministes : identiques hors-ligne) ---------- */
const hash=n=>{ const x=Math.sin(n*12.9898)*43758.5453; return x-Math.floor(x); };
function fuelPrice(t){ t=t||now(); const h=Math.floor(t/6e5); return +(0.95*(1+0.22*Math.sin(t/216e5*2*Math.PI)+0.1*(hash(h)-0.5))).toFixed(3); }
function energyPrice(t){ t=t||now(); const h=Math.floor(t/6e5); return +(0.14*(1+0.25*Math.sin(t/302e5*2*Math.PI+1)+0.12*(hash(h+7)-0.5))).toFixed(3); }
function companyValue(){ return G.cash-G.debt+G.trains.reduce((s,t)=>s+(MODELS[t.model].price||MODELS[t.model].pts*500)*(1-t.wear/200),0)+G.routes.length*20000; }
function sharePrice(t){ t=t||now(); return Math.max(0.5,companyValue()/100000*(1+0.04*(hash(Math.floor(t/9e5))-0.5))); }
function recordPrice(){ const t=now(), last=G.priceHist[G.priceHist.length-1]; if(!last||t-last.t>=6e5){ G.priceHist.push({t,p:+sharePrice(t).toFixed(2)}); if(G.priceHist.length>200) G.priceHist.shift(); } }

/* ---------- itinéraires (une ligne = un train) ---------- */
const RC=new Map();          // cache des itinéraires (jamais sauvegardé)
let NET_READY=false; function net(){ if(!NET_READY){ buildNet(); NET_READY=true; } }
function geom(rt){ net(); const key=rt.a+'|'+rt.b+'|'+rt.model+'|'+rt.stopMode; if(!RC.has(key)) RC.set(key,buildRoute(rt.a,rt.b,MODELS[rt.model],MODELS[rt.model].kind==='frt'?'direct':rt.stopMode)); return RC.get(key); }
function routeLetter(n){ const L='ABCDEFGHIJKLMNOPQRSTUVWXYZ'; return n<26?L[n]:L[Math.floor(n/26)-1]+L[n%26]; }
function canServe(model,a,b){ net(); const m=MODELS[model]; if(a===b) return 'Choisissez deux gares différentes.';
  const r=buildRoute(a,b,m,'express'); if(!r) return 'Aucune voie compatible : ce train demande la '+GAUGES[m.g].toLowerCase()+(m.el?' électrifiée':'')+'.'; return null; }
function createRoute(trainId,a,b,stopMode,name){
  const tr=trainById(trainId); if(!tr) return 'Choisissez un train.'; if(!G.hubs.includes(a)) return 'La ligne doit partir d\'un de vos hubs.'; if(tr.state==='pending') return 'Ce train n\'est pas encore livré.';
  if(tr.state==='enroute') return 'Ce train est en route.';
  const e=canServe(tr.model,a,b); if(e) return e;
  if(tr.route){ G.routes=G.routes.filter(r=>r.id!==tr.route); }
  const id=++G.routeSeq, rt={id,name:name||routeLetter(G.routes.length)+'-Line',color:ROUTE_COLORS[G.routes.length%ROUTE_COLORS.length],a,b,stopMode:stopMode||'express',model:tr.model,train:tr.id,created:now()};
  G.routes.push(rt); tr.route=id; tr.state='station'; tr.at='a'; tr.since=now();
  for(const s of geom(rt).out.stops) if(!G.stats.stations.includes(s.code)) G.stats.stations.push(s.code);
  return null; }
function deleteRoute(id){ const rt=routeById(id); if(!rt) return; const tr=trainById(rt.train); if(tr&&tr.state==='enroute') return 'Attendez l\'arrivée du train.';
  G.routes=G.routes.filter(r=>r.id!==id); if(tr){ tr.route=null; tr.state='yard'; } return null; }

/* ---------- économie d'un trajet ---------- */
function paxDemand(a,b,km){ const A=STATIONS[a],B=STATIONS[b], K=(regionOf(a).K+regionOf(b).K)/2;
  return 650*K*Math.pow(A.p,0.8)*Math.pow(B.p,0.8)/Math.pow(Math.max(0.5,km/100),1.1); }
const SEAPORTS=()=>Object.values(STATIONS).filter(s=>(s.port||0)>=0.6);
function frtDemand(a,b){ const A=STATIONS[a],B=STATIONS[b]; let t=0;   // tonnes / semaine
  if(A.mine&&(B.port||0)>=0.6){ let tot=0; for(const p of SEAPORTS()) tot+=p.port/Math.pow(gcKm(a,p.code)/1000+0.2,2); t+=A.mine*1000*(B.port/Math.pow(gcKm(a,b)/1000+0.2,2))/tot; }
  if((A.port||0)>=0.6&&B.p>=0.5){ let tot=0; for(const p of SEAPORTS()) if(p.code!==b) tot+=p.port/Math.pow(gcKm(b,p.code)/100+0.3,2); t+=B.p*2500*(A.port/Math.pow(gcKm(b,a)/100+0.3,2))/tot; }
  return t; }
const fareOf=(a,km)=>{ const R=regionOf(a); return R.base+R.fare*km; };
/* résultat attendu d'un trajet (sans aléa) : voyageurs, tonnes, recette, carburant */
function tripPlan(tr,dirOverride){ const rt=routeOfTrain(tr); if(!rt) return null; const g=geom(rt); if(!g) return null;
  const dir=dirOverride||(tr.at==='a'?'out':'ret'), leg=g[dir], m=MODELS[tr.model], st=leg.stops, n=st.length;
  const same=G.routes.filter(r=>[r.a,r.b].sort().join()===[rt.a,rt.b].sort().join()).length;   // vos lignes en concurrence entre elles
  let pax=0, rev=0;
  if(m.pax){ const seg=new Array(n).fill(0), pairs=[];
    for(let i=0;i<n;i++) for(let j=i+1;j<n;j++){ const km=st[j].km-st[i].km, h=Math.max(0.2,(st[j].arr-st[i].dep)/HOUR), sp=Math.min(2.2,Math.max(0.4,Math.pow(km/h/50,0.6)));
      const d=paxDemand(st[i].code,st[j].code,km)*0.15*sp*(m.comfort&&h>5?1.3:1)/same; pairs.push([i,j,d,km]); for(let s=i;s<j;s++) seg[s]+=d; }
    const k=Math.min(1,m.pax/Math.max(1,...seg)); for(const [i,,d,km] of pairs){ const p=d*k; pax+=p; rev+=p*fareOf(st[i].code,km)*(m.comfort&&km>400?m.comfort:1); } }
  let tons=0; if(m.t){ const a=st[0].code,b=st[n-1].code; tons=Math.min(m.t,frtDemand(a,b)/7*0.3/same+m.t*0.15); rev+=tons*leg.km*regionOf(a).frt; }
  const fuel=m.fpk?leg.km*m.fpk:0, energy=m.epk?leg.km*m.epk:0;
  const bad=leg.edges.reduce((s,e)=>s+(e.v<40?e.km:0),0)/leg.km;
  return {dir,leg,km:leg.km,pax:Math.round(pax),tons:Math.round(tons),rev,fuel,energy,wear:leg.km/1000*7*(1+bad*0.8),T:leg.T,lf:m.pax?Math.min(1,pax/m.pax):tons/m.t}; }

/* ---------- départ et arrivée ---------- */
function canDepart(tr){ if(tr.state!=='station') return 'Le train n\'est pas en gare.'; const p=tripPlan(tr); if(!p) return 'Itinéraire impossible.';
  if(tr.wear>=100) return 'Train hors d\'usage : réparez-le (ENTRETIEN).';
  if(p.fuel>G.fuel) return 'Gazole insuffisant : il faut '+Math.ceil(p.fuel).toLocaleString('fr')+' L (CARBURANT).';
  if(p.energy>G.energy) return 'Énergie insuffisante : il faut '+Math.ceil(p.energy).toLocaleString('fr')+' kWh (CARBURANT).';
  return null; }
function depart(tr,at){ const e=canDepart(tr); if(e) return e; const p=tripPlan(tr), t=at||now();
  G.fuel-=p.fuel; G.energy-=p.energy;
  const luck=0.85+0.3*hash(t/1000+tr.id), breakdown=tr.wear>80&&hash(t/777+tr.id)<0.2;
  tr.trip={dir:p.dir,pax:Math.round(p.pax*luck),tons:Math.round(p.tons*luck),rev:Math.round(p.rev*luck*(breakdown?0.7:1)),km:p.km,wear:p.wear,breakdown};
  tr.state='enroute'; tr.dir=p.dir; tr.dep=t; tr.dur=Math.max(60e3,p.T/G.scale*(breakdown?1.5:1)); return null; }
function arrive(tr){ const rt=routeOfTrain(tr), x=tr.trip, t=tr.dep+tr.dur; tr.state='station'; tr.at=tr.dir==='out'?'b':'a'; tr.since=t; tr.trip=null;
  if(!x) return; tr.lastRev=x.rev; G.cash+=x.rev; tr.wear=Math.min(100,tr.wear+x.wear); const s=G.stats; s.trips++; s.pax+=x.pax; s.tons+=x.tons; s.rev+=x.rev; s.km+=x.km;
  book('rev',x.rev,t); addXp(Math.round(x.km/20+(x.pax+x.tons)/80));
  if(x.breakdown) mail('Panne sur '+(rt?rt.name:tr.name),'Le '+tr.name+' est arrivé avec du retard (usure '+Math.round(tr.wear)+' %). Pensez à l\'ENTRETIEN.');
  if(tr.wear>=100) mail(tr.name+' est hors d\'usage','Il doit être réparé avant de repartir.'); }
/* fait avancer le monde jusqu'à maintenant : arrivées (même pendant l'absence) et départs automatiques */
function tick(){ const t=now(); let guard=0, arrived=[];
  for(const tr of G.trains){ if(tr.state==='pending'&&tr.until<=t){ tr.state='yard'; mail('Livraison : '+tr.name,'Votre nouveau train est au dépôt. Affectez-le à un itinéraire.'); } }
  let again=true; while(again&&guard++<2000){ again=false;
    for(const tr of G.trains){ if(tr.state==='enroute'&&tr.dep+tr.dur<=t){ const ta=tr.dep+tr.dur; arrive(tr); arrived.push(tr);
        if(tr.auto&&!depart(tr,ta+5*60e3/Math.max(1,G.scale/30))) again=true; } } }
  recordPrice(); G.lastSeen=t; return arrived; }
function departMany(ids){ let ok=0, err=''; for(const id of ids){ const tr=trainById(id); if(!tr) continue; const e=depart(tr); if(e) err=tr.name+' : '+e; else ok++; } return {ok,err}; }

/* ---------- comptabilité (par heure réelle) ---------- */
function book(k,v,t){ const h=Math.floor((t||now())/36e5); let b=G.ledger[G.ledger.length-1]; if(!b||b.h!==h){ b={h,rev:0,fuel:0,repair:0,buy:0}; G.ledger.push(b); if(G.ledger.length>72) G.ledger.shift(); } b[k]+=v; }

/* ---------- carburant, entretien, achats ---------- */
function buyFuel(kind,qty){ const price=kind==='fuel'?fuelPrice():energyPrice(), cap=kind==='fuel'?G.fuelCap-G.fuel:G.energyCap-G.energy; qty=Math.min(qty,cap);
  if(qty<=0) return 'Réservoir plein.'; const cost=Math.round(qty*price); if(cost>G.cash) return 'Pas assez d\'argent ('+fmt$(cost)+').';
  G.cash-=cost; G[kind]+=qty; G.stats.fuelBuys++; book('fuel',cost); return null; }
const repairCost=tr=>Math.round((MODELS[tr.model].price||200000)*tr.wear/100*0.25);
function repair(tr){ if(tr.state==='enroute') return 'Le train est en route.'; if(tr.wear<1) return 'Déjà en parfait état.'; const c=repairCost(tr); if(c>G.cash) return 'Pas assez d\'argent ('+fmt$(c)+').';
  G.cash-=c; tr.wear=0; G.stats.repairs++; book('repair',c); return null; }
const usedSlots=()=>G.trains.length;
function buyTrain(model,withPoints){ const m=MODELS[model]; if(m.lvl>G.level) return 'Disponible au niveau '+m.lvl+'.'; if(usedSlots()>=G.slots) return 'Dépôt plein : achetez des emplacements (BOUTIQUE).';
  if(withPoints||m.pts){ const p=m.pts||Math.ceil(m.price/2000); if(G.points<p) return 'Il faut '+p+' points.'; G.points-=p; }
  else { if(G.cash<m.price) return 'Pas assez d\'argent ('+fmt$(m.price)+').'; G.cash-=m.price; book('buy',m.price); }
  addTrain(model,'pending',now()+Math.min(5*60e3,60e3+m.price/1000*120)); return null; }
function sellTrain(tr){ if(tr.state==='enroute') return 'Le train est en route.'; if(tr.route) deleteRoute(tr.route);
  const v=Math.round((MODELS[tr.model].price||0)*0.5*(1-tr.wear/200)); G.cash+=v; G.trains=G.trains.filter(t=>t!==tr); return null; }
const SHOP=[
  {id:'slots',name:'+4 emplacements au dépôt',pts:60,ico:'yard',go:()=>{ G.slots+=4; }},
  {id:'tank',name:'Réservoir de gazole +20 000 L',pts:80,ico:'fuel',go:()=>{ G.fuelCap+=20000; }},
  {id:'batt',name:'Stockage d\'énergie +40 000 kWh',pts:80,ico:'bolt',go:()=>{ G.energyCap+=40000; }},
  {id:'fill',name:'Plein gratuit (gazole + énergie)',pts:40,ico:'fuel',go:()=>{ G.fuel=G.fuelCap; G.energy=G.energyCap; }},
  {id:'deliver',name:'Livraison express de tous les trains commandés',pts:15,ico:'train',go:()=>{ for(const t of G.trains) if(t.state==='pending') t.until=0; }},
  {id:'cash',name:'Subvention de 150 000 $',pts:50,ico:'bank',go:()=>{ G.cash+=150000; }}
];
function shopBuy(id){ const it=SHOP.find(s=>s.id===id); if(!it) return 'Article inconnu.'; if(G.points<it.pts) return 'Il faut '+it.pts+' points.'; G.points-=it.pts; it.go(); return null; }
function setAuto(tr,on){ if(on&&!tr.auto){ if(G.points<30) return 'Le pilote automatique coûte 30 points.'; G.points-=30; } tr.auto=!!on; return null; }
function borrow(x){ if(G.debt+x>1500000) return 'Plafond d\'emprunt : 1 500 000 $.'; G.debt+=x; G.cash+=x; return null; }
function repay(x){ x=Math.min(x,G.debt,G.cash); if(x<=0) return 'Rien à rembourser.'; G.debt-=x; G.cash-=x; return null; }
function chargeInterest(){ const t=now(), h=Math.floor(t/36e5); if(!G.intH) G.intH=h; if(h>G.intH&&G.debt>0){ G.cash-=G.debt*0.002*(h-G.intH); } G.intH=h; }

/* ---------- objectifs ---------- */
const CONGO=c=>['CD','CG'].includes(STATIONS[c].c);
const MISSIONS=[
  {id:'route1',name:'Créer votre premier itinéraire',pts:20,p:()=>[G.routes.length,1]},
  {id:'trip1',name:'Faire arriver un train à destination',pts:15,p:()=>[G.stats.trips,1]},
  {id:'buy1',name:'Commander un nouveau train',pts:20,p:()=>[G.trains.length,2]},
  {id:'kinmat',name:'Relier Kinshasa et Matadi',pts:30,p:()=>[G.routes.some(r=>[r.a,r.b].sort().join()==='KIN,MAT')?1:0,1]},
  {id:'fuel1',name:'Acheter du carburant',pts:10,p:()=>[G.stats.fuelBuys,1]},
  {id:'trip10',name:'Réaliser 10 trajets',pts:30,p:()=>[G.stats.trips,10]},
  {id:'pax5k',name:'Transporter 5 000 voyageurs',pts:50,p:()=>[G.stats.pax,5000]},
  {id:'katanga',name:'Desservir Lubumbashi',pts:40,p:()=>[G.stats.stations.includes('LUB')?1:0,1]},
  {id:'routes3',name:'Avoir 3 lignes',pts:40,p:()=>[G.routes.length,3]},
  {id:'repair',name:'Réparer un train',pts:10,p:()=>[G.stats.repairs,1]},
  {id:'brazza',name:'Desservir Brazzaville et Pointe-Noire',pts:40,p:()=>[['BZV','PNR'].filter(c=>G.stats.stations.includes(c)).length,2]},
  {id:'tons10k',name:'Transporter 10 000 t de fret',pts:80,p:()=>[G.stats.tons,10000]},
  {id:'congo15',name:'Desservir 15 gares congolaises',pts:80,p:()=>[G.stats.stations.filter(CONGO).length,15]},
  {id:'trains5',name:'Posséder 5 trains',pts:50,p:()=>[G.trains.length,5]},
  {id:'lvl5',name:'Atteindre le niveau 5',pts:80,p:()=>[G.level,5]},
  {id:'lobito',name:'Exporter du cuivre de Kolwezi vers Lobito',pts:100,p:()=>[G.routes.some(r=>[r.a,r.b].sort().join()==='KWZ,LOB'&&MODELS[r.model].t)?1:0,1]},
  {id:'world',name:'Ouvrir une ligne hors d\'Afrique',pts:60,p:()=>[G.routes.some(r=>!['AF'].includes(COUNTRIES[STATIONS[r.a].c][1]))?1:0,1]},
  {id:'pax100k',name:'Transporter 100 000 voyageurs',pts:150,p:()=>[G.stats.pax,100000]},
  {id:'million',name:'Avoir 1 000 000 $ en caisse',pts:100,p:()=>[Math.floor(G.cash),1000000]},
  {id:'routes10',name:'Avoir 10 lignes',pts:120,p:()=>[G.routes.length,10]},
  {id:'hub2',name:'Établir un deuxième hub',pts:30,p:()=>[G.hubs.length,2]},
  {id:'hubworld',name:'Établir un hub hors d\'Afrique',pts:60,p:()=>[G.hubs.some(c=>COUNTRIES[STATIONS[c].c][1]!=='AF')?1:0,1]},
  {id:'hubs5',name:'Avoir 5 hubs',pts:120,p:()=>[G.hubs.length,5]},
  {id:'cont3',name:'Des hubs dans 3 régions du monde',pts:150,p:()=>[new Set(G.hubs.map(c=>COUNTRIES[STATIONS[c].c][1])).size,3]},
  {id:'hubs10',name:'Avoir 10 hubs',pts:250,p:()=>[G.hubs.length,10]}
];
const missionDone=m=>{ const [a,b]=m.p(); return a>=b; };
function claim(id){ const m=MISSIONS.find(x=>x.id===id); if(!m||G.claimed[id]||!missionDone(m)) return 'Objectif non atteint.'; G.claimed[id]=true; G.points+=m.pts; addXp(m.pts); return null; }
const claimable=()=>MISSIONS.filter(m=>!G.claimed[m.id]&&missionDone(m)).length;

/* ---------- sauvegarde (navigateur ; la sauvegarde en ligne est dans ui.js) ---------- */
function save(){ if(!G||G._fresh) return; G.savedAt=now(); try{ localStorage.setItem(SAVE_KEY,JSON.stringify(G)); SAVE_INFO.local=true; SAVE_INFO.at=now(); }catch(e){ SAVE_INFO.local=false; } }
function adopt(o){ if(!o||o.v!==SAVE_V||!Array.isArray(o.trains)) return false; G=o; RC.clear();
  if(!G.hubs) G.hubs=[...new Set([G.start||'KIN',...G.routes.map(r=>r.a)])];      // anciennes sauvegardes
  return true; }
function load(){ try{ return adopt(JSON.parse(localStorage.getItem(SAVE_KEY)||'null')); }catch(e){ return false; } }

/* ---------- formats ---------- */
function fmt$(v){ return (v<0?'-':'')+'$'+Math.round(Math.abs(v)).toLocaleString('en-US'); }
function fmtAgo(t){ const s=Math.max(0,(now()-t)/1000); return s<60?'à l\'instant':s<3600?'il y a '+Math.floor(s/60)+' min':s<86400?'il y a '+Math.floor(s/3600)+' h':'il y a '+Math.floor(s/86400)+' j'; }
function fmtIn(ms){ const s=Math.max(0,ms/1000); return s<60?Math.ceil(s)+' s':s<3600?Math.ceil(s/60)+' min':Math.floor(s/3600)+' h '+String(Math.round((s%3600)/60)).padStart(2,'0'); }
function fmtDurGame(ms){ const h=ms/HOUR; return h<1?Math.round(ms/MIN)+' min':Math.floor(h)+' h '+String(Math.round((h%1)*60)).padStart(2,'0'); }
