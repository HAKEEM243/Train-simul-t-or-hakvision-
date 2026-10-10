/* =========================================================
   Simulation : état unique S, calendrier fixe, économie, horloge, IA des concurrents, sauvegarde.
   Principe : la position d'un train est une FONCTION DU TEMPS (calculée depuis l'horaire).
   ========================================================= */
'use strict';
const SAVE_KEY='hakvision-rail-save', LR_KEY='hakvision-rail-lr', OLD_KEYS=['congo-rail-save'], SAVE_V=1;
let SAVE_INFO={local:false,at:0};   // état de la sauvegarde, affiché dans l'interface
const TURN={pax:40*MIN,frt:3*HOUR};                       // temps de retournement au terminus
const LINE_COLORS=['#ffd60a','#4cc9f0','#f72585','#80ed99','#ff9f1c','#b388ff','#ff595e','#00f5d4','#e9c46a','#90e0ef'];
let S=null;

/* ---------- état ---------- */
function newGame(name,hub,cash){
  S={v:SAVE_V,name:name||'Hakvision Rail',time:Date.UTC(2026,0,5,4,0),start:Date.UTC(2026,0,5),cash:cash||150e6,debt:0,speed:600,paused:false,
     lastReal:Date.now(),hubs:[hub||'KIN'],lines:[],seq:1,net:{mods:{},built:[]},works:[],news:[],hist:[],
     wk:newWeek(),incidents:[],rivals:{extra:[],mul:{}},metal:1,lastWeek:0,tolls:0};
  addNews('🎉 '+S.name+' est fondée à '+STATIONS[S.hubs[0]].n+' avec '+fmtMoney(S.cash)+' de capital.','me');
  rtDirty(); save();
}
const newWeek=()=>({rev:0,cost:0,pax:0,tons:0,trips:0,fixed:0,lines:{}});
// sauvegarde locale (navigateur) ; la sauvegarde en ligne (compte claude.ai) est gérée dans ui.js
function save(){ if(!S||S._noSave) return; S.lastReal=Date.now(); S.savedAt=Date.now();
  try{ localStorage.setItem(SAVE_KEY,JSON.stringify(S)); localStorage.setItem(LR_KEY,String(Date.now())); SAVE_INFO.local=true; SAVE_INFO.at=Date.now(); }catch(e){ SAVE_INFO.local=false; } }
function adopt(o){ if(!o||o.v!==SAVE_V||!o.lines) return false; S=o; if(S.hist&&S.hist.length>52) S.hist=S.hist.slice(-52); rtDirty(); return true; }
function load(){ for(const k of [SAVE_KEY,...OLD_KEYS]){ try{ const o=JSON.parse(localStorage.getItem(k)||'null'); if(adopt(o)) return true; }catch(e){} } return false; }
function addNews(txt,kind){ S.news.unshift({t:S.time,txt,kind:kind||'info'}); if(S.news.length>120) S.news.length=120; }

/* ---------- caches recalculés (jamais sauvegardés) ---------- */
let RT=null;
function rtDirty(){ RT=null; }
function rt(){ if(RT) return RT; buildNet(); RT={routes:new Map(),deps:new Map(),econ:new Map(),rivals:[],edgeUse:{}};
  RT.rivals=rivalLines(); for(const L of allLines()) routeOf(L); computeEcon(); return RT; }
function allLines(){ return S.lines.concat(RT?RT.rivals:[]); }
function rivalLines(){ const out=[]; RIVAL_LINES.concat(S.rivals.extra).forEach((r,i)=>{ const mul=S.rivals.mul[i]||1;
  out.push({id:'R'+i,rival:true,op:r[0],a:r[1],b:r[2],model:r[3],weekly:Math.max(1,Math.round(r[4]*mul)),hour:r[5],stopMode:'express',tariff:1}); }); return out; }
function routeOf(L){ const R=rt(); if(R.routes.has(L.id)) return R.routes.get(L.id); const m=MODELS[L.model];
  const r=buildRoute(L.a,L.b,m,m.kind==='frt'?'direct':L.stopMode); R.routes.set(L.id,r); return r; }

