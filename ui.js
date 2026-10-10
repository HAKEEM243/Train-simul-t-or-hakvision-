/* =========================================================
   Interface : carte Leaflet (fond vectoriel hors-ligne), panneaux, actions (data-act).
   ========================================================= */
'use strict';
const $=s=>document.querySelector(s), esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const APP_V='1.0.0';
const UI={rank:'AF',tab:'home',sel:null,msg:'',open:{a:null,b:null,model:'PAX_C',stopMode:'express',weekly:7,hour:6,tariff:1},
  build:{a:'KIN',b:'BZV',g:'C',v:100,el:false,dbl:false},showRivals:true,netVer:-1,timetable:null};
let map,layers={},trainMk=new Map(),rivalMk=new Map();

/* ---------- listes de gares (Congo d'abord) ---------- */
const COUNTRY_ORDER=['CD','CG','AO','ZM','TZ','ZW','BW','ZA','KE','UG','RW','BI','GA','CM','ET','DJ','NG','MA','EG','FR','GB','BE','NL','DE','CH','IT','ES','JP','CN','US'];
function stationOptions(sel,filter){ let h=''; for(const c of COUNTRY_ORDER){ const list=Object.values(STATIONS).filter(s=>s.c===c&&(!filter||filter(s.code))).sort((x,y)=>x.n.localeCompare(y.n));
  if(list.length) h+=`<optgroup label="${esc(COUNTRIES[c][0])}">`+list.map(s=>`<option value="${s.code}" ${s.code===sel?'selected':''}>${esc(s.n)}</option>`).join('')+'</optgroup>'; } return h; }
function modelOptions(sel){ return Object.entries(GAUGES).map(([g,gn])=>`<optgroup label="${esc(gn)}">`+Object.entries(MODELS).filter(([,m])=>m.g===g).map(([k,m])=>
  `<option value="${k}" ${k===sel?'selected':''}>${m.kind==='frt'?'📦':'🚆'} ${esc(m.name)}${m.el?' ⚡':''} · ${m.kind==='frt'?m.cap+' t':m.seats+' pl.'} · ${m.vmax} km/h · ${m.price} M$</option>`).join('')+'</optgroup>').join(''); }
const pct=x=>Math.round(x*100)+' %';
const lineName=L=>stationName(L.a)+' ⇄ '+stationName(L.b);
function msg(t){ UI.msg=t||''; }
/* confirmation dans la page (les boîtes confirm() sont bloquées dans certains lecteurs) : 1er clic arme le bouton, 2e clic valide */
function armed(b,label){ if(b.dataset.armed==='1') return true; b.dataset.armed='1'; b.dataset.old=b.textContent; b.textContent=label||'Cliquez encore pour confirmer';
  setTimeout(()=>{ if(b.isConnected){ b.dataset.armed=''; b.textContent=b.dataset.old; } },4000); return false; }

/* ---------- en-tête ---------- */
const SPEEDS=[[0,'⏸'],[1,'×1'],[60,'×60'],[600,'×600'],[3600,'1 h/s'],[86400,'1 j/s']];
function renderTop(){
  $('#clock').textContent=fmtLocal(S.time,1)+' (Kinshasa)';
  $('#cash').innerHTML=`<b class="${S.cash<0?'neg':''}">${fmtMoney(S.cash)}</b>`+(S.debt?` <span class="mut">dette ${fmtMoney(S.debt)}</span>`:'');
  $('#speeds').innerHTML=SPEEDS.map(([v,l])=>`<button class="${(v===0?S.paused:!S.paused&&S.speed===v)?'on':''}" data-act="speed" data-v="${v}">${l}</button>`).join('');
}

/* ---------- panneau ---------- */
const TABS=[['home','🏠','Accueil'],['open','➕','Ouvrir'],['lines','🚆','Lignes'],['works','🏗️','Chantiers'],['fin','🏦','Finances'],['news','📰','Actus']];
function renderPanel(){
  rt(); const p=$('#panel');
  let h=`<nav class="tabs">${TABS.map(([k,i,l])=>`<button class="${UI.tab===k&&!UI.sel?'on':''}" data-act="tab" data-v="${k}">${i}<span> ${l}</span></button>`).join('')}</nav>`;
  if(UI.msg) h+=`<div class="msg">${esc(UI.msg)} <button class="x" data-act="msgx">✕</button></div>`;
  if(UI.sel) h+=(UI.sel.type==='st'?viewStation(UI.sel.code):UI.sel.type==='edge'?viewEdge(UI.sel.id):viewLine(UI.sel.id));
  else h+=({home:viewHome,open:viewOpen,lines:viewLines,works:viewWorks,fin:viewFin,news:viewNews}[UI.tab])();
  p.innerHTML=h; if(UI.tab==='open'&&!UI.sel) updatePreview();
}
function card(title,body,cls){ return `<div class="card ${cls||''}">${title?`<h4>${title}</h4>`:''}${body}</div>`; }
function back(){ return `<button data-act="back">← Retour</button>`; }

