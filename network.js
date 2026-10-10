/* =========================================================
   Réseau : graphe des voies, plus court chemin compatible (écartement, électrification),
   itinéraires avec arrêts, profils de vitesse (accélération → palier → freinage).
   ========================================================= */
'use strict';
const MIN=60e3, HOUR=3600e3, DAY=24*HOUR, WEEK=7*DAY;
const rad=x=>x*Math.PI/180;
function gcKm(a,b){ const A=STATIONS[a],B=STATIONS[b],dl=rad(B.lo-A.lo),dp=rad(B.la-A.la),h=Math.sin(dp/2)**2+Math.cos(rad(A.la))*Math.cos(rad(B.la))*Math.sin(dl/2)**2; return 2*6371*Math.asin(Math.sqrt(h)); }
const regionOf=code=>REGIONS[COUNTRIES[STATIONS[code].c][1]];
const tzOf=code=>STATIONS[code].tz!=null?STATIONS[code].tz:COUNTRIES[STATIONS[code].c][2];
const TRACK_FACTOR=1.18;                        // une voie serpente : ~18 % plus longue que la ligne droite

/* ---------- construction du graphe à partir des données + modifications du joueur (S.net) ---------- */
let NET={edges:[],byId:{},adj:{},ver:0};
function buildNet(){
  const edges=[], mods={}, built=[];   // réseau réel (pas de construction dans cette version)
  const RG=typeof RAILGEO!=='undefined'?RAILGEO:{}, RK=typeof RAILKM!=='undefined'?RAILKM:{};
  TRACKS.forEach((t,i)=>{ const o=t[6], k=t[0]+'|'+t[1]; edges.push({id:'T'+i,a:t[0],b:t[1],v:t[2],g:t[3],el:t[4],tr:t[5],hs:!!o.hs,ferry:!!o.ferry,op:o.op||'',own:false,
    km:o.km||RK[k]||Math.round(gcKm(t[0],t[1])*TRACK_FACTOR),geo:RG[k]||null}); });
  for(const b of built) edges.push(Object.assign({hs:false,ferry:false,op:'Vous',own:true},b));
  for(const e of edges){ const m=mods[e.id]; if(m) Object.assign(e,m); edgeGeo(e); }
  const adj={}; for(const c in STATIONS) adj[c]=[];
  for(const e of edges){ adj[e.a].push(e); adj[e.b].push(e); }
  NET={edges,byId:Object.fromEntries(edges.map(e=>[e.id,e])),adj,ver:NET.ver+1};
}
const other=(e,c)=>e.a===c?e.b:e.a;
/* géométrie d'un tronçon : tracé réel si connu, sinon ligne droite ; fractions cumulées le long du tracé */
function edgeGeo(e){ const A=STATIONS[e.a],B=STATIONS[e.b]; const g=e.geo||[[A.lo,A.la],[B.lo,B.la]]; const cf=[0]; let t=0;
  for(let i=1;i<g.length;i++){ const dx=(g[i][0]-g[i-1][0])*Math.cos(rad((g[i][1]+g[i-1][1])/2)), dy=g[i][1]-g[i-1][1]; t+=Math.hypot(dx,dy); cf.push(t); }
  e.line=g; e.cf=cf.map(x=>t?x/t:0); }
/* point à la fraction f d'un tronçon, dans le sens from→… ; renvoie [lon,lat,cap en degrés] */
function edgePoint(e,from,f){ if(e.a!==from) f=1-f; const g=e.line, cf=e.cf; let i=1; while(i<g.length-1&&cf[i]<f) i++;
  const span=cf[i]-cf[i-1]||1, u=Math.max(0,Math.min(1,(f-cf[i-1])/span)), p=g[i-1], q=g[i];
  let br=Math.atan2((q[0]-p[0])*Math.cos(rad(p[1])),q[1]-p[1])*180/Math.PI; if(e.a!==from) br+=180;
  return [p[0]+(q[0]-p[0])*u,p[1]+(q[1]-p[1])*u,br]; }
/* tracé complet d'une étape (pour dessiner une ligne) : [[lon,lat],…] */
function legLine(leg){ const out=[]; for(let k=0;k<leg.edges.length;k++){ const e=leg.edges[k]; let g=e.line.slice(); if(e.a!==leg.nodes[k]) g.reverse(); if(out.length) g.shift(); out.push(...g); } return out; }
function edgeOK(e,m){ if(e.hs||e.v<=0) return false; if(e.ferry) return true; if(m&&e.g!==m.g) return false; if(m&&m.el&&!e.el) return false; return true; }
const effV=(e,m)=>e.ferry?e.v:Math.min(e.v,m?m.vmax:e.v);

/* plus court chemin en TEMPS (Dijkstra) ; renvoie {nodes,edges} ou null */
function shortestPath(from,to,m){
  if(from===to) return null;
  const dist={[from]:0}, prev={}, done=new Set(), Q=[[0,from]];
  while(Q.length){
    let bi=0; for(let i=1;i<Q.length;i++) if(Q[i][0]<Q[bi][0]) bi=i;
    const [d,u]=Q.splice(bi,1)[0]; if(done.has(u)) continue; done.add(u); if(u===to) break;
    for(const e of NET.adj[u]){ if(!edgeOK(e,m)) continue; const v=other(e,u), nd=d+e.km/effV(e,m)+(e.ferry?2:0);
      if(dist[v]==null||nd<dist[v]){ dist[v]=nd; prev[v]=[u,e]; Q.push([nd,v]); } }
  }
  if(dist[to]==null) return null;
  const nodes=[to], edges=[]; let c=to; while(c!==from){ const [p,e]=prev[c]; edges.unshift(e); nodes.unshift(p); c=p; }
  return {nodes,edges};
}
/* gares atteignables depuis une gare avec un modèle donné */
function reachable(from,m){ const seen=new Set([from]), st=[from]; while(st.length){ const u=st.pop(); for(const e of NET.adj[u]){ if(!edgeOK(e,m)) continue; const v=other(e,u); if(!seen.has(v)){ seen.add(v); st.push(v); } } } seen.delete(from); return seen; }