/* ---------- calendrier : départs hebdomadaires fixes (heure locale de la gare d'origine) ---------- */
const weekStart=t=>Math.floor((t-4*DAY)/WEEK)*WEEK+4*DAY;          // lundi 00:00 UTC (1970-01-05 était un lundi)
function depsOf(L){ const R=rt(); if(R.deps.has(L.id)) return R.deps.get(L.id);
  const w=L.weekly, tz=tzOf(L.a), out=[], frt=MODELS[L.model].kind==='frt';
  if(w<7){ for(let k=0;k<w;k++) out.push(Math.floor(k*7/w)*DAY+L.hour*HOUR); }
  else { const pd=Math.round(w/7), sp=frt?24/pd:Math.min(24/pd,pd>1?17/(pd-1):24);
    for(let d=0;d<7;d++) for(let j=0;j<pd;j++) out.push(d*DAY+(L.hour+j*sp)*HOUR); }
  const res=out.map(o=>((o-tz*HOUR)%WEEK+WEEK)%WEEK).sort((x,y)=>x-y); R.deps.set(L.id,res); return res; }
function cycleOf(L){ const r=routeOf(L), tu=TURN[MODELS[L.model].kind]; return r.out.T+tu+r.ret.T+tu; }
/* trains nécessaires = nombre maximal de rotations simultanées sur la semaine (calendrier périodique) */
function trainsNeeded(L){ const r=routeOf(L); if(!r) return 0; const C=cycleOf(L), D=depsOf(L), n=Math.ceil(C/WEEK)+1; let best=0;
  for(const p of D){ let c=0; for(const o of D) for(let k=-n;k<=0;k++){ const s=o+k*WEEK; if(s<=p&&p<s+C) c++; } best=Math.max(best,c); } return best; }
/* trajets (aller ou retour) d'une ligne qui touchent [t0,t1] */
function tripsOf(L,t0,t1){ const r=routeOf(L); if(!r) return []; const tu=TURN[MODELS[L.model].kind], span=r.out.T+tu+r.ret.T, out=[];
  for(let ws=weekStart(t0-span); ws<=t1; ws+=WEEK) for(const o of depsOf(L)){ const d=ws+o; if(d>t1) break; if(d+span<t0) continue;
    const rd=d+r.out.T+tu; if(d<=t1&&d+r.out.T>=t0) out.push({L,leg:r.out,dir:'out',dep:d,arr:d+r.out.T});
    if(rd<=t1&&rd+r.ret.T>=t0) out.push({L,leg:r.ret,dir:'ret',dep:rd,arr:rd+r.ret.T}); }
  return out; }

/* ---------- demande ---------- */
// voyageurs par jour (deux sens) entre deux villes : modèle gravitaire
function paxDemand(a,b,km){ const A=STATIONS[a],B=STATIONS[b], K=(regionOf(a).K+regionOf(b).K)/2;
  return 650*K*Math.pow(A.p,0.8)*Math.pow(B.p,0.8)/Math.pow(Math.max(0.5,km/100),1.1); }
const SEAPORTS=()=>Object.values(STATIONS).filter(s=>(s.port||0)>=0.6);
// fret (tonnes / semaine) de a vers b : minerais → ports maritimes, importations ports → grandes villes
function frtDemand(a,b){ const A=STATIONS[a],B=STATIONS[b]; let t=0;
  const share=(src,dst)=>{ let tot=0; for(const p of SEAPORTS()) tot+=p.port/Math.pow(gcKm(src,p.code)/1000+0.2,2); return dst.port/Math.pow(gcKm(src,dst.code)/1000+0.2,2)/tot; };
  if(A.mine&&(B.port||0)>=0.6) t+=A.mine*1000*share(a,B)*S.metal;
  if((A.port||0)>=0.6&&B.p>=0.5){ let tot=0; for(const p of SEAPORTS()) if(p.code!==b) tot+=p.port/Math.pow(gcKm(b,p.code)/100+0.3,2);
    t+=B.p*2500*(A.port/Math.pow(gcKm(b,a)/100+0.3,2))/tot; }
  return t; }