function viewHome(){
  const last=S.hist[S.hist.length-1], wk=S.wk;
  let h=card('🏢 '+esc(S.name),`<div class="kpis">
     <div><span>Trésorerie</span><b class="${S.cash<0?'neg':''}">${fmtMoney(S.cash)}</b></div>
     <div><span>Semaine en cours</span><b class="${wk.rev-wk.cost<0?'neg':'pos'}">${fmtMoney(wk.rev-wk.cost)}</b></div>
     <div><span>Semaine passée</span><b class="${last&&last.rev+last.tolls-last.cost<0?'neg':'pos'}">${last?fmtMoney(last.rev+last.tolls-last.cost):'—'}</b></div>
     <div><span>Voyageurs / sem.</span><b>${last?last.pax.toLocaleString('fr'):'—'}</b></div>
     <div><span>Fret / sem.</span><b>${last?Math.round(last.tons).toLocaleString('fr')+' t':'—'}</b></div>
     <div><span>Rames</span><b>${S.lines.reduce((s,L)=>s+(L.trains||0),0)}</b></div></div>`);
  h+=card('📍 Vos hubs',S.hubs.map(c=>`<button class="chip" data-act="st" data-v="${c}">⭐ ${esc(stationName(c))}</button>`).join(' ')+
    `<div class="mut">Une ligne part toujours d'un hub. Cliquez une gare sur la carte pour y établir un nouveau hub.</div>`);
  if(!S.lines.length) h+=card('🚀 Pour bien démarrer',`<ol class="tips">
    <li><b>Kinshasa ⇄ Matadi</b> : la ligne historique (voyageurs) — onglet ➕ Ouvrir.</li>
    <li><b>Fret Matadi → Kinshasa</b> : les importations du port vers la capitale (établissez un hub à Matadi).</li>
    <li>Au Katanga, le <b>cuivre et le cobalt de Kolwezi</b> vers <b>Lobito</b> (Angola) ou <b>Dar es Salaam</b> rapportent gros : il faut un hub à Kolwezi.</li>
    <li>Le réseau congolais est <b>usé</b> (25 à 50 km/h) : rénovez les tronçons (cliquez une voie) et construisez les chaînons manquants (🏗️).</li>
    <li>Accélérez le temps en haut à droite. Le jeu continue (et vous rapporte) même fermé.</li></ol>`);
  h+=card('🚆 Vos lignes',S.lines.length?S.lines.map(lineRow).join(''):'<div class="mut">Aucune ligne pour l\'instant.</div>');
  h+=card('📰 Dernières nouvelles',newsList(5)+`<button data-act="tab" data-v="news">Tout voir</button>`);
  h+=card('💾 Partie',`<div class="row"><button data-act="export">Exporter</button><button data-act="import">Importer</button><button data-act="newgame" class="danger">Nouvelle partie</button></div>
    <label class="mut"><input type="checkbox" data-act="rivals" ${UI.showRivals?'checked':''}> Afficher les trains concurrents</label>
    <div class="mut">Version ${APP_V} · sauvegarde automatique dans ce navigateur.</div>`);
  return h;
}
function lineRow(L){ const e=econOf(L), last=S.hist.at(-1), lw=last&&last.lines[L.id], m=MODELS[L.model];
  return `<div class="lrow" data-act="line" data-v="${L.id}"><i style="background:${L.color}"></i><div><b>${esc(lineName(L))}</b>${L.suspended?' <span class="neg">suspendue</span>':''}
   <div class="mut">${m.kind==='frt'?'📦':'🚆'} ${esc(m.name)} · ${L.weekly} A/R/sem · ${L.trains} rame(s)${e?` · remplissage ${pct(e.out.lf)}`:''}${lw?` · sem. passée <span class="${lw.rev-lw.cost<0?'neg':'pos'}">${fmtMoney(lw.rev-lw.cost)}</span>`:''}</div></div></div>`; }
function newsList(n){ return `<ul class="news">${S.news.slice(0,n).map(x=>`<li class="${x.kind}"><span class="mut">${fmtLocal(x.t,1).slice(0,15)}</span> ${esc(x.txt)}</li>`).join('')}</ul>`; }

/* --- ouvrir une ligne --- */
function viewOpen(){ const f=UI.open; if(!S.hubs.includes(f.a)) f.a=S.hubs[0];
  const m=MODELS[f.model], reach=reachable(f.a,m); if(!reach.has(f.b)) f.b=[...reach].sort((x,y)=>STATIONS[y].p-STATIONS[x].p)[0]||null;
  return card('➕ Ouvrir une ligne',`
   <label>Départ (vos hubs)<select data-f="open.a">${S.hubs.map(c=>`<option value="${c}" ${c===f.a?'selected':''}>${esc(stationName(c))}</option>`).join('')}</select></label>
   <label>Matériel<select data-f="open.model">${modelOptions(f.model)}</select></label>
   <label>Arrivée (${reach.size} gare(s) accessible(s) avec ce matériel)<select data-f="open.b">${reach.size?stationOptions(f.b,c=>reach.has(c)):'<option>— aucune —</option>'}</select></label>
   ${m.kind==='pax'?`<label>Arrêts<select data-f="open.stopMode">${[['omni','Omnibus : toutes les gares'],['express','Express : villes importantes'],['direct','Direct : sans arrêt']].map(([k,l])=>`<option value="${k}" ${k===f.stopMode?'selected':''}>${l}</option>`).join('')}</select></label>`:''}
   <div class="row2"><label>Allers-retours / semaine<select data-f="open.weekly">${[1,2,3,4,5,7,14,21,28,42,56,70].map(n=>`<option value="${n}" ${n===f.weekly?'selected':''}>${n}${n>=7?' ('+n/7+'/jour)':''}</option>`).join('')}</select></label>
   <label>1er départ (heure locale)<select data-f="open.hour">${Array.from({length:24},(_,i)=>`<option value="${i}" ${i===f.hour?'selected':''}>${String(i).padStart(2,'0')}:00</option>`).join('')}</select></label></div>
   <label>Tarif : <b>${pct(f.tariff)}</b> du prix de référence<input type="range" min="0.5" max="2" step="0.05" value="${f.tariff}" data-f="open.tariff"></label>
   <div id="preview" class="preview"></div>`)+
   `<div class="mut">Astuce : seuls les itinéraires compatibles avec l'<b>écartement</b> du matériel (voie du Cap au Congo) et, pour un train électrique, des voies <b>électrifiées</b> sont proposés.</div>`;
}
function updatePreview(){ const f=UI.open, el=$('#preview'); if(!el) return; if(!f.b){ el.innerHTML='<div class="neg">Aucune destination accessible depuis ce hub avec ce matériel.</div>'; return; }
  const p=previewLine(f.a,f.b,f.model,f.stopMode,f.weekly,f.hour,f.tariff); if(p.err){ el.innerHTML=`<div class="neg">${esc(p.err)}</div>`; return; }
  const m=MODELS[f.model], prof=p.est.rev-p.est.cost, st=p.r.out.stops, fx=fixedTrain(m)*p.need;
  el.innerHTML=`<div><b>${Math.round(p.r.km)} km</b> · durée <b>${fmtDur(p.r.out.T)}</b> · vitesse moyenne ${Math.round(p.r.km/(p.r.out.T/HOUR))} km/h · ${st.length} arrêts</div>
   <div class="mut">${st.map(s=>esc(stationName(s.code))).join(' → ')}</div>
   <div>Rames nécessaires : <b>${p.need}</b> → achat <b>${fmtMoney(p.cost)}</b> ${S.cash<p.cost?'<span class="neg">(trésorerie insuffisante)</span>':''}</div>
   <div>Chargement estimé : aller <b>${p.e.out.load}</b> / retour <b>${p.e.ret.load}</b> ${m.kind==='frt'?'t':'voyageurs'} par train (remplissage ${pct(p.e.out.lf)})${p.e.out.sat<1?' · <span class="neg">voie saturée</span>':''}</div>
   <div>Par semaine : recettes <b>${fmtMoney(p.est.rev)}</b> − exploitation ${fmtMoney(p.est.cost)} − entretien ${fmtMoney(fx)} = <b class="${prof-fx<0?'neg':'pos'}">${fmtMoney(prof-fx)}</b></div>
   ${prof-fx>0?`<div class="mut">Retour sur investissement ≈ ${Math.ceil(p.cost/(prof-fx))} semaines.</div>`:''}
   <button class="primary" data-act="openline">Ouvrir la ligne</button>`;
}
const fixedTrain=m=>m.price*1e6*0.001;