/* ---------- profil de vitesse (cache) : renvoie {T (ms), s(t) en km} ---------- */
const _prof=new Map();
function profile(km,vkmh,acc){
  const key=Math.round(km*10)+'|'+Math.round(vkmh)+'|'+acc; let P=_prof.get(key); if(P) return P;
  const v=vkmh/3.6, a=acc, d=km*1000, ta=v/a, da=v*v/(2*a); let T,fn;
  if(2*da>=d){ const tp=Math.sqrt(d/a); T=2*tp; fn=t=>t<tp?0.5*a*t*t:d-0.5*a*(2*tp-t)**2; }          // trop court pour atteindre la vitesse de palier
  else { const tc=(d-2*da)/v; T=2*ta+tc; fn=t=>t<ta?0.5*a*t*t:t<ta+tc?da+v*(t-ta):d-0.5*a*(T-t)**2; }
  P={T:T*1000,s:t=>fn(Math.max(0,Math.min(T,t/1000)))/1000}; _prof.set(key,P); return P;
}

/* ---------- itinéraire d'une ligne : arrêts, marches, temps d'arrêt ---------- */
// stopMode : 'omni' (toutes les gares), 'express' (villes ≥ 300 000 hab., nœuds et terminus), 'direct' (terminus seulement)
function dwellAt(code,m){ const p=STATIONS[code].p; if(m.kind==='frt') return 20*MIN; return p>=5?10*MIN:p>=1?6*MIN:3*MIN; }
function buildLeg(nodes,edges,m,stopMode,stopSet){
  const n=nodes.length, cum=[0]; for(let i=0;i<edges.length;i++) cum.push(cum[i]+edges[i].km);
  const isStop=nodes.map((c,i)=>{ if(i===0||i===n-1) return true;
    if(edges[i-1].ferry||edges[i].ferry) return true;                               // embarquement sur le bac
    if(m.kind==='frt'||stopMode==='direct') return false;
    if(stopSet) return stopSet.has(c);                                                  // arrêts choisis par le joueur
    if(stopMode==='omni') return true;
    return STATIONS[c].p>=0.3||NET.adj[c].length>2; });
  const segs=[], stopTimes=[]; let t=0, i0=0;
  for(let i=1;i<n;i++){ if(!isStop[i]) continue;
    let tc=0, km=cum[i]-cum[i0]; for(let k=i0;k<i;k++) tc+=edges[k].km/effV(edges[k],m);
    const vavg=km/tc, ferry=edges[i0].ferry, P=profile(km,vavg,ferry?0.1:m.acc);
    stopTimes.push({i:i0,dep:t}); segs.push({type:'run',t0:t,t1:t+P.T,i0,i1:i,km0:cum[i0],km,P}); t+=P.T;
    if(i<n-1){ const dw=(edges[i-1].ferry||edges[i].ferry)?60*MIN:dwellAt(nodes[i],m); stopTimes.push({i,arr:t}); segs.push({type:'dwell',t0:t,t1:t+dw,i}); t+=dw; stopTimes[stopTimes.length-1].dep=t; }
    i0=i; }
  stopTimes.push({i:n-1,arr:t});
  // horaires par arrêt : {code, km, arr, dep}
  const stops=[]; for(const s of stopTimes){ const last=stops[stops.length-1]; if(last&&last.idx===s.i){ if(s.arr!=null) last.arr=s.arr; if(s.dep!=null) last.dep=s.dep; } else stops.push({idx:s.i,code:nodes[s.i],km:cum[s.i],arr:s.arr!=null?s.arr:0,dep:s.dep!=null?s.dep:s.arr}); }
  return {nodes,edges,cum,segs,stops,T:t,km:cum[n-1]};
}
function buildRoute(a,b,m,stopMode,stopSet){
  const p=shortestPath(a,b,m); if(!p) return null;
  const out=buildLeg(p.nodes,p.edges,m,stopMode,stopSet), ret=buildLeg(p.nodes.slice().reverse(),p.edges.slice().reverse(),m,stopMode,stopSet);
  return {out,ret,km:out.km};
}
/* position sur une étape à l'instant dt (ms depuis le départ) → {ll:[lat,lon], kmh, at?} */
function legPos(leg,dt){
  let seg=leg.segs[leg.segs.length-1]; for(const s of leg.segs) if(dt<s.t1){ seg=s; break; }
  if(seg.type==='dwell'){ const c=leg.nodes[seg.i]; return {ll:[STATIONS[c].la,STATIONS[c].lo],lnglat:[STATIONS[c].lo,STATIONS[c].la],bearing:0,kmh:0,at:c}; }
  const t=Math.max(0,dt-seg.t0), s=seg.km0+seg.P.s(t), kmh=Math.round((seg.P.s(t+2000)-seg.P.s(t))*1800);
  let k=seg.i0; while(k<seg.i1-1&&leg.cum[k+1]<s) k++;
  const f=Math.max(0,Math.min(1,(s-leg.cum[k])/(leg.cum[k+1]-leg.cum[k]||1))), p=edgePoint(leg.edges[k],leg.nodes[k],f);
  return {ll:[p[1],p[0]],lnglat:[p[0],p[1]],bearing:p[2],kmh,next:leg.nodes[seg.i1]};
}