const fare=(a,km)=>{ const R=regionOf(a); return R.base+R.fare*km; };

/* ---------- économie : calculée une fois pour toutes les lignes (cache), utilisée à chaque arrivée ---------- */
function computeEcon(){
  const R=RT, lines=allLines().filter(L=>routeOf(L)), od={}, use={};
  // 1) attractivité de chaque ligne sur chaque couple de gares (fréquence × vitesse)
  for(const L of lines){ const m=MODELS[L.model], leg=routeOf(L).out, st=leg.stops;
    for(const e of leg.edges) use[e.id]=(use[e.id]||0)+L.weekly/7;
    const pairs=m.kind==='frt'?[[0,st.length-1]]:[]; if(m.kind==='pax') for(let i=0;i<st.length;i++) for(let j=i+1;j<st.length;j++) pairs.push([i,j]);
    for(const [i,j] of pairs){ const h=(st[j].arr-st[i].dep)/HOUR, k=m.kind+'|'+[st[i].code,st[j].code].sort().join('|');
      (od[k]=od[k]||{tot:0}); const sc=L.weekly*Math.pow((st[j].km-st[i].km)/Math.max(0.2,h),1.2)*(m.comfort&&h>6?1.4:1)*Math.pow(L.tariff,-1.5); od[k][L.id]=sc; od[k].tot+=sc; } }
  R.edgeUse=use;
  // 2) chargement par trajet, sens aller et retour
  for(const L of lines){ const m=MODELS[L.model], r=routeOf(L), res={};
    for(const dir of ['out','ret']){ const leg=r[dir], st=leg.stops; let rev=0, load=0;
      if(m.kind==='pax'){ const n=st.length, pax=[], segLoad=new Array(n).fill(0);
        for(let i=0;i<n;i++) for(let j=i+1;j<n;j++){ const km=st[j].km-st[i].km, h=(st[j].arr-st[i].dep)/HOUR, k='pax|'+[st[i].code,st[j].code].sort().join('|'), o=od[k];
          const share=o?o[L.id]/o.tot:1, sp=Math.min(2.5,Math.max(0.3,Math.pow(km/Math.max(0.2,h)/50,0.6)));
          let d=paxDemand(st[i].code,st[j].code,km)*sp*Math.pow(L.tariff,-1.4)*(m.comfort&&h>6?1.3:1)*share*7/L.weekly/2;
          pax.push([i,j,d,km]); for(let s=i;s<j;s++) segLoad[s]+=d; }
        const mx=Math.max(1,...segLoad), sc=Math.min(1,m.seats/mx);
        for(const [i,,d,km] of pax){ const p=d*sc; load+=p; rev+=p*fare(st[i].code,km)*L.tariff*(m.comfort&&km>500?m.comfort:1); }
        res[dir]={load:Math.round(load),rev,lf:Math.min(1,mx/m.seats)};
      } else { const a=st[0].code,b=st[st.length-1].code, k='frt|'+[a,b].sort().join('|'), o=od[k], share=o?o[L.id]/o.tot:1;
        const sp=Math.min(1.6,Math.max(0.5,Math.pow(leg.km/(leg.T/HOUR)/35,0.7))), t=Math.min(m.cap,frtDemand(a,b)*sp*share/L.weekly+m.cap*0.08);   // + 8 % de lots divers
        rev=t*leg.km*regionOf(a).frt*Math.pow(L.tariff,-0.5)*L.tariff; res[dir]={load:Math.round(t),rev,lf:t/m.cap}; }
      // coûts par trajet : énergie, équipe, péages (voies qui ne vous appartiennent pas)
      const R0=regionOf(L.a), energy=leg.km*m.epk*R0.energy, crew=leg.T/HOUR*m.crew*35*R0.wage;
      let toll=0; for(const e of leg.edges) if(!e.own) toll+=e.km*(e.ferry?12:regionOf(e.a).toll*(m.kind==='frt'?1.6:1))*(e.ren&&!L.rival?0.5:1);
      // saturation : au-delà de la capacité de la voie, les retards font fuir les clients
      let sat=1; for(const e of leg.edges){ const cap=(e.tr>=2?90:16)*(e.ferry?0.15:1), u=(use[e.id]||0)/cap; if(u>1) sat=Math.min(sat,1/Math.sqrt(u)); }
      res[dir].rev*=sat; res[dir].load=Math.round(res[dir].load*sat); res[dir].sat=sat; res[dir].cost=energy+crew+toll; res[dir].toll=toll; }
    R.econ.set(L.id,res); }
}
const econOf=L=>rt().econ.get(L.id);
/* bénéfice estimé par semaine (avant frais fixes) */
function weeklyEst(L){ const e=econOf(L); if(!e) return null; return {rev:(e.out.rev+e.ret.rev)*L.weekly,cost:(e.out.cost+e.ret.cost)*L.weekly,load:(e.out.load+e.ret.load)*L.weekly}; }