/* --- lignes --- */
function viewLines(){ return card('🚆 Vos lignes ('+S.lines.length+')',S.lines.length?S.lines.map(lineRow).join(''):'<div class="mut">Aucune ligne : onglet ➕ Ouvrir.</div>')+
  card('🏆 Classement des opérateurs (simulation)',rankTable()); }
function rankTable(){ const ops={}; for(const L of allLines()){ const e=econOf(L); if(!e) continue; if(UI.rank==='AF'&&!['AF'].includes(COUNTRIES[STATIONS[L.a].c][1])) continue; const k=L.rival?L.op:S.name, m=MODELS[L.model];
    const o=ops[k]=ops[k]||{pax:0,t:0,lines:0,me:!L.rival}; o.lines++; if(m.kind==='pax') o.pax+=(e.out.load+e.ret.load)*L.weekly; else o.t+=(e.out.load+e.ret.load)*L.weekly; }
  const rows=Object.entries(ops).sort((x,y)=>(y[1].pax+y[1].t)-(x[1].pax+x[1].t));
  return `<div class="row"><button class="${UI.rank==='AF'?'on':''}" data-act="rank" data-v="AF">Afrique subsaharienne</button><button class="${UI.rank==='W'?'on':''}" data-act="rank" data-v="W">Monde</button></div><table><tr><th>#</th><th>Opérateur</th><th>Voyageurs/sem</th><th>Fret t/sem</th></tr>${rows.map(([k,o],i)=>`<tr class="${o.me?'me':''}"><td>${i+1}</td><td>${esc(k)}</td><td>${Math.round(o.pax).toLocaleString('fr')}</td><td>${Math.round(o.t).toLocaleString('fr')}</td></tr>`).join('')}</table>
   <div class="mut">Opérateurs réels, mais leurs horaires et volumes sont simulés par le jeu (pas de vraies statistiques).</div>`; }