/* ---------- actions du joueur ---------- */
function stationName(c){ return STATIONS[c]?STATIONS[c].n:c; }
function hubCost(c){ const R=regionOf(c); return Math.round((R.hub+STATIONS[c].p*R.hub*0.4)*1e6/1e5)*1e5; }
function buyHub(c){ if(S.hubs.includes(c)) return 'Déjà un hub.'; const k=hubCost(c); if(S.cash<k) return 'Trésorerie insuffisante ('+fmtMoney(k)+').';
  S.cash-=k; S.hubs.push(c); addNews('🏢 Nouveau hub à '+stationName(c)+' ('+fmtMoney(k)+').','me'); return null; }
function previewLine(a,b,model,stopMode,weekly,hour,tariff){
  const L={id:'P',a,b,model,stopMode,weekly,hour,tariff}; const m=MODELS[model];
  if(!S.hubs.includes(a)) return {err:'La ligne doit partir d\'un de vos hubs.'};
  if(a===b) return {err:'Choisissez deux gares différentes.'};
  const R=rt(), r=buildRoute(a,b,m,m.kind==='frt'?'direct':stopMode);
  if(!r) return {err:'Aucun itinéraire compatible : écartement ('+GAUGES[m.g]+')'+(m.el?', voie électrifiée':'')+' ou voie hors service.'};
  // calcul « à blanc » : on insère la ligne dans les caches, puis on les jette
  R.routes.set('P',r); S.lines.push(L); R.deps.delete('P'); computeEcon(); const est=weeklyEst(L), need=trainsNeeded(L), e=econOf(L);
  S.lines.pop(); R.routes.delete('P'); R.deps.delete('P'); R.econ.delete('P'); computeEcon();
  return {r,est,need,cost:need*m.price*1e6,e};
}
function openLine(a,b,model,stopMode,weekly,hour,tariff){
  const p=previewLine(a,b,model,stopMode,weekly,hour,tariff); if(p.err) return p.err;
  if(S.cash<p.cost) return 'Trésorerie insuffisante : il faut '+fmtMoney(p.cost)+' pour '+p.need+' rame(s). Empruntez dans Finances.';
  S.cash-=p.cost; const id=S.seq++;
  S.lines.push({id,a,b,model,stopMode,weekly,hour,tariff,trains:p.need,color:LINE_COLORS[S.lines.length%LINE_COLORS.length],opened:S.time,paid:p.cost});
  addNews('🚆 Ligne ouverte : '+stationName(a)+' ⇄ '+stationName(b)+' ('+MODELS[model].name+', '+weekly+' A/R par semaine).','me');
  rtDirty(); return null;
}
function lineById(id){ return S.lines.find(l=>l.id===id); }
function setLine(id,patch){ const L=lineById(id); if(!L) return 'Ligne introuvable.'; const old=Object.assign({},L); Object.assign(L,patch); rtDirty();
  const m=MODELS[L.model]; if(!routeOf(L)){ Object.assign(L,old); rtDirty(); return 'Itinéraire impossible.'; }
  const need=trainsNeeded(L);
  if(need>L.trains){ const k=(need-L.trains)*m.price*1e6; if(S.cash<k){ Object.assign(L,old); rtDirty(); return 'Il faut '+(need-L.trains)+' rame(s) de plus ('+fmtMoney(k)+').'; } S.cash-=k; L.paid=(L.paid||0)+k; }
  else if(need<L.trains){ const k=(L.trains-need)*m.price*1e6*0.6; S.cash+=k; }
  L.trains=need; return null; }
function closeLine(id){ const L=lineById(id); if(!L) return; const k=(L.trains||0)*MODELS[L.model].price*1e6*0.6; S.cash+=k;
  S.lines=S.lines.filter(l=>l.id!==id); addNews('🔚 Ligne fermée : '+stationName(L.a)+' ⇄ '+stationName(L.b)+'. Rames revendues '+fmtMoney(k)+'.','me'); rtDirty(); }

/* ---------- chantiers : construire, réhabiliter, moderniser, électrifier, doubler, changer l'écartement ---------- */
const VT={1:{C:90,M:70,S:160},2:{C:120,M:90,S:300}};
function workQuote(kind,e,opt){ const R=regionOf(e.a); let cost=0, weeks=1;
  if(kind==='renov1'){ cost=e.km*R.renov*(e.hs?2:1); weeks=2+e.km/40; }
  if(kind==='renov2'){ cost=e.km*(e.g==='S'?R.build*0.7:R.renov*3); weeks=4+e.km/25; }
  if(kind==='elec'){ cost=e.km*R.elec; weeks=2+e.km/30; }
  if(kind==='dbl'){ cost=e.km*R.dbl; weeks=3+e.km/20; }
  if(kind==='gauge'){ cost=e.km*R.renov*2.5; weeks=3+e.km/30; }
  return {cost:cost*1e6,weeks:Math.ceil(weeks)}; }
function canWork(kind,e){ if(e.ferry) return 'Bac : pas de travaux possibles.';
  if(S.works.some(w=>w.edge===e.id)) return 'Chantier déjà en cours sur ce tronçon.';
  if(kind==='renov1'&&!e.hs&&e.v>=VT[1][e.g]) return 'Déjà en bon état.';
  if(kind==='renov2'&&(e.hs||e.v>=VT[2][e.g])) return e.hs?'Réhabilitez d\'abord.':'Déjà modernisé.';
  if(kind==='elec'&&e.el) return 'Déjà électrifié.'; if(kind==='dbl'&&e.tr>=2) return 'Déjà à double voie.'; return null; }
function startWork(kind,edgeId,opt){ const e=NET.byId[edgeId]; if(!e) return 'Tronçon introuvable.'; const c=canWork(kind,e); if(c) return c;
  const q=workQuote(kind,e,opt); if(S.cash<q.cost) return 'Trésorerie insuffisante : '+fmtMoney(q.cost)+'.';
  S.cash-=q.cost; S.works.push({id:S.seq++,kind,edge:edgeId,opt:opt||null,done:S.time+q.weeks*WEEK,cost:q.cost,start:S.time});
  addNews('🏗️ Chantier lancé : '+WORK_NAMES[kind]+' '+stationName(e.a)+' – '+stationName(e.b)+' ('+fmtMoney(q.cost)+', '+q.weeks+' sem.).','me'); return null; }
const WORK_NAMES={renov1:'remise en état',renov2:'modernisation',elec:'électrification',dbl:'doublement de voie',gauge:'changement d\'écartement',build:'construction'};
function buildQuote(a,b,g,v,el,dbl,kmOverride,extra){ if(a===b) return {err:'Deux gares différentes.'};
  const d=gcKm(a,b); if(d>800&&!kmOverride) return {err:'Trop long ('+Math.round(d)+' km) : ajoutez des gares intermédiaires (800 km max par tronçon).'};
  const km=kmOverride||Math.round(d*TRACK_FACTOR), R=regionOf(a);
  const vf=v>=250?2.2:v>=160?1.4:v>=120?1.15:1; let cost=km*R.build*vf+(el?km*R.elec:0)+(dbl?km*R.dbl:0)+(extra||0);
  return {km,cost:cost*1e6,weeks:Math.ceil(4+km/(dbl?8:10))}; }