function viewLine(id){ const L=lineById(id); if(!L){ UI.sel=null; return viewHome(); } const m=MODELS[L.model], r=routeOf(L), e=econOf(L), w=weeklyEst(L);
  if(!r) return back()+card(esc(lineName(L)),'<div class="neg">Ligne suspendue : plus d\'itinéraire compatible.</div><button class="danger" data-act="close" data-v="'+L.id+'">Fermer la ligne</button>');
  const tz=tzOf(L.a), D=depsOf(L), ws=weekStart(S.time), fx=fixedTrain(m)*L.trains;
  const hist=S.hist.slice(-8).map(hh=>hh.lines[L.id]).filter(Boolean);
  let h=back()+card(`<i class="dot" style="background:${L.color}"></i> ${esc(lineName(L))}`,`
   <div class="mut">${m.kind==='frt'?'📦':'🚆'} ${esc(m.name)} · ${GAUGES[m.g]} · ${Math.round(r.km)} km · ${fmtDur(r.out.T)} · ${L.trains} rame(s)</div>
   <div class="row2"><label>A/R par semaine<select data-lf="weekly" data-id="${L.id}">${[1,2,3,4,5,7,14,21,28,42,56,70].map(n=>`<option value="${n}" ${n===L.weekly?'selected':''}>${n}</option>`).join('')}</select></label>
   <label>1er départ<select data-lf="hour" data-id="${L.id}">${Array.from({length:24},(_,i)=>`<option value="${i}" ${i===L.hour?'selected':''}>${String(i).padStart(2,'0')}:00</option>`).join('')}</select></label></div>
   ${m.kind==='pax'?`<label>Arrêts<select data-lf="stopMode" data-id="${L.id}">${[['omni','Omnibus'],['express','Express'],['direct','Direct']].map(([k,l])=>`<option value="${k}" ${k===L.stopMode?'selected':''}>${l}</option>`).join('')}</select></label>`:''}
   <label>Tarif ${pct(L.tariff)}<input type="range" min="0.5" max="2" step="0.05" value="${L.tariff}" data-lf="tariff" data-id="${L.id}"></label>
   <table><tr><th></th><th>Aller</th><th>Retour</th></tr>
    <tr><td>${m.kind==='frt'?'Tonnes':'Voyageurs'} / train</td><td>${e.out.load}</td><td>${e.ret.load}</td></tr>
    <tr><td>Remplissage</td><td>${pct(e.out.lf)}</td><td>${pct(e.ret.lf)}</td></tr>
    <tr><td>Recette / trajet</td><td>${fmtMoney(e.out.rev)}</td><td>${fmtMoney(e.ret.rev)}</td></tr>
    <tr><td>Coût / trajet</td><td>${fmtMoney(e.out.cost)}</td><td>${fmtMoney(e.ret.cost)}</td></tr></table>
   <div>Estimation / semaine : <b class="${w.rev-w.cost-fx<0?'neg':'pos'}">${fmtMoney(w.rev-w.cost-fx)}</b> <span class="mut">(dont péages ${fmtMoney((e.out.toll+e.ret.toll)*L.weekly)}, entretien ${fmtMoney(fx)})</span></div>
   ${hist.length?`<div class="mut">Résultats réels des dernières semaines : ${hist.map(x=>`<span class="${x.rev-x.cost<0?'neg':'pos'}">${fmtMoney(x.rev-x.cost)}</span>`).join(' · ')}</div>`:''}
   ${e.out.lf>0.97?'<div class="tip">💡 Trains pleins : augmentez la fréquence ou le tarif.</div>':''}${e.out.lf<0.35?'<div class="tip">💡 Trains peu remplis : baissez le tarif, la fréquence, ou prenez du matériel plus petit.</div>':''}`);
  h+=card('🗓️ Fiche horaire (heure locale, 1er départ de la semaine)',timetable(r.out,ws+D[0],'Aller')+timetable(r.ret,ws+D[0]+r.out.T+TURN[m.kind],'Retour')+
    `<div class="mut">Départs de ${esc(stationName(L.a))} : ${D.slice(0,14).map(o=>fmtLocal(ws+o,tz).slice(0,3)+' '+fmtHM(ws+o,tz)).join(' · ')}${D.length>14?' …':''}</div>`);
  h+=`<div class="row"><button data-act="zoomline" data-v="${L.id}">🔎 Voir sur la carte</button><button class="danger" data-act="close" data-v="${L.id}">Fermer la ligne (rames revendues 60 %)</button></div>`;
  return h; }
function timetable(leg,dep,title){ return `<details ${title==='Aller'?'open':''}><summary>${title} : ${esc(stationName(leg.nodes[0]))} → ${esc(stationName(leg.nodes.at(-1)))}</summary><table class="tt">${leg.stops.map(s=>{ const tz=tzOf(s.code);
  return `<tr><td>${esc(stationName(s.code))}</td><td>${Math.round(s.km)} km</td><td>${s.arr?fmtHM(dep+s.arr,tz):''}</td><td>${s.dep!=null&&s!==leg.stops.at(-1)?fmtHM(dep+s.dep,tz):''}</td></tr>`; }).join('')}</table></details>`; }