function startBuild(a,b,g,v,el,dbl,kmOverride,extra,label){ const q=buildQuote(a,b,g,v,el,dbl,kmOverride,extra); if(q.err) return q.err;
  if(g!=='S'&&v>160) return 'La grande vitesse demande la voie normale (S).';
  if(S.cash<q.cost) return 'Trésorerie insuffisante : '+fmtMoney(q.cost)+'.';
  S.cash-=q.cost; S.works.push({id:S.seq++,kind:'build',spec:{a,b,g,v,el:!!el,tr:dbl?2:1,km:q.km,name:label||''},done:S.time+q.weeks*WEEK,cost:q.cost,start:S.time});
  addNews('🏗️ Construction lancée : '+stationName(a)+' – '+stationName(b)+' ('+q.km+' km, '+fmtMoney(q.cost)+', '+q.weeks+' sem.).','me'); return null; }
function finishWork(w){ const mods=S.net.mods;
  if(w.kind==='build'){ const id='B'+w.id; S.net.built.push(Object.assign({id},w.spec)); addNews('✅ Voie inaugurée : '+stationName(w.spec.a)+' – '+stationName(w.spec.b)+' ('+w.spec.km+' km). Ouvrez-y une ligne !','me'); }
  else { const e=NET.byId[w.edge]; if(!e) return; const isB=w.edge[0]==='B', tgt=isB?S.net.built.find(b=>b.id===w.edge):(mods[w.edge]=mods[w.edge]||{});
    tgt.ren=true; if(w.kind==='renov1'){ tgt.hs=false; tgt.v=Math.max(e.hs?0:e.v,VT[1][e.g]); }
    if(w.kind==='renov2'){ tgt.v=VT[2][e.g]; }
    if(w.kind==='elec') tgt.el=true; if(w.kind==='dbl') tgt.tr=2; if(w.kind==='gauge') tgt.g=w.opt||'C';
    addNews('✅ Fin de chantier : '+WORK_NAMES[w.kind]+' '+stationName(e.a)+' – '+stationName(e.b)+'.','me'); }
  rtDirty(); checkLines(); }
function checkLines(){ for(const L of S.lines){ if(!routeOf(L)&&!L.suspended){ L.suspended=true; addNews('⚠️ Ligne '+stationName(L.a)+' ⇄ '+stationName(L.b)+' suspendue : plus d\'itinéraire compatible.','bad'); } else if(routeOf(L)&&L.suspended){ L.suspended=false; } } }

/* ---------- finances ---------- */
function creditLimit(){ return 250e6+S.lines.reduce((s,L)=>s+(L.trains||0)*MODELS[L.model].price*1e6*0.5,0)+S.net.built.reduce((s,b)=>s+b.km*0.5e6,0); }
function borrow(x){ if(S.debt+x>creditLimit()) return 'Plafond d\'emprunt atteint ('+fmtMoney(creditLimit())+').'; S.debt+=x; S.cash+=x; addNews('🏦 Emprunt de '+fmtMoney(x)+' (taux 6 %/an).','me'); return null; }
function repay(x){ x=Math.min(x,S.debt,Math.max(0,S.cash)); if(x<=0) return 'Rien à rembourser.'; S.debt-=x; S.cash-=x; return null; }
function fixedCostsWeek(){ let c=0; for(const L of S.lines) c+=(L.trains||0)*MODELS[L.model].price*1e6*0.001;
  for(const h of S.hubs) c+=regionOf(h).hub*1e6*0.003; for(const b of S.net.built) c+=b.km*400*regionOf(b.a).wage*4;
  c+=S.debt*0.06/52; return c; }

/* ---------- horloge ---------- */
function settle(tr){ const e=econOf(tr.L); if(!e) return; const x=e[tr.dir]; let rev=x.rev, cost=x.cost;
  // incidents en cours sur l'itinéraire (pluies, éboulements…)
  for(const inc of S.incidents) if(inc.until>tr.arr&&tr.leg.edges.some(ed=>ed.id===inc.edge)){ rev*=0.6; break; }
  rev*=0.9+0.2*((tr.dep/HOUR*7919)%1);                                            // ± 10 % selon le jour (déterministe)
  if(tr.L.rival) return;
  S.cash+=rev-cost; const w=S.wk; w.rev+=rev; w.cost+=cost; w.trips++; if(MODELS[tr.L.model].kind==='pax') w.pax+=x.load; else w.tons+=x.load;
  const l=w.lines[tr.L.id]=w.lines[tr.L.id]||{rev:0,cost:0,load:0,trips:0}; l.rev+=rev; l.cost+=cost; l.load+=x.load; l.trips++; }
function advance(dt){ const target=S.time+dt; rt();
  while(S.time<target){ const t0=S.time, step=Math.min(5*MIN,target-t0); S.time+=step;
    const ws=weekStart(S.time); if(ws>t0&&ws<=S.time) weeklyTick();
    for(const w of S.works.slice()) if(w.done<=S.time){ S.works=S.works.filter(x=>x!==w); finishWork(w); }
    for(const L of S.lines){ if(L.suspended) continue; for(const tr of tripsOf(L,t0+1,S.time)) if(tr.arr>t0&&tr.arr<=S.time) settle(tr); } } }
function catchUp(){ let lr=S.lastReal; try{ const b=+localStorage.getItem(LR_KEY); if(b&&b>lr) lr=b; }catch(e){}
  const real=Math.min(Date.now()-lr,30*DAY); S.lastReal=Date.now(); if(real<5000||S.paused) return 0;
  const before=S.cash; advance(real); addNews('⏱️ Pendant votre absence ('+fmtDur(real)+' de jeu) : '+(S.cash>=before?'+':'')+fmtMoney(S.cash-before)+'.','info'); return real; }

/* ---------- tick hebdomadaire : frais fixes, IA des concurrents, événements ---------- */
let rng=Math.random;
function weeklyTick(){
  const fixed=fixedCostsWeek(); S.cash-=fixed; S.wk.fixed=fixed;
  // péages perçus : concurrents qui empruntent vos voies
  let toll=0; for(const L of RT.rivals){ const r=routeOf(L); if(!r) continue; for(const e of r.out.edges) if(e.own) toll+=e.km*regionOf(e.a).toll*2*L.weekly; }
  S.cash+=toll; S.wk.tolls=toll;
  S.hist.push({t:weekStart(S.time)-WEEK,rev:S.wk.rev,cost:S.wk.cost+fixed,pax:S.wk.pax,tons:S.wk.tons,cash:S.cash,tolls:toll,lines:S.wk.lines});
  if(S.hist.length>52) S.hist.shift();
  const res=S.wk.rev+toll-S.wk.cost-fixed; S.wk=newWeek();
  if(S.cash<-30e6) addNews('🚨 Trésorerie négative ('+fmtMoney(S.cash)+') : empruntez, fermez des lignes ou augmentez les tarifs.','bad');
  S.incidents=S.incidents.filter(i=>i.until>S.time);
  worldEvents(res); rtDirty(); }