/* --- gare --- */
function viewStation(c){ const s=STATIONS[c], R=regionOf(c), tz=tzOf(c), hub=S.hubs.includes(c);
  const serving=allLines().filter(L=>{ const r=routeOf(L); return r&&r.out.stops.some(x=>x.code===c); });
  const edges=NET.adj[c];
  let h=back()+card(`${hub?'⭐ ':''}${esc(s.n)} <span class="mut">${esc(COUNTRIES[s.c][0])}</span>`,`
   <div>${s.p>=1?s.p+' M':Math.round(s.p*1000)+' k'} habitants · heure locale ${fmtHM(S.time,tz)} (UTC${tz>=0?'+':''}${tz})</div>
   ${s.mine?`<div>⛏️ Production : <b>${s.mine} kt/semaine</b> de ${esc(s.res)}</div>`:''}${s.port?`<div>⚓ ${s.port>=0.6?'Port maritime':'Port fluvial/lacustre'}</div>`:''}
   <div class="mut">${edges.length?edges.length+' voie(s) : '+edges.map(e=>`<a href="#" data-act="edge" data-v="${e.id}">${esc(stationName(other(e,c)))}${e.hs?' (hors service)':' '+e.v+' km/h'}</a>`).join(', '):'Aucune voie ferrée : construisez-en une (🏗️ Chantiers).'}</div>
   <div class="row">${hub?`<button class="primary" data-act="openfrom" data-v="${c}">➕ Ouvrir une ligne d'ici</button>`:`<button class="primary" data-act="hub" data-v="${c}">⭐ Établir un hub (${fmtMoney(hubCost(c))})</button>`}
   <button data-act="buildfrom" data-v="${c}">🏗️ Construire une voie d'ici</button></div>`);
  h+=card('Lignes qui desservent cette gare',serving.length?serving.map(L=>`<div class="${L.rival?'mut':''}">${L.rival?esc(L.op):'<b>Vous</b>'} : ${esc(lineName(L))} · ${esc(MODELS[L.model].name)} · ${L.weekly} A/R/sem</div>`).join(''):'<div class="mut">Aucune.</div>');
  return h; }
/* --- tronçon de voie --- */
function viewEdge(id){ const e=NET.byId[id]; if(!e){ UI.sel=null; return viewHome(); }
  const use=(RT.edgeUse[id]||0), cap=(e.tr>=2?90:16)*(e.ferry?0.15:1), work=S.works.find(w=>w.edge===id), inc=S.incidents.find(i=>i.edge===id);
  const btn=(k,label,opt)=>{ const c=canWork(k,e); if(c) return ''; const q=workQuote(k,e,opt); return `<button data-act="work" data-k="${k}" data-v="${id}" ${opt?`data-o="${opt}"`:''}>${label} · ${fmtMoney(q.cost)} · ${q.weeks} sem.</button>`; };
  let h=back()+card(`🛤️ ${esc(stationName(e.a))} – ${esc(stationName(e.b))}`,`
   <table><tr><td>Longueur</td><td>${e.km} km</td></tr><tr><td>État</td><td>${e.hs?'<span class="neg">Hors service</span>':e.ferry?'Bac ferroviaire':e.v<40?'<span class="neg">Très dégradé</span>':e.v<80?'Moyen':'Bon'}</td></tr>
   <tr><td>Vitesse limite</td><td>${e.hs?'—':e.v+' km/h'}</td></tr><tr><td>Écartement</td><td>${e.ferry?'tous (bac)':GAUGES[e.g]}</td></tr>
   <tr><td>Électrifiée</td><td>${e.el?'oui ⚡':'non'}</td></tr><tr><td>Voies</td><td>${e.tr===2?'double':'unique'}</td></tr>
   <tr><td>Gestionnaire</td><td>${e.own?'<b>Vous</b> (pas de péage)':esc(e.op||'—')+' (péage '+(e.ferry?12:regionOf(e.a).toll)+' $/train-km'+(e.ren?', −50 % pour vous : vous l\'avez rénovée':'')+')'}</td></tr>
   <tr><td>Trafic</td><td>${use.toFixed(1)} trains/jour/sens · capacité ≈ ${Math.round(cap)} ${use>cap?'<span class="neg">SATURÉ</span>':''}</td></tr></table>
   ${inc?`<div class="neg">⚠️ Incident en cours jusqu'au ${fmtLocal(inc.until,1).slice(0,15)}</div>`:''}
   ${work?`<div>🏗️ Chantier en cours : ${WORK_NAMES[work.kind]} — fin ${fmtLocal(work.done,1).slice(0,15)}</div>`:`<div class="col">
    ${btn('renov1',e.hs?'♻️ Réhabiliter la ligne':'🔧 Remettre en état ('+VT[1][e.g]+' km/h)')}${btn('renov2','🚄 Moderniser ('+VT[2][e.g]+' km/h)')}${btn('elec','⚡ Électrifier')}${btn('dbl','🛤️ Doubler la voie')}
    ${e.g==='M'?btn('gauge','↔️ Passer en voie du Cap (1067)','C'):''}${e.g==='C'&&!e.ferry?btn('gauge','↔️ Passer en voie normale (1435)','S'):''}</div>`}
   <div class="mut">Les travaux profitent à tous les trains, y compris ceux des concurrents ; en échange, vous payez demi-péage sur les voies que vous rénovez. Changer l'écartement coupe les lignes qui utilisent l'ancien.</div>`);
  return h; }

/* --- chantiers --- */
function viewWorks(){ const b=UI.build, q=buildQuote(b.a,b.b,b.g,b.v,b.el,b.dbl);
  let h=card('🏗️ Chantiers en cours',S.works.length?S.works.map(w=>{ const p=Math.min(1,(S.time-w.start)/(w.done-w.start)), e=w.spec||NET.byId[w.edge];
    return `<div>${WORK_NAMES[w.kind]} : ${esc(stationName(e.a))} – ${esc(stationName(e.b))}<div class="bar"><i style="width:${p*100}%"></i></div><span class="mut">fin ${fmtLocal(w.done,1).slice(0,15)}</span></div>`; }).join(''):'<div class="mut">Aucun chantier.</div>');
  h+=card('🌍 Grands projets',PROJECTS.map((p,i)=>{ const tot=projQuote(p); return `<details><summary><b>${esc(p.name)}</b> · ${tot.km} km · ${fmtMoney(tot.cost)}</summary><div class="mut">${esc(p.note)}</div>
     <div class="mut">${p.path.map(stationName).map(esc).join(' – ')} · ${GAUGES[p.g]} · ${p.v} km/h · ${tot.weeks} semaines</div><button class="primary" data-act="project" data-v="${i}">Lancer le projet</button></details>`; }).join(''));
  h+=card('✏️ Construire une voie',`
   <div class="row2"><label>De<select data-f="build.a">${stationOptions(b.a)}</select></label><label>À<select data-f="build.b">${stationOptions(b.b)}</select></label></div>
   <div class="row2"><label>Écartement<select data-f="build.g">${Object.entries(GAUGES).map(([k,l])=>`<option value="${k}" ${k===b.g?'selected':''}>${l}</option>`).join('')}</select></label>
   <label>Vitesse<select data-f="build.v">${[80,100,120,160,200,250,300,350].map(v=>`<option value="${v}" ${v===b.v?'selected':''}>${v} km/h</option>`).join('')}</select></label></div>
   <label><input type="checkbox" data-f="build.el" ${b.el?'checked':''}> Électrifiée</label> <label><input type="checkbox" data-f="build.dbl" ${b.dbl?'checked':''}> Double voie</label>
   <div class="preview">${q.err?`<span class="neg">${esc(q.err)}</span>`:`${q.km} km · <b>${fmtMoney(q.cost)}</b> · ${q.weeks} semaines de travaux <button class="primary" data-act="build">Construire</button>`}</div>
   <div class="mut">Coût au km selon la région (Afrique ≈ ${REGIONS.AF.build} M$/km, Europe ≈ ${REGIONS.EU.build} M$/km). Vous ne payez pas de péage sur vos voies et les concurrents qui les empruntent vous en versent.</div>`);
  return h; }
function projQuote(p){ let km=0,cost=0,weeks=0; for(let i=0;i<p.path.length-1;i++){ const q=buildQuote(p.path[i],p.path[i+1],p.g,p.v,false,false,p.km,i===0?p.extra:0); if(q.err) continue; km+=q.km; cost+=q.cost; weeks=Math.max(weeks,q.weeks); } return {km,cost,weeks}; }

/* --- finances --- */
function viewFin(){ const H=S.hist.slice(-12).reverse(), mx=Math.max(1,...H.map(x=>Math.abs(x.rev+x.tolls-x.cost)));
  return card('🏦 Finances',`<div class="kpis"><div><span>Trésorerie</span><b>${fmtMoney(S.cash)}</b></div><div><span>Dette</span><b>${fmtMoney(S.debt)}</b></div>
    <div><span>Plafond d'emprunt</span><b>${fmtMoney(creditLimit())}</b></div><div><span>Frais fixes / sem.</span><b>${fmtMoney(fixedCostsWeek())}</b></div></div>
   <div class="row"><button data-act="borrow" data-v="50000000">Emprunter 50 M$</button><button data-act="borrow" data-v="200000000">Emprunter 200 M$</button><button data-act="repay" data-v="50000000">Rembourser 50 M$</button></div>
   <div class="mut">Intérêts : 6 %/an, prélevés chaque semaine. Frais fixes = entretien des rames, des hubs et de vos voies.</div>`)+
  card('📊 Résultats hebdomadaires',H.length?`<table class="fin"><tr><th>Semaine du</th><th>Recettes</th><th>Coûts</th><th>Résultat</th><th></th></tr>${H.map(x=>{ const r=x.rev+x.tolls-x.cost;
    return `<tr><td>${fmtLocal(x.t,1).slice(4,10)}</td><td>${fmtMoney(x.rev+x.tolls)}</td><td>${fmtMoney(x.cost)}</td><td class="${r<0?'neg':'pos'}">${fmtMoney(r)}</td><td class="barc"><i class="${r<0?'n':'p'}" style="width:${Math.abs(r)/mx*100}%"></i></td></tr>`; }).join('')}</table>`:'<div class="mut">Le premier bilan arrive lundi.</div>'); }
function viewNews(){ return card('📰 Actualités',newsList(80)+'<div class="mut">Événements du monde (pluies, pannes, concurrents, challengers) : générés par la simulation, fictifs.</div>'); }

/* ---------- actions ---------- */
const ACTIONS={
  tab:b=>{ UI.tab=b.dataset.v; UI.sel=null; },
  back:()=>{ UI.sel=null; },
  msgx:()=>msg(''),
  speed:b=>{ const v=+b.dataset.v; if(v===0) S.paused=!S.paused; else { S.speed=v; S.paused=false; } renderTop(); return 'noPanel'; },
  st:b=>{ UI.sel={type:'st',code:b.dataset.v}; focusStation(b.dataset.v); },
  edge:b=>{ UI.sel={type:'edge',id:b.dataset.v}; },
  line:b=>{ UI.sel={type:'line',id:+b.dataset.v}; },
  hub:b=>{ msg(buyHub(b.dataset.v)||'⭐ Hub établi à '+stationName(b.dataset.v)+' !'); drawNet(); },
  openfrom:b=>{ UI.open.a=b.dataset.v; UI.tab='open'; UI.sel=null; },
  buildfrom:b=>{ UI.build.a=b.dataset.v; UI.tab='works'; UI.sel=null; },
  openline:()=>{ const f=UI.open, e=openLine(f.a,f.b,f.model,f.stopMode,f.weekly,f.hour,f.tariff); msg(e||'✅ Ligne ouverte : '+stationName(f.a)+' ⇄ '+stationName(f.b)); if(!e){ UI.tab='lines'; drawLines(); } },
  close:b=>{ if(!armed(b,'Confirmer la fermeture ?')) return 'noPanel'; closeLine(+b.dataset.v); UI.sel=null; drawLines(); },
  zoomline:b=>{ const L=lineById(+b.dataset.v), r=L&&routeOf(L); if(r) map.fitBounds(r.out.nodes.map(c=>[STATIONS[c].la,STATIONS[c].lo]),{padding:[30,30]}); return 'noPanel'; },
  work:b=>{ const e=startWork(b.dataset.k,b.dataset.v,b.dataset.o); msg(e||'🏗️ Chantier lancé.'); drawNet(); },
  build:()=>{ const b=UI.build, e=startBuild(b.a,b.b,b.g,b.v,b.el,b.dbl); msg(e||'🏗️ Construction lancée.'); drawNet(); },
  project:b=>{ const p=PROJECTS[+b.dataset.v], tot=projQuote(p); if(S.cash<tot.cost){ msg('Trésorerie insuffisante : '+fmtMoney(tot.cost)+' (empruntez dans Finances).'); return; }
    for(let i=0;i<p.path.length-1;i++) startBuild(p.path[i],p.path[i+1],p.g,p.v,false,false,p.km,i===0?p.extra:0,p.name); msg('🏗️ Projet lancé : '+p.name); drawNet(); },
  rank:b=>{ UI.rank=b.dataset.v; },
  borrow:b=>{ msg(borrow(+b.dataset.v)||'🏦 Emprunt accordé.'); },
  repay:b=>{ msg(repay(+b.dataset.v)||'Remboursé.'); },
  rivals:b=>{ UI.showRivals=b.checked; for(const m of rivalMk.values()) map.removeLayer(m); rivalMk.clear(); return 'noPanel'; },
  export:()=>{ const blob=new Blob([JSON.stringify(S)],{type:'application/json'}), a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='congo-rail-'+new Date(S.time).toISOString().slice(0,10)+'.json'; a.click(); return 'noPanel'; },
  import:()=>{ const i=document.createElement('input'); i.type='file'; i.accept='.json,application/json'; i.onchange=()=>{ const r=new FileReader(); r.onload=()=>{ try{ const o=JSON.parse(r.result); if(o.v!==SAVE_V) throw 0; S=o; S.lastReal=Date.now(); rtDirty(); save(); msg('Partie importée.'); fullRedraw(); }catch(e){ msg('Fichier invalide.'); renderPanel(); } }; r.readAsText(i.files[0]); }; i.click(); return 'noPanel'; },
  newgame:()=>{ showNewGame(true); return 'noPanel'; }
};
function onAct(e){ const b=e.target.closest('[data-act]'); if(!b) return; if(b.tagName==='A') e.preventDefault(); if(b.type==='checkbox'&&e.type==='click') { /* traité au change */ }
  const r=ACTIONS[b.dataset.act]&&ACTIONS[b.dataset.act](b); if(r!=='noPanel'){ renderPanel(); renderTop(); } if(UI.sel) $('#panel').scrollTop=0; }
function onField(e){ const t=e.target;
  if(t.dataset.f){ const [o,k]=t.dataset.f.split('.'), obj=UI[o]; let v=t.type==='checkbox'?t.checked:t.value; if(['weekly','hour','v'].includes(k)||k==='tariff') v=+v; obj[k]=v;
    if(o==='open'&&k==='tariff'){ t.previousElementSibling&&(t.closest('label').querySelector('b').textContent=pct(v)); updatePreview(); return; }
    renderPanel(); return; }
  if(t.dataset.lf){ const id=+t.dataset.id, k=t.dataset.lf; let v=t.value; if(k!=='stopMode') v=+v; const err=setLine(id,{[k]:v}); msg(err||''); renderPanel(); renderTop(); drawLines(); }
}

/* ---------- carte ---------- */
function initMap(){
  map=L.map('map',{preferCanvas:true,zoomControl:true,worldCopyJump:true,minZoom:2,maxZoom:12,renderer:L.canvas({tolerance:6})}).setView([-6,22],5);
  map.attributionControl.addAttribution('Fond : Natural Earth');
  const base=L.layerGroup().addTo(map), hi=new Set(['COD','COG']);
  for(const [code,,polys] of WORLD.countries) for(const poly of polys) L.polygon(poly.map(r=>r.map(p=>[p[1],p[0]])),{color:'#2b3d63',weight:hi.has(code)?1.6:0.7,fillColor:hi.has(code)?'#1d3b2f':'#16213a',fillOpacity:1,interactive:false}).addTo(base);
  for(const polys of WORLD.lakes) for(const poly of polys) L.polygon(poly.map(r=>r.map(p=>[p[1],p[0]])),{stroke:false,fillColor:'#0e3a5c',fillOpacity:1,interactive:false}).addTo(base);
  for(const [,line] of WORLD.rivers) L.polyline(line.map(p=>[p[1],p[0]]),{color:'#1f5f8b',weight:1.4,opacity:.9,interactive:false}).addTo(base);
  layers.net=L.layerGroup().addTo(map); layers.lines=L.layerGroup().addTo(map); layers.st=L.layerGroup().addTo(map); layers.trains=L.layerGroup().addTo(map);
  map.on('zoomend',drawStations);
  layers.tiles=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap',opacity:.35});
  L.control.layers(null,{'Carte OpenStreetMap (en ligne)':layers.tiles},{position:'topright'}).addTo(map);
}
function edgeStyle(e){ if(e.ferry) return {color:'#4cc9f0',weight:2,dashArray:'4 6'}; if(e.hs) return {color:'#7a5560',weight:2,dashArray:'3 5'};
  const w=e.tr>=2?3.5:2.2, c=e.own?'#ffd60a':e.v>=250?'#c77dff':e.v>=120?'#cfd8e8':e.v>=80?'#9fb3d1':e.v>=45?'#e9a03b':'#e8603c'; return {color:c,weight:w,opacity:.95}; }
function drawNet(){ rt(); UI.netVer=NET.ver; layers.net.clearLayers();
  for(const e of NET.edges){ const A=STATIONS[e.a],B=STATIONS[e.b]; const pl=L.polyline([[A.la,A.lo],[B.la,B.lo]],edgeStyle(e)).addTo(layers.net);
    pl.on('click',ev=>{ L.DomEvent.stopPropagation(ev); UI.sel={type:'edge',id:e.id}; renderPanel(); }); pl.bindTooltip(`${stationName(e.a)} – ${stationName(e.b)} · ${e.hs?'hors service':e.v+' km/h'}`,{sticky:true}); }
  for(const w of S.works){ const s=w.spec||NET.byId[w.edge]; if(!s) continue; L.polyline([[STATIONS[s.a].la,STATIONS[s.a].lo],[STATIONS[s.b].la,STATIONS[s.b].lo]],{color:'#ffd60a',weight:3,dashArray:'2 6',interactive:false}).addTo(layers.net); }
  drawStations(); drawLines(); }
function drawStations(){ if(!layers.st) return; layers.st.clearLayers(); const z=map.getZoom();
  for(const s of Object.values(STATIONS)){ const hub=S.hubs.includes(s.code), congo=s.c==='CD'||s.c==='CG', r=Math.max(3,Math.min(9,3+Math.sqrt(s.p)*1.6));
    const mk=L.circleMarker([s.la,s.lo],{radius:hub?r+2:r,color:hub?'#ffd60a':'#fff',weight:hub?3:1,fillColor:s.mine?'#f4a261':s.port>=0.6?'#4cc9f0':congo?'#e63946':'#8d99ae',fillOpacity:1}).addTo(layers.st);
    mk.on('click',ev=>{ L.DomEvent.stopPropagation(ev); UI.sel={type:'st',code:s.code}; renderPanel(); });
    const show=hub||(z>=7)||(z>=5&&(s.p>=0.25||congo&&s.p>=0.1))||(z>=3&&s.p>=3);
    mk.bindTooltip((hub?'⭐ ':'')+s.n,{permanent:show,direction:'right',offset:[6,0],className:'lbl'+(congo?' cg':'')}); } }
function drawLines(){ if(!layers.lines) return; layers.lines.clearLayers();
  for(const L0 of S.lines){ const r=routeOf(L0); if(!r) continue; L.polyline(r.out.nodes.map(c=>[STATIONS[c].la,STATIONS[c].lo]),{color:L0.color,weight:7,opacity:.35,interactive:false}).addTo(layers.lines); } }
function focusStation(c){ const s=STATIONS[c]; map.setView([s.la,s.lo],Math.max(map.getZoom(),6)); }
function updateTrains(){ const t=S.time, seen=new Set(), bounds=map.getBounds().pad(0.2);
  for(const L0 of S.lines){ if(L0.suspended) continue; const m=MODELS[L0.model];
    for(const tr of tripsOf(L0,t,t)){ if(t<tr.dep||t>tr.arr) continue; const k=L0.id+'|'+tr.dir+'|'+tr.dep, p=legPos(tr.leg,t-tr.dep); seen.add(k); let mk=trainMk.get(k);
      if(!mk){ mk=L.marker(p.ll,{icon:L.divIcon({className:'',html:`<div class="trn" style="border-color:${L0.color}">${m.kind==='frt'?'🚂':'🚆'}</div>`,iconSize:[22,22],iconAnchor:[11,11]}),zIndexOffset:1000}).addTo(layers.trains); trainMk.set(k,mk);
        mk.on('click',()=>{ UI.sel={type:'line',id:L0.id}; renderPanel(); }); }
      mk.setLatLng(p.ll); mk.bindTooltip(`${esc(lineName(L0))}<br>${p.at?'⏸ à quai : '+esc(stationName(p.at)):p.kmh+' km/h → '+esc(stationName(p.next))}<br>${MODELS[L0.model].kind==='frt'?'📦':'👥'} ${econOf(L0)[tr.dir].load}`); } }
  for(const [k,mk] of trainMk) if(!seen.has(k)){ layers.trains.removeLayer(mk); trainMk.delete(k); }
  const rs=new Set(); if(UI.showRivals) for(const L0 of RT.rivals){ for(const tr of tripsOf(L0,t,t)){ if(t<tr.dep||t>tr.arr) continue; const p=legPos(tr.leg,t-tr.dep); if(!bounds.contains(p.ll)) continue;
      const k=L0.id+'|'+tr.dir+'|'+tr.dep; rs.add(k); let mk=rivalMk.get(k); if(!mk){ mk=L.circleMarker(p.ll,{radius:4,color:'#111',weight:1,fillColor:'#aab4c8',fillOpacity:.9}).addTo(layers.trains); mk.bindTooltip(esc(L0.op)+' · '+esc(lineName(L0))); rivalMk.set(k,mk); } else mk.setLatLng(p.ll); } }
  for(const [k,mk] of rivalMk) if(!rs.has(k)){ layers.trains.removeLayer(mk); rivalMk.delete(k); } }
function fullRedraw(){ for(const m of trainMk.values()) layers.trains.removeLayer(m); trainMk.clear(); for(const m of rivalMk.values()) layers.trains.removeLayer(m); rivalMk.clear(); drawNet(); renderTop(); renderPanel(); }

/* ---------- nouvelle partie ---------- */
function showNewGame(cancelable){ const d=$('#modal'); d.innerHTML=`<div class="box"><h2>🚆 Congo Rail Empire</h2>
  <p>Bâtissez la grande compagnie ferroviaire du Congo — puis du monde. Rénovez les vieilles lignes, construisez les chaînons manquants, transportez voyageurs et minerais.</p>
  <label>Nom de votre compagnie<input id="ng-name" value="Congo Rail" maxlength="40"></label>
  <label>Premier hub<select id="ng-hub">${START_HUBS.map(c=>`<option value="${c}">${esc(stationName(c))} (${esc(COUNTRIES[STATIONS[c].c][0])})</option>`).join('')}</select></label>
  <label>Difficulté<select id="ng-cash"><option value="300000000">Facile — 300 M$</option><option value="150000000" selected>Normale — 150 M$</option><option value="60000000">Difficile — 60 M$</option></select></label>
  <div class="row"><button class="primary" id="ng-go">Commencer</button>${cancelable?'<button id="ng-x">Annuler</button>':''}</div></div>`; d.hidden=false;
  $('#ng-go').onclick=()=>{ if(cancelable&&!armed($('#ng-go'),'Effacer la partie en cours ?')) return; newGame($('#ng-name').value.trim()||'Congo Rail',$('#ng-hub').value,+$('#ng-cash').value); d.hidden=true; UI.tab='home'; UI.sel=null; UI.open.a=S.hubs[0]; focusStation(S.hubs[0]); fullRedraw(); };
  if(cancelable) $('#ng-x').onclick=()=>{ d.hidden=true; }; }

/* ---------- démarrage et boucle ---------- */
function boot(){ initMap(); const fresh=!S; if(fresh) newGame('Congo Rail','KIN',150e6);
  document.addEventListener('click',onAct); document.addEventListener('change',onField);
  document.addEventListener('input',e=>{ if(e.target.type==='range') onField(e); });
  fullRedraw(); if(fresh) showNewGame(false);
  let last=performance.now(), wall=Date.now(), lastPanel=0;
  setInterval(()=>{ const now=performance.now(), w=Date.now(), gap=w-wall; wall=w;
    if(gap>15000&&!S.paused){ catchUp(); last=now; renderPanel(); }                                 // appli gelée (téléphone en veille) : on rattrape
    else { const dt=Math.min(now-last,3600000); last=now; if(!S.paused) advance(dt*S.speed); S.lastReal=w; }
    if(UI.netVer!==NET.ver||!RT) drawNet();
    renderTop(); updateTrains();
    const busy=document.activeElement&&['SELECT','INPUT'].includes(document.activeElement.tagName);
    if(!busy&&now-lastPanel>3000&&(UI.tab==='home'||UI.tab==='works'||UI.tab==='fin'||UI.tab==='news')&&!UI.sel&&!$('#panel').matches(':hover')){ lastPanel=now; renderPanel(); } },250);
  setInterval(save,8000); document.addEventListener('visibilitychange',()=>{ if(document.hidden) save(); else if(!S.paused){ catchUp(); renderPanel(); } });
  window.addEventListener('pagehide',save); }
if(load()) catchUp();
window.addEventListener('DOMContentLoaded',boot);