function pick(a){ return a[Math.floor(rng()*a.length)]; }
function worldEvents(res){
  const month=new Date(S.time).getUTCMonth(), rainy=month>=9||month<=4;      // saison des pluies au Congo : octobre → mai
  // incidents sur les voies dégradées d'Afrique centrale
  if(rng()<(rainy?0.35:0.12)){ const cand=NET.edges.filter(e=>!e.hs&&!e.ferry&&e.v<=60&&['CD','CG'].includes(STATIONS[e.a].c)); if(cand.length){ const e=pick(cand), wk=1+Math.floor(rng()*3);
    S.incidents.push({edge:e.id,until:S.time+wk*WEEK}); addNews((rainy?'🌧️ Fortes pluies':'🪨 Éboulement')+' entre '+stationName(e.a)+' et '+stationName(e.b)+' : circulation ralentie '+wk+' semaine(s). Une remise en état réduirait ces risques.','bad'); } }
  // pannes de vos rames (plus fréquentes sur voie dégradée)
  for(const L of S.lines){ const r=routeOf(L); if(!r||L.suspended) continue; const bad=r.out.edges.some(e=>e.v<40);
    if(rng()<0.03*(L.trains||1)*(bad?2:1)){ const k=MODELS[L.model].price*1e6*0.01; S.cash-=k; addNews('🔧 Panne d\'une rame sur '+stationName(L.a)+' ⇄ '+stationName(L.b)+' : réparation '+fmtMoney(k)+'.','bad'); } }
  // cours des métaux (cuivre, cobalt) : influence le fret minier
  if(rng()<0.25){ const old=S.metal; S.metal=Math.max(0.6,Math.min(1.5,S.metal+(1-S.metal)*0.2+(rng()-0.5)*0.16)); const d=S.metal-old; addNews((d>0?'📈':'📉')+' Cours du cuivre et du cobalt '+(d>0?'en hausse':'en baisse')+' : demande de fret minier ×'+S.metal.toFixed(2)+'.','info'); }
  // concurrents : renforcent leurs lignes, rénovent, et un challenger peut vous attaquer
  const rl=RT.rivals; if(rl.length&&rng()<0.3){ const L=pick(rl), i=+L.id.slice(1), cur=S.rivals.mul[i]||1, up=rng()<(cur>1?0.35:0.65); S.rivals.mul[i]=Math.max(0.5,Math.min(2,cur*(up?1.25:0.8)));
    addNews((up?'📣 ':'✂️ ')+L.op+(up?' augmente':' réduit')+' ses fréquences '+stationName(L.a)+' ⇄ '+stationName(L.b)+'.','rival'); }
  if(rng()<0.06){ const cand=NET.edges.filter(e=>!e.hs&&!e.ferry&&!e.own&&e.v<VT[1][e.g]&&['CD','CG','AO','ZM','TZ'].includes(STATIONS[e.a].c)); if(cand.length){ const e=pick(cand);
    (S.net.mods[e.id]=S.net.mods[e.id]||{}).v=Math.min(VT[1][e.g],e.v+20); addNews('🛠️ '+(e.op||'Le gestionnaire')+' remet en état la voie '+stationName(e.a)+' – '+stationName(e.b)+' (+20 km/h).','rival'); } }
  if(S.lines.length&&res>0&&rng()<0.015&&S.rivals.extra.length<8&&S.time-S.start>26*WEEK){ const best=S.lines.filter(L=>!S.rivals.extra.some(r=>r[1]===L.a&&r[2]===L.b)).sort(()=>0).sort((x,y)=>((S.hist.at(-1)?.lines[y.id]?.rev)||0)-((S.hist.at(-1)?.lines[x.id]?.rev)||0))[0]; if(!best) return;
    const name=pick(['Kongo Express','Fleuve Rail','Katanga Freight Co.','Équateur Rail','Grands Lacs Express']);
    S.rivals.extra.push([name,best.a,best.b,best.model,Math.max(2,Math.round(best.weekly/2)),(best.hour+3)%24]);
    addNews('⚔️ Challenger : '+name+' (compagnie fictive) lance une ligne concurrente '+stationName(best.a)+' ⇄ '+stationName(best.b)+' !','rival'); }
}

/* ---------- formats ---------- */
function fmtMoney(v){ const a=Math.abs(v), s=v<0?'-':''; return s+(a>=1e9?(a/1e9).toFixed(2)+' Md$':a>=1e6?(a/1e6).toFixed(1)+' M$':a>=1e3?Math.round(a/1e3)+' k$':Math.round(a)+' $'); }
function fmtDur(ms){ const h=ms/HOUR; return h<1?Math.round(ms/MIN)+' min':h<48?(Math.floor(h)+' h '+String(Math.round((h%1)*60)).padStart(2,'0')):Math.round(h/24)+' j'; }
const DAYS=['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
function fmtLocal(t,tz){ const d=new Date(t+tz*HOUR); return DAYS[d.getUTCDay()]+' '+String(d.getUTCDate()).padStart(2,'0')+'/'+String(d.getUTCMonth()+1).padStart(2,'0')+'/'+d.getUTCFullYear()+' '+d.toISOString().slice(11,16); }
const fmtHM=(t,tz)=>{ const d=new Date(t+tz*HOUR); return d.toISOString().slice(11,16); };
