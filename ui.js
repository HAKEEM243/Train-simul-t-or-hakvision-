/* =========================================================
   Hakvision Rail — interface : carte claire, barre du haut, menu hexagonal, tiroir des trains, fenêtres.
   ========================================================= */
'use strict';
const APP_V='3.1.0';
const $=s=>document.querySelector(s), esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const UI={drawer:false,dtab:'station',sel:new Set(),modal:null,mtab:{yard:'fleet'},fleetFilter:'all',model:null,form:{train:null,a:'KIN',b:null,stop:'omni',name:''}};

/* ---------- icônes (SVG simples) ---------- */
const P={
  list:'<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1.2" fill="currentColor"/><circle cx="3.5" cy="12" r="1.2" fill="currentColor"/><circle cx="3.5" cy="18" r="1.2" fill="currentColor"/>',
  check:'<rect x="3" y="4" width="5" height="5" rx="1"/><path d="M4 6.5l1.3 1.3L7.5 5M11 6.5h10M3 14h5v5H3zM11 16.5h10"/>',
  medal:'<circle cx="12" cy="9" r="6"/><path d="M8.5 14l-2 8 5.5-3 5.5 3-2-8"/>',
  building:'<path d="M4 21V5l8-2v18M12 8h8v13M2 21h20M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2"/>',
  yard:'<path d="M3 21V9l9-6 9 6v12M3 21h18M7 21v-6h10v6M7 11h10"/>',
  fuel:'<path d="M4 21V5a2 2 0 012-2h7a2 2 0 012 2v16M2 21h15M6 8h7M15 9l3 2v7a1.5 1.5 0 003 0V9l-3-3"/>',
  bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  bank:'<path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18"/>',
  tools:'<path d="M14 6a4 4 0 005 5l-9 9a2.1 2.1 0 01-3-3zM5 3l3 3-2 2-3-3z"/>',
  mail:'<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M3 6l9 7 9-7"/>',
  gear:'<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  layers:'<path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5"/>',
  zin:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21M10.5 7.5v6M7.5 10.5h6"/>',
  zout:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21M7.5 10.5h6"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
  bulb:'<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0012 3z"/>',
  train:'<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M8 17l-2 4M16 17l2 4"/><circle cx="9" cy="14" r="1" fill="currentColor"/><circle cx="15" cy="14" r="1" fill="currentColor"/>',
  send:'<path d="M4 5l9 7-9 7zM12 5l9 7-9 7z" fill="currentColor"/>',
  close:'<path d="M6 6l12 12M18 6L6 18"/>',
  filter:'<path d="M3 6h18M6 12h12M10 18h4"/>',
  down:'<path d="M3 7l6 6 4-4 8 8M21 11v6h-6"/>', up:'<path d="M3 17l6-6 4 4 8-8M21 13V7h-6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
};
const ico=(n,s)=>`<svg class="ic" viewBox="0 0 24 24" width="${s||22}" height="${s||22}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]||''}</svg>`;
const BUS='<svg viewBox="0 0 32 20" width="26" height="17" aria-hidden="true"><rect x="1" y="2" width="30" height="13" rx="4" fill="#111"/><rect x="5" y="5" width="5" height="4" rx="1" fill="#fff"/><rect x="12" y="5" width="5" height="4" rx="1" fill="#fff"/><rect x="19" y="5" width="8" height="4" rx="1" fill="#fff"/><circle cx="8" cy="17" r="2.3" fill="#111"/><circle cx="24" cy="17" r="2.3" fill="#111"/></svg>';
const CARGO='<svg viewBox="0 0 32 20" width="26" height="17" aria-hidden="true"><rect x="1" y="3" width="30" height="12" rx="1.5" fill="#111"/><path d="M6 4v10M11 4v10M16 4v10M21 4v10M26 4v10" stroke="#fff" stroke-width="1.4"/><circle cx="7" cy="17" r="2.3" fill="#111"/><circle cx="25" cy="17" r="2.3" fill="#111"/></svg>';

/* ---------- illustration d'un train : dessin vectoriel détaillé (pas une photo) ---------- */
let artN=0;
function trainArt(k){ const m=MODELS[k], [b,s,r]=m.liv, id='a'+(artN++), frt=m.kind==='frt', hs=m.vmax>=250, el=!!m.el;
  const G=(n,stops,dir)=>`<linearGradient id="${id}${n}" x1="0" y1="0" x2="${dir==='h'?1:0}" y2="${dir==='h'?0:1}">${stops.map(([o,c,a])=>`<stop offset="${o}" stop-color="${c}"${a!=null?` stop-opacity="${a}"`:''}/>`).join('')}</linearGradient>`;
  const bogie=x=>`<g transform="translate(${x} 0)"><rect x="-17" y="104" width="34" height="7" rx="2" fill="#2a2d33"/><circle cx="-9" cy="113" r="7.5" fill="#1b1d21"/><circle cx="9" cy="113" r="7.5" fill="#1b1d21"/>
    <circle cx="-9" cy="113" r="4.6" fill="url(#${id}w)"/><circle cx="9" cy="113" r="4.6" fill="url(#${id}w)"/><circle cx="-9" cy="113" r="1.4" fill="#111"/><circle cx="9" cy="113" r="1.4" fill="#111"/><rect x="-14" y="107" width="28" height="2" fill="#555b66"/></g>`;
  // caisse : nez profilé (grande vitesse), cabine plate (fret), nez arrondi (voyageurs)
  const nose=hs?`M24 62 H206 C238 62 262 76 276 100 L276 104 H24 Z`:frt?`M24 58 H178 Q186 58 186 66 V104 H24 Z`:`M24 60 H222 Q246 60 254 78 L258 104 H24 Z`;
  const winY=frt?66:70, wins=frt?'':Array.from({length:hs?8:7},(_,i)=>`<rect x="${36+i*24}" y="${winY}" width="17" height="12" rx="2.5" fill="url(#${id}g)"/>`).join('');
  const cab=hs?`<path d="M214 66 C236 67 252 78 262 92 L230 92 Q222 92 218 86 Z" fill="url(#${id}g)"/>`:frt?`<rect x="160" y="64" width="20" height="14" rx="2" fill="url(#${id}g)"/>`:`<path d="M226 66 Q242 67 248 82 L226 82 Z" fill="url(#${id}g)"/>`;
  const wagon=frt?`<g><rect x="190" y="70" width="104" height="34" rx="2" fill="url(#${id}c)"/>${[198,214,230,246,262,278].map(x=>`<rect x="${x}" y="74" width="3" height="26" fill="rgba(0,0,0,.18)"/>`).join('')}<rect x="190" y="70" width="104" height="5" fill="rgba(255,255,255,.18)"/>${bogie(212)}${bogie(272)}</g>`:'';
  const panto=el?`<g stroke="#2b2f36" stroke-width="2.2" fill="none" stroke-linecap="round"><path d="M96 ${hs?62:60} l14 -16 l14 16"/><path d="M104 44 h28"/></g><path d="M0 40 H300" stroke="#3b3f47" stroke-width="1.2"/><path d="M0 34 H300" stroke="#3b3f47" stroke-width=".8"/>`:'';
  return `<svg viewBox="0 0 300 130" class="art" role="img" aria-label="${esc(m.name)}"><defs>
    ${G('sky',[[0,'#1c3554'],[0.55,'#c98d5a'],[1,'#f2c78a']])}${G('hill',[[0,'#3e5a3a'],[1,'#2a3f2a']])}
    ${G('b',[[0,'#fff',0.55],[0.18,b],[0.8,b],[1,'#000',0.55]])}${G('c',[[0,s],[1,shadeHex(s,-40)]])}${G('g',[[0,'#bfe2ff'],[0.5,'#3d6c95'],[1,'#1a2f45']])}
    ${G('w',[[0,'#9aa2ad'],[1,'#4b525c']])}${G('bal',[[0,'#6f665c'],[1,'#3e3833']])}
    <radialGradient id="${id}l" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff6c8"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient></defs>
    <rect width="300" height="130" fill="url(#${id}sky)"/><circle cx="62" cy="58" r="16" fill="#ffe2a6" opacity=".85"/>
    <path d="M0 92 Q40 70 80 86 T170 80 T260 84 T300 78 V130 H0 Z" fill="url(#${id}hill)" opacity=".9"/>
    <path d="M0 98 Q70 88 150 96 T300 92 V130 H0 Z" fill="#26361f"/>
    ${panto}
    <rect x="0" y="116" width="300" height="14" fill="url(#${id}bal)"/>${Array.from({length:21},(_,i)=>`<rect x="${i*15-2}" y="118" width="9" height="4" rx="1" fill="#2c2620"/>`).join('')}
    <rect x="0" y="119" width="300" height="2" fill="#c9ced6"/><rect x="0" y="121" width="300" height="1" fill="#6d737c"/>
    ${wagon}
    <path d="${nose}" fill="url(#${id}b)"/><path d="${nose}" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1"/>
    <rect x="24" y="${frt?86:88}" width="${hs?250:frt?162:232}" height="6" fill="${s}"/><rect x="24" y="${frt?92:94}" width="${hs?250:frt?162:232}" height="2" fill="${shadeHex(s,-50)}"/>
    <rect x="30" y="${hs?58:frt?52:55}" width="${frt?120:170}" height="${frt?8:6}" rx="3" fill="${r}"/>
    ${wins}${cab}
    <circle cx="${hs?270:frt?183:252}" cy="${frt?96:97}" r="9" fill="url(#${id}l)"/><circle cx="${hs?270:frt?183:252}" cy="${frt?96:97}" r="2.4" fill="#fffbe0"/>
    <rect x="24" y="100" width="${hs?252:frt?162:234}" height="4" fill="rgba(0,0,0,.45)"/>
    ${frt?bogie(52)+bogie(156):bogie(64)+bogie(210)}
    <text x="34" y="${frt?83:86}" font-family="Saira Condensed,Arial Narrow,sans-serif" font-weight="700" font-size="8" fill="${shadeHex(b,-120)}" opacity=".7">HAKVISION</text></svg>`; }
function shadeHex(hex,d){ const n=parseInt(hex.slice(1),16), f=v=>Math.max(0,Math.min(255,v+d)).toString(16).padStart(2,'0'); return '#'+f(n>>16)+f(n>>8&255)+f(n&255); }

/* ---------- barre du haut ---------- */
function ring(pct,color,icon){ const C=2*Math.PI*21, d=Math.max(0,Math.min(1,pct))*C;
  return `<svg viewBox="0 0 50 50" width="46" height="46"><circle cx="25" cy="25" r="21" stroke="rgba(255,255,255,.12)" stroke-width="5" fill="rgba(0,0,0,.2)"/><circle cx="25" cy="25" r="21" stroke="${color}" stroke-width="5" fill="none" stroke-dasharray="${d} ${C}" transform="rotate(-90 25 25)" stroke-linecap="round"/></svg><span>${ico(icon,20)}</span>`; }
function renderTop(){
  $('#acc').textContent=fmt$(G.cash); $('#pts').textContent=G.points.toLocaleString('fr');
  $('#g-fuel').innerHTML=ring(G.fuel/G.fuelCap,'#4ea3ff','fuel'); $('#g-en').innerHTML=ring(G.energy/G.energyCap,'#f5a524','bolt');
  const unread=G.mail.filter(m=>!m.read).length; $('#b-mail').innerHTML=ico('mail',30)+(unread?`<i class="badge">${unread}</i>`:'');
  const h=G.priceHist, p=sharePrice(), prev=h.length>6?h[h.length-7].p:(h[0]?h[0].p:p), up=p>=prev;
  $('#co').innerHTML=`<span class="logo"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M8 3l-3 18M16 3l3 18M6.4 9h11.2M5.6 15h12.8"/></svg></span><span class="who"><b>${esc(G.name.toUpperCase())}</b><span class="${up?'up':'dn'}">${ico(up?'up':'down',16)} $${p.toFixed(2)}</span></span>`;
  const cl=claimable(); $('#h-check').classList.toggle('alert',cl>0); $('#h-check').dataset.n=cl||'';
  renderSaved(); }

/* ---------- tiroir des trains (en route / à la gare / au dépôt / en attente) ---------- */
const DTABS=[['enroute','send','EN ROUTE'],['station','train','À LA GARE'],['yard','yard','AU DÉPÔT'],['pending','clock','EN ATTENTE']];
const trainsIn=tab=>G.trains.filter(t=>t.state===tab);
function renderDrawer(){ const d=$('#drawer'); if(!UI.drawer){ d.hidden=true; $('#b-list').hidden=false; return; } d.hidden=false; $('#b-list').hidden=true;
  const tab=UI.dtab, list=trainsIn(tab), title={enroute:'EN ROUTE',station:'À LA GARE',yard:'AU DÉPÔT',pending:'EN ATTENTE'}[tab];
  for(const id of [...UI.sel]){ const t=trainById(id); if(!t||t.state!=='station') UI.sel.delete(id); }
  const cols={enroute:['ITINÉRAIRE','PROGRESSION','ARRIVÉE'],station:['ITINÉRAIRE','USURE','ARRIVÉ'],yard:['TRAIN','USURE',''],pending:['TRAIN','','LIVRAISON']}[tab];
  const allSel=tab==='station'&&list.length&&list.every(t=>UI.sel.has(t.id));
  let rows=list.map(t=>{ const r=routeOfTrain(t), m=MODELS[t.model], name=r?r.name:t.name, bar=`<i class="cb" style="background:${r?r.color:'#9aa3c7'}"></i>`;
    if(tab==='enroute'){ const f=Math.min(1,(now()-t.dep)/t.dur); return `<div class="row" data-act="train" data-v="${t.id}">${bar}<b>${esc(name)}</b><span class="prog"><i style="width:${f*100}%"></i></span><span class="when">${fmtIn(t.dep+t.dur-now())}</span></div>`; }
    if(tab==='station'){ const e=canDepart(t); return `<div class="row" data-act="train" data-v="${t.id}">${bar}<b>${esc(name)}</b><span class="wear ${t.wear>80?'bad':''}">${m.kind==='frt'?CARGO:BUS} ${t.wear.toFixed(2)}%</span><span class="when">${fmtAgo(t.since)}</span><i class="dot ${e?'red':'green'}" title="${esc(e||'Prêt à partir')}"></i><label class="ck" data-stop="1"><input type="checkbox" data-sel="${t.id}" ${UI.sel.has(t.id)?'checked':''} aria-label="Sélectionner"></label></div>`; }
    if(tab==='yard') return `<div class="row" data-act="train" data-v="${t.id}">${bar}<b>${esc(r?r.name:t.name)}</b><span class="wear">${t.wear.toFixed(1)}%</span>${r?`<button class="mini" data-act="unpark" data-v="${t.id}">En service</button>`:`<button class="mini" data-act="assign" data-v="${t.id}">Affecter</button>`}</div>`;
    return `<div class="row">${bar}<b>${esc(t.name)}</b><span></span><span class="when">${fmtIn(t.until-now())}</span></div>`; }).join('');
  if(!list.length) rows=`<div class="empty">${{enroute:'Aucun train en route.',station:'Aucun train en gare. Créez un itinéraire au DÉPÔT.',yard:'Aucun train au dépôt.',pending:'Aucune commande en cours.'}[tab]}</div>`;
  const ready=list.filter(t=>!canDepart(t)), n=UI.sel.size||ready.length;
  d.innerHTML=`<div class="dh">${ico('filter',24)}<h3>${title}</h3><button class="x" data-act="drawer" aria-label="Fermer">${ico('close',26)}</button></div>
   <div class="dcols"><span>${cols[0]}</span><span>${cols[1]}</span><span>${cols[2]}</span>${tab==='station'?`<label class="ck" data-stop="1"><input type="checkbox" data-selall="1" ${allSel?'checked':''} aria-label="Tout sélectionner"></label>`:''}</div>
   <div class="dlist">${rows}</div>
   ${tab==='station'?`<div class="fleet"><h4>ACTIONS DE FLOTTE</h4><button class="go" data-act="departsel" ${n?'':'disabled'}>${ico('send',20)} FAIRE PARTIR ${n}</button>
     <div class="hint">${UI.sel.size?UI.sel.size+' train(s) sélectionné(s)':'Sans sélection : tous les trains prêts partent.'}</div></div>`:''}
   <nav class="dtabs">${DTABS.map(([k,i,l])=>`<button class="${k===tab?'on':''}" data-act="dtab" data-v="${k}"><i class="cnt">${trainsIn(k).length}</i>${ico(i,22)}<span>${l}</span></button>`).join('')}</nav>`; }

/* ---------- fenêtres ---------- */
function openModal(name,arg){ if(name==='route'){ startEdit(arg); return; } UI.modal={name,arg}; if(name==='mail') setTimeout(()=>{ G.mail.forEach(m=>m.read=true); renderTop(); },800); renderModal(); }
function closeModal(){ UI.modal=null; $('#modal').hidden=true; $('#modal').innerHTML=''; }
function sheet(title,body,tabs,noClose){ return `<div class="sheet">${noClose?'':`<button class="mx" data-act="close" aria-label="Fermer">${ico('close',26)}</button>`}<h2>${title}</h2>${tabs||''}<div class="sbody">${body}</div></div>`; }
function tabsHtml(key,list){ return `<nav class="stabs">${list.map(([k,l])=>`<button class="${UI.mtab[key]===k?'on':''}" data-act="mtab" data-k="${key}" data-v="${k}">${l}</button>`).join('')}</nav>`; }
function renderModal(){ const M=UI.modal, el=$('#modal'); if(!M){ el.hidden=true; return; } el.hidden=false;
  const f={pax:mPax,cargo:mCargo,redit:mRouteEdit,world:mWorld,yard:mYard,check:mCheck,shop:mShop,company:mCompany,fuel:mFuel,finance:mFinance,service:mService,mail:mMail,settings:mSettings,help:mHelp,train:mTrain,route:mRoute,station:mStation,newgame:mNewGame}[M.name];
  const sc=el.querySelector('.sbody'), top=sc?sc.scrollTop:0; el.innerHTML=f(M.arg); const sb=el.querySelector('.sbody'); if(sb&&M.keep) sb.scrollTop=top; M.keep=true; }
const sOpts=(sel,filter)=>{ const order=['CD','CG',...Object.keys(COUNTRIES).filter(c=>c!=='CD'&&c!=='CG').sort((a,b)=>COUNTRIES[a][0].localeCompare(COUNTRIES[b][0]))];
  return order.map(c=>{ const l=Object.values(STATIONS).filter(s=>s.c===c&&(!filter||filter(s.code))).sort((x,y)=>x.n.localeCompare(y.n)); return l.length?`<optgroup label="${esc(COUNTRIES[c][0])}">${l.map(s=>`<option value="${s.code}" ${s.code===sel?'selected':''}>${esc(s.n)}</option>`).join('')}</optgroup>`:''; }).join(''); };
const stateFr=t=>({enroute:'En route',station:'En gare',yard:'Au dépôt',pending:'En livraison'}[t.state]);
function specLine(m){ return `${GAUGES[m.g]} · ${m.el?'électrique ('+m.epk+' kWh/km)':'diesel ('+m.fpk+' L/km)'}${m.comfort?' · confort +'+Math.round((m.comfort-1)*100)+' %':''}`; }
const capTxt=m=>`${m.pax?m.pax+'PAX':''}${m.pax&&m.t?' / ':''}${m.t?m.t+'T':''}`;

function mYard(){ const tab=UI.mtab.yard||'fleet', T=tabsHtml('yard',[['fleet','FLOTTE'],['routes','ITINÉRAIRES'],['buy','⊕ COMMANDER']]);
  if(tab==='fleet'){
    if(UI.model){ const k=UI.model, m=MODELS[k], units=G.trains.filter(t=>t.model===k);
      return sheet('COUR DE TRIAGE',`<button class="back" data-act="model" data-v="">← Flotte</button><div class="mcard big"><h5>${esc(m.name.toUpperCase())}</h5><div class="pic">${trainArt(k)}</div><div class="spec">${specLine(m)}</div></div>
        ${units.map(t=>{ const r=routeOfTrain(t); return `<div class="unit"><div><b>${esc(t.name)}</b><div class="mut">${stateFr(t)}${r?' · '+esc(r.name)+' : '+esc(stationName(r.a))+' ⇄ '+esc(stationName(r.b)):''} · usure ${t.wear.toFixed(1)} %${t.auto?' · pilote auto':''}</div></div>
          <div class="btns">${t.state!=='enroute'&&t.state!=='pending'?`<button data-act="assign" data-v="${t.id}">Itinéraire</button>`:''}<button data-act="train" data-v="${t.id}">Détails</button></div></div>`; }).join('')}`,T); }
    const pax=G.trains.filter(t=>MODELS[t.model].pax), frt=G.trains.filter(t=>!MODELS[t.model].pax);
    const cap=G.trains.reduce((s,t)=>s+MODELS[t.model].pax,0), capT=G.trains.reduce((s,t)=>s+MODELS[t.model].t,0), used=usedSlots(), C=2*Math.PI*44;
    const owned=[...new Set(G.trains.map(t=>t.model))].filter(k=>UI.fleetFilter==='all'||(UI.fleetFilter==='el')===!!MODELS[k].el), shown=G.trains.filter(t=>owned.includes(t.model)).length;
    return sheet('COUR DE TRIAGE',`<div class="sum"><div class="half"><span>PASSAGER</span><div class="pill">${BUS}<b>${pax.length}</b></div><span>CAPACITÉ : ${cap.toLocaleString('fr')} PAX</span></div>
      <div class="slots"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" stroke="#2c3a8c" stroke-width="7" fill="#fff"/><circle cx="50" cy="50" r="44" stroke="#1e88ff" stroke-width="7" fill="none" stroke-dasharray="${used/G.slots*C} ${C}" transform="rotate(-90 50 50)"/></svg><div><b>${used} / ${G.slots}</b><small>EMPLACEMENTS</small></div><button class="plus" data-act="open" data-v="shop" aria-label="Plus d'emplacements">+</button></div>
      <div class="half r"><span>FRET</span><div class="pill"><b>${frt.length}</b>${CARGO}</div><span>CAPACITÉ : ${capT.toLocaleString('fr')} T</span></div></div>
      <div class="chips">${[['all','TOUT'],['di','DIESEL'],['el','ÉLECTRIQUE']].map(([k,l])=>`<button class="${UI.fleetFilter===k?'on':''}" data-act="ff" data-v="${k}">${l}</button>`).join('')}<b>${shown} / ${G.trains.length}</b></div>
      <div class="grid">${owned.map(k=>{ const m=MODELS[k]; return `<button class="mcard" data-act="model" data-v="${k}"><h5>${esc(m.name.toUpperCase())}</h5><div class="cap">CAPACITÉ : ${capTxt(m)}</div>
        <div class="pic">${trainArt(k)}<span class="tags">${m.pax?`<i class="tg b">${BUS}</i>`:''}${m.t?`<i class="tg g">${CARGO}</i>`:''}</span></div><div class="own">UNITÉS DÉTENUES <i>${G.trains.filter(t=>t.model===k).length}</i></div></button>`; }).join('')||'<div class="empty">Aucun train de ce type.</div>'}</div>`,T); }
  if(tab==='routes') return sheet('COUR DE TRIAGE',routeForm()+`<h4 class="sec">VOS ITINÉRAIRES (${G.routes.length})</h4>`+(G.routes.map(r=>{ const g=geom(r), tr=trainById(r.train);
     return `<div class="unit" data-act="route" data-v="${r.id}"><i class="cb" style="background:${r.color}"></i><div><b>${esc(r.name)}</b> · ${esc(stationName(r.a))} ⇄ ${esc(stationName(r.b))}<div class="mut">${tr?esc(tr.name):'—'} · ${g?Math.round(g.km)+' km · '+fmtIn(g.out.T/G.scale)+' par trajet · '+g.out.stops.length+' arrêts':'itinéraire impossible'}</div></div></div>`; }).join('')||'<div class="empty">Aucun itinéraire.</div>'),T);
  return sheet('COUR DE TRIAGE',`<div class="mut pad">Dépôt : ${usedSlots()} / ${G.slots} emplacements · niveau ${G.level}. Les trains commandés arrivent dans « EN ATTENTE ».</div><div class="grid">${Object.entries(MODELS).map(([k,m])=>{ const lock=m.lvl>G.level;
     return `<div class="mcard ${lock?'lock':''}"><h5>${esc(m.name.toUpperCase())}</h5><div class="cap">${capTxt(m)} · ${m.vmax} km/h</div><div class="pic">${trainArt(k)}<span class="tags">${m.el?'<i class="tg y">⚡</i>':'<i class="tg b">⛽</i>'}</span></div>
      <div class="spec">${specLine(m)}</div>${lock?`<div class="own">🔒 NIVEAU ${m.lvl}</div>`:`<button class="buy" data-act="buy" data-v="${k}">${m.pts?m.pts+' POINTS':fmt$(m.price)}</button>`}</div>`; }).join('')}</div>`,T); }
/* --- création d'un itinéraire : choix du train puis éditeur d'arrêts --- */
function routeForm(){ const free=G.trains.filter(t=>t.state==='yard'||t.state==='station');
  if(!free.length) return `<div class="empty">Tous vos trains sont en route ou en livraison. Commandez un train ou attendez son arrivée.</div>`;
  return `<button class="go wide" data-act="newroute">⊕ CRÉER UN ITINÉRAIRE</button><div class="mut">Choisissez un train, votre hub de départ, la gare d'arrivée, puis cochez les gares où le train s'arrête.</div>`; }
function startEdit(routeId,trainId,a){ if(routeId){ const r=routeById(routeId), g=geom(r); UI.edit={id:r.id,train:r.train,a:r.a,b:r.b,stops:g?g.out.stops.map(s=>s.code):[r.a,r.b],direct:!!r.direct,name:r.name,color:r.color}; }
  else { const free=G.trains.filter(t=>t.state==='yard'||t.state==='station'), tr=trainById(trainId)||free.find(t=>reachable(a||G.hubs[0],MODELS[t.model]).size)||free[0];
    UI.edit={id:null,train:tr?tr.id:null,a:a||(tr&&tr.route?routeOfTrain(tr).a:null)||UI.form.a||G.hubs[0],b:null,stops:null,direct:false,name:'',color:ROUTE_PALETTE[G.routes.length%ROUTE_PALETTE.length]}; }
  if(!G.hubs.includes(UI.edit.a)) UI.edit.a=G.hubs[0]; openModal('redit'); }
function editModel(){ const E=UI.edit; return E.id?routeById(E.id).model:(trainById(E.train)||{}).model; }
function mRouteEdit(){ const E=UI.edit; if(!E) return sheet('ITINÉRAIRE','<div class="empty">—</div>');
  const free=G.trains.filter(t=>t.state==='yard'||t.state==='station'||(E.id&&t.id===E.train)), model=editModel(); if(!model) return sheet('ITINÉRAIRE','<div class="empty">Aucun train disponible.</div>');
  const m=MODELS[model]; net(); const reach=reachable(E.a,m); if(!reach.has(E.b)){ E.b=[...reach].sort((x,y)=>STATIONS[y].p-STATIONS[x].p)[0]||null; E.stops=null; }
  const head=`<div class="two">${E.id?'':`<label>Train<select data-e="train">${free.map(t=>`<option value="${t.id}" ${t.id===E.train?'selected':''}>${esc(t.name)}${t.route?' · '+esc(routeOfTrain(t).name):''}</option>`).join('')}</select></label>`}
    <label>Départ (vos hubs)<select data-e="a">${G.hubs.map(c=>`<option value="${c}" ${c===E.a?'selected':''}>⭐ ${esc(stationName(c))}</option>`).join('')}</select></label>
    <label>Terminus (${reach.size} gares)<select data-e="b">${reach.size?sOpts(E.b,c=>reach.has(c)):'<option>—</option>'}</select></label></div>`;
  if(!E.b) return sheet(m.kind==='frt'?'ITINÉRAIRE FRET':'ITINÉRAIRE VOYAGEURS',head+`<div class="err">Ce train ne peut pas rouler depuis ce hub : il demande la ${esc(GAUGES[m.g].toLowerCase())}${m.el?' électrifiée':''}. Ici : ${esc([...gaugesAt(E.a)].map(g=>GAUGES[g]).join(', ')||'aucune voie')}.</div>`);
  const path=pathOf(E.a,E.b,model).nodes; if(!E.stops) E.stops=path.slice(); E.stops=E.stops.filter(c=>path.includes(c)); for(const c of [E.a,E.b]) if(!E.stops.includes(c)) E.stops.push(c);
  const tmp={id:-1,a:E.a,b:E.b,model,stops:E.stops,direct:E.direct||m.kind==='frt'}, g=geom(tmp), tr=trainById(E.train)||{model,ctrl:1,speed:1,at:'a'}, p=tripPlan(tr,'out',tmp,true);
  const sel=new Set(g.out.stops.map(s=>s.code)), byCode=Object.fromEntries(p.stops.map(s=>[s.code,s])), demand=p.stops.reduce((s,x)=>s+x.wait,0);
  const rows=path.map((c,i)=>{ const on=sel.has(c), end=i===0||i===path.length-1, x=byCode[c], w=Math.round(poolNow(c)), mx=poolMax(c);
    return `<label class="stoprow ${on?'on':''}"><input type="checkbox" data-stop2="${c}" ${on?'checked':''} ${end||tmp.direct?'disabled':''}><span class="sn">${esc(stationName(c))}${G.hubs.includes(c)?' ⭐':''}<small>${Math.round(g.out.cum[i])} km</small></span>
      <span class="sw"><b>${w.toLocaleString('fr')}/${mx.toLocaleString('fr')}</b><i class="prog"><i style="width:${w/mx*100}%"></i></i></span><span class="sio">${x&&m.pax?`<b class="pos">+${x.on}</b> <b class="neg">−${x.off}</b>`:end?'terminus':''}</span></label>`; }).join('');
  const body=`${head}<div class="rbar"><b>${esc(stationName(E.a).toUpperCase())}</b><span><i>${Math.round(g.km)} KM</i><i>${g.out.stops.length} ARRÊTS</i></span><b>${esc(stationName(E.b).toUpperCase())}</b></div>
   ${m.kind==='pax'?`<label class="switch"><span>TRAJET DIRECT</span><input type="checkbox" data-e="direct" ${E.direct?'checked':''}><i></i></label>`:''}
   <div class="kpi"><div><span>Tronçons</span><b>${g.out.edges.length}</b></div><div><span>Demande</span><b>${demand.toLocaleString('fr')}</b></div><div><span>Durée du trajet</span><b>${fmtIn(p.T/G.scale)}</b></div><div><span>Subvention</span><b>${p.sub} %</b></div></div>
   <div class="prev">Par trajet ≈ ${m.pax?`<b>${p.pax}</b> voyageurs`:''}${m.pax&&m.t?' + ':''}${m.t?`<b>${p.tons}</b> t`:''} · recette <b>${fmt$(p.rev)}</b> · ${m.el?Math.round(p.energy).toLocaleString('fr')+' kWh':Math.round(p.fuel).toLocaleString('fr')+' L'}${m.pax?` · fraude ≈ ${p.fraud} voyageurs`:''}</div>
   ${m.pax&&!tmp.direct?`<div class="info">ⓘ Cochez ou décochez une gare pour l'ajouter ou la retirer des arrêts. Les nombres montrent les voyageurs en attente et les montées / descentes prévues.</div>
   <div class="chips"><button data-act="stopsall">TOUTES</button><button data-act="stopsbig">GRANDES VILLES</button><button data-act="stopsnone">AUCUNE</button></div>`:''}
   <div class="stops">${rows}</div>
   <label>Nom de la ligne<input data-e="name" value="${esc(E.name)}" placeholder="${routeLetter(G.routes.length)}-Line" maxlength="24"></label>
   <div class="palette">${ROUTE_PALETTE.map(c=>`<button class="${c===E.color?'on':''}" style="background:${c}" data-act="color" data-v="${c}" aria-label="Couleur"></button>`).join('')}</div>
   <div class="btns">${E.id?`<button class="go" data-act="saveroute">METTRE À JOUR</button><button class="danger" data-act="delroute" data-v="${E.id}">Supprimer la ligne</button>`:`<button class="go" data-act="saveroute">CRÉER LA LIGNE</button>`}</div>`;
  return sheet(m.kind==='frt'?'ITINÉRAIRE FRET':'ITINÉRAIRE VOYAGEURS',body); }

function mCheck(){ return sheet('OBJECTIFS',MISSIONS.map(m=>{ const [a,b]=m.p(), done=a>=b, got=G.claimed[m.id];
  return `<div class="mis ${got?'got':''}"><div><b>${esc(m.name)}</b><div class="prog"><i style="width:${Math.min(1,a/b)*100}%"></i></div><small>${Math.min(a,b).toLocaleString('fr')} / ${b.toLocaleString('fr')}</small></div>
   ${got?'<span class="ok">✓</span>':`<button class="${done?'go':''}" data-act="claim" data-v="${m.id}" ${done?'':'disabled'}>+${m.pts} pts</button>`}</div>`; }).join('')); }
function mShop(){ return sheet('BOUTIQUE',`<div class="mut pad">Vous avez <b>${G.points}</b> points. Gagnez-en avec les OBJECTIFS, les niveaux et le bonus quotidien (+10 par jour). Pas d'achat avec de l'argent réel : tout se paie en points du jeu.</div>`+
  SHOP.map(s=>`<div class="unit"><span class="sico">${ico(s.ico,26)}</span><div><b>${esc(s.name)}</b></div><button class="${G.points>=s.pts?'go':''}" data-act="shop" data-v="${s.id}">${s.pts} pts</button></div>`).join('')+
  `<div class="unit"><span class="sico">${ico('train',26)}</span><div><b>Pilote automatique</b><div class="mut">Le train repart seul à chaque arrivée, même jeu fermé (s'il reste du carburant). 30 pts par train, à activer dans la fiche du train.</div></div></div>`); }
function mCompany(){ const H=G.priceHist.slice(-48), mn=Math.min(...H.map(x=>x.p),sharePrice()), mx=Math.max(...H.map(x=>x.p),sharePrice()), pts=H.map((x,i)=>`${i/(Math.max(1,H.length-1))*300},${80-(x.p-mn)/(mx-mn||1)*70}`).join(' ');
  return sheet('COMPAGNIE',`<label>Nom de la compagnie<input id="co-name" value="${esc(G.name)}" maxlength="30"></label><button data-act="rename">Renommer</button>
   <div class="lvl"><b>Niveau ${G.level}</b><div class="prog"><i style="width:${G.xp/xpFor(G.level)*100}%"></i></div><small>${G.xp} / ${xpFor(G.level)} XP</small></div>
   <div class="kpi"><div><span>Valeur</span><b>${fmt$(companyValue())}</b></div><div><span>Action</span><b>$${sharePrice().toFixed(2)}</b></div><div><span>Trains</span><b>${G.trains.length}</b></div><div><span>Lignes</span><b>${G.routes.length}</b></div>
   <div><span>Voyageurs</span><b>${G.stats.pax.toLocaleString('fr')}</b></div><div><span>Fret</span><b>${G.stats.tons.toLocaleString('fr')} t</b></div><div><span>Trajets</span><b>${G.stats.trips}</b></div><div><span>Gares desservies</span><b>${G.stats.stations.length}</b></div></div>
   <h4 class="sec">HUBS (${G.hubs.length})</h4><div class="hubs">${G.hubs.map(c=>`<button class="hubchip" data-act="fly" data-v="${c}">⭐ ${esc(stationName(c))}<small>${esc(COUNTRIES[STATIONS[c].c][0])}</small></button>`).join('')}</div>
   ${H.length>1?`<h4 class="sec">COURS DE L'ACTION</h4><svg viewBox="0 0 300 85" class="spark"><polyline points="${pts}" fill="none" stroke="#1e88ff" stroke-width="2.5"/></svg><div class="mut">De $${mn.toFixed(2)} à $${mx.toFixed(2)} · calculé à partir de la valeur de votre compagnie.</div>`:''}`); }
function priceChart(fn,unit){ const t=now(), xs=Array.from({length:37},(_,i)=>t-(36-i)*20*60e3), ys=xs.map(x=>fn(x)), mn=Math.min(...ys), mx=Math.max(...ys), y=v=>64-(v-mn)/(mx-mn||1)*58;
  return `<svg viewBox="-4 0 308 70" class="spark"><polyline points="${ys.map((v,i)=>`${i/36*300},${y(v)}`).join(' ')}" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="300" cy="${y(ys[36])}" r="4" fill="currentColor"/></svg><div class="mut">12 dernières heures : de ${mn.toFixed(3)} à ${mx.toFixed(3)} $/${unit}</div>`; }
function mFuel(){ const card=(k,name,unit,price,cap,cur,color,icon,fn)=>`<div class="fuel" style="color:${color}"><div class="fh">${ico(icon,28)}<b>${name}</b><span>${price.toFixed(3)} $/${unit}</span></div>
   <div class="tank"><i style="width:${cur/cap*100}%;background:${color}"></i></div><div class="mut">${Math.round(cur).toLocaleString('fr')} / ${cap.toLocaleString('fr')} ${unit}</div>${priceChart(fn,unit)}
   <div class="btns">${[5000,20000].map(q=>`<button data-act="fuel" data-k="${k}" data-v="${q}">+${q.toLocaleString('fr')} ${unit} · ${fmt$(q*price)}</button>`).join('')}<button class="go" data-act="fuel" data-k="${k}" data-v="${cap}">PLEIN · ${fmt$((cap-cur)*price)}</button></div></div>`;
  return sheet('CARBURANT',`<div class="mut pad">Les prix changent toutes les 10 minutes : achetez quand c'est bas ! Les trains diesel consomment du gazole, les électriques de l'énergie.</div>`+
   card('fuel','GAZOLE','L',fuelPrice(),G.fuelCap,G.fuel,'#1e88ff','fuel',fuelPrice)+card('energy','ÉNERGIE','kWh',energyPrice(),G.energyCap,G.energy,'#d69e00','bolt',energyPrice)); }
function mFinance(){ const Lg=G.ledger.slice(-12).reverse(), mx=Math.max(1,...Lg.map(b=>Math.max(b.rev,b.fuel+b.repair+b.buy+(b.staff||0))));
  return sheet('FINANCES',`<div class="kpi"><div><span>Compte</span><b>${fmt$(G.cash)}</b></div><div><span>Dette</span><b>${fmt$(G.debt)}</b></div><div><span>Recettes totales</span><b>${fmt$(G.stats.rev)}</b></div><div><span>Intérêts</span><b>0,2 % / heure</b></div></div>
   <div class="btns"><button data-act="borrow" data-v="250000">Emprunter 250 000 $</button><button data-act="borrow" data-v="1000000">Emprunter 1 000 000 $</button><button data-act="repay" data-v="250000">Rembourser 250 000 $</button></div>
   <h4 class="sec">PAR HEURE</h4>${Lg.length?`<table><tr><th>Heure</th><th>Recettes</th><th>Dépenses</th><th></th></tr>${Lg.map(b=>{ const dep=b.fuel+b.repair+b.buy+(b.staff||0);
    return `<tr><td>${new Date(b.h*36e5).toLocaleTimeString('fr',{hour:'2-digit',minute:'2-digit'})}</td><td class="pos">${fmt$(b.rev)}</td><td class="neg">${fmt$(dep)}</td><td class="bars"><i class="p" style="width:${b.rev/mx*100}%"></i><i class="n" style="width:${dep/mx*100}%"></i></td></tr>`; }).join('')}</table>`:'<div class="empty">Pas encore de mouvements.</div>'}`); }
function mService(){ const list=G.trains.slice().sort((a,b)=>b.wear-a.wear), tot=list.filter(t=>t.state!=='enroute').reduce((s,t)=>s+repairCost(t),0);
  return sheet('ENTRETIEN',`<div class="mut pad">L'usure augmente à chaque trajet (plus vite sur les voies abîmées). Au-delà de 80 %, risque de panne ; à 100 %, le train est immobilisé.</div><button class="go wide" data-act="repairall" ${tot?'':'disabled'}>TOUT RÉPARER · ${fmt$(tot)}</button>`+
   list.map(t=>`<div class="unit"><div><b>${esc(t.name)}</b><div class="prog ${t.wear>80?'bad':''}"><i style="width:${t.wear}%"></i></div><small>${t.wear.toFixed(1)} % · ${stateFr(t)}</small></div><button data-act="repair" data-v="${t.id}" ${t.wear<1||t.state==='enroute'?'disabled':''}>${fmt$(repairCost(t))}</button></div>`).join('')); }
function mMail(){ return sheet('MESSAGES',G.mail.map(m=>`<div class="msg ${m.read?'':'new'}"><b>${esc(m.title)}</b><small>${fmtAgo(m.t)}</small><p>${esc(m.body)}</p></div>`).join('')||'<div class="empty">Aucun message.</div>'); }
function mSettings(){ return sheet('RÉGLAGES',`<label>Vitesse du jeu (durée des trajets)<select data-g="scale">${[[10,'Lente : 1 h de jeu = 6 min'],[30,'Normale : 1 h de jeu = 2 min'],[60,'Rapide : 1 h de jeu = 1 min'],[180,'Très rapide : 1 h de jeu = 20 s']].map(([v,l])=>`<option value="${v}" ${G.scale===v?'selected':''}>${l}</option>`).join('')}</select></label>
   <div class="mut">S'applique aux prochains départs.</div><h4 class="sec">SAUVEGARDE</h4><div>${esc(saveText())}</div>
   <div class="btns"><button class="go" data-act="savenow">Sauvegarder maintenant</button><button data-act="export">Exporter</button><button data-act="import">Importer</button></div>
   <h4 class="sec">PARTIE</h4><button class="danger" data-act="reset">Nouvelle partie</button><div class="mut">Version ${APP_V}. Gares, voies et populations : réelles mais simplifiées. Demandes, prix et cours de l'action : simulés par le jeu.</div>`); }
function mHelp(){ return sheet('COMMENT JOUER',`<ol class="help"><li>Ouvrez le <b>DÉPÔT</b> → <b>ITINÉRAIRES</b> : choisissez un train, une gare de départ et d'arrivée. Une ligne = un train.</li>
   <li>Ouvrez la liste (bouton à gauche) : onglet <b>À LA GARE</b>, puis <b>FAIRE PARTIR</b>. Le train roule sur la carte.</li><li>À l'arrivée, la recette tombe sur votre compte. Faites repartir le train : il fait le trajet retour.</li>
   <li>Surveillez le <b>gazole</b> (jauge bleue) et l'<b>énergie</b> (jauge jaune) : rechargez dans CARBURANT quand le prix est bas.</li><li>Réparez l'usure dans <b>ENTRETIEN</b>. Validez vos <b>OBJECTIFS</b> pour gagner des points.</li>
   <li>Au Congo, les voies sont en <b>voie du Cap</b> (1067 mm) ; Kisangani–Ubundu est en voie métrique. L'Europe et la Chine sont en voie normale.</li><li>Le cuivre de <b>Kolwezi</b> vers <b>Lobito</b> ou <b>Dar es Salaam</b> rapporte gros avec un train de fret.</li>
   <li>Les trajets continuent quand le jeu est fermé ; avec le <b>pilote automatique</b>, vos trains repartent seuls.</li></ol><button class="go wide" data-act="close">C'EST PARTI !</button>`); }
function mTrain(id){ const t=trainById(id); if(!t) return sheet('TRAIN','<div class="empty">Train introuvable.</div>'); const m=MODELS[t.model], r=routeOfTrain(t), g=r&&geom(r), e=t.state==='station'?canDepart(t):null;
  const p=r&&t.state!=='enroute'&&t.state!=='pending'?tripPlan(t):null, spd=speedOf(t), ctrl=ctrlOf(t), card=(ic,l,v,cls)=>`<div class="dc"><span class="di">${ic}</span><div><small>${l}</small><b class="${cls||''}">${v}</b></div></div>`;
  let live='';
  if(t.state==='enroute'&&t.trip&&t.trip.stops){ const x=tripProgress(t), dur=t.dur, lt=x.legT;
    live=`<h4 class="sec">EN DIRECT</h4><div class="prev"><b>${x.onboard}</b> voyageurs à bord${t.trip.tons?' · '+t.trip.tons+' t':''} · ${x.atStop?'à quai à <b>'+esc(stationName(x.stops[x.last].c))+'</b>':'prochain arrêt <b>'+esc(stationName(x.stops[x.next].c))+'</b>'} · terminus dans ${fmtIn(t.dep+t.dur-now())}</div>
     <div class="tlw"><table class="tl"><tr><th>Gare</th><th>Heure</th><th>Montent</th><th>Desc.</th><th>À bord</th></tr>${x.stops.map((s,i)=>`<tr class="${i<x.last||(i===x.last&&!x.atStop)?'past':i===x.next?'next':''}"><td>${esc(stationName(s.c))}</td><td>${new Date(t.dep+(s.arr||0)/lt*dur).toLocaleTimeString('fr',{hour:'2-digit',minute:'2-digit'})}</td><td class="pos">+${s.on}</td><td class="neg">−${s.off}</td><td>${s.ob}</td></tr>`).join('')}</table></div>
     <button class="go wide" data-act="pax" data-v="${t.id}">${m.kind==='frt'?'📦 MANIFESTE DU FRET':'👥 VOIR LES '+t.trip.pax+' PASSAGERS'}</button>
     ${t.trip.ctrl?`<div class="mut">👮 ${t.trip.ctrl} contrôleur(s) à bord · ${t.trip.fraud} fraudeurs estimés, ${t.trip.caught} verbalisés (+${fmt$(t.trip.fines)})</div>`:`<div class="mut">Aucun contrôleur à bord : ${t.trip.fraud} voyageurs sans billet.</div>`}`; }
  const last=t.last?`<h4 class="sec">DERNIER TRAJET</h4>${t.last.stops?`<button class="edit" data-act="pax" data-v="${t.id}" data-w="last">${m.kind==='frt'?'📦 MANIFESTE DU FRET':'👥 PASSAGERS DU DERNIER TRAJET ('+t.last.pax+')'} →</button>`:''}<div class="prev">${t.last.pax?t.last.pax+' voyageurs':''}${t.last.tons?' · '+t.last.tons+' t':''} · recette ${fmt$(t.last.rev)}${t.last.fraud!=null&&t.last.pax?`<br>Fraude : ${t.last.fraud} sans billet (−${fmt$(t.last.lost)}) · ${t.last.caught} verbalisés (+${fmt$(t.last.fines)})`:''}${t.last.sub?' · subvention '+t.last.sub+' %':''}</div>`:'';
  return sheet('DÉTAILS',`<div class="mcard big"><h5>${esc(t.name.toUpperCase())}</h5><div class="pic">${trainArt(t.model)}</div></div>
   <div class="dgrid">${card('⛽','Consommation',m.el?(m.epk*(0.55+0.45*spd*spd)).toFixed(1)+' kWh/km':(m.fpk*(0.55+0.45*spd*spd)).toFixed(2)+' L/km')}${card('⏱','Vitesse',Math.round(m.vmax*spd)+' km/h')}
    ${card('⚙','Usure',t.wear.toFixed(2)+' %',t.wear>80?'neg':t.wear>30?'warn':'')}${card('🛤','Écartement',esc(GAUGES[m.g].split(' (')[0]))}${card('👥','Voyageurs',m.pax+' PAX')}${card('📦','Fret',m.t+' T')}</div>
   <div class="btns">${t.state==='station'?`<button class="go" data-act="departone" data-v="${t.id}" ${e?'disabled':''}>${ico('send',18)} FAIRE PARTIR</button>`:''}<button class="yel" data-act="repair" data-v="${t.id}" ${t.wear<1||t.state==='enroute'?'disabled':''}>🔧 RÉPARER ${fmt$(repairCost(t))}</button>
    <button data-act="auto" data-v="${t.id}">${t.auto?'Pilote auto : ACTIVÉ':'Pilote auto (30 pts)'}</button></div>
   ${e?`<div class="err">${esc(e)}</div>`:''}
   ${t.state!=='pending'&&t.route?`<label class="switch"><span>EN SERVICE</span><input type="checkbox" data-svc="${t.id}" ${t.state!=='yard'?'checked':''} ${t.state==='enroute'?'disabled':''}><i></i></label>`:''}
   ${live}
   ${m.pax?`<h4 class="sec">CONTRÔLEURS</h4><div class="stepper"><button data-act="ctrl" data-v="${t.id}" data-d="-1" ${ctrl<=0?'disabled':''}>−</button><b>${ctrl} 👮</b><button data-act="ctrl" data-v="${t.id}" data-d="1" ${ctrl>=4?'disabled':''}>+</button>
     <span class="mut">${p?`Fraude estimée ${p.pax?Math.round(p.fraud/p.pax*100):0} % · ${p.caught} verbalisés (+${fmt$(p.fines)}) · salaire ${fmt$(p.ctrlCost)} par trajet`:'Les contrôleurs verbalisent les voyageurs sans billet (amende '+fmt$(fineOf(r?r.a:G.start))+').'}</span></div>`:''}
   <h4 class="sec">VITESSE</h4><label class="slider"><span>Ajuster la vitesse : <b>${Math.round(spd*100)} %</b> · moins vite = moins de carburant et d'usure</span><input type="range" min="0.6" max="1" step="0.05" value="${spd}" data-spd="${t.id}"></label>
   ${r?`<h4 class="sec band">DONNÉES D'ITINÉRAIRE</h4><div class="dlistx"><div>📍 ${esc(stationName(r.a))} → ${esc(stationName(r.b))}</div><div>${m.kind==='frt'?'📦 OPÉRATION FRET':'👥 OPÉRATION VOYAGEURS'}</div>
     <div class="two"><div>↔ ${g?Math.round(g.km):0} km</div><div>⦿ ${g?g.out.stops.length:0} arrêts</div></div>
     <button class="edit" data-act="editroute" data-v="${r.id}">MODIFIER LES ARRÊTS ✎</button><div class="stoptext">${g?g.out.stops.map(s=>esc(stationName(s.code).toUpperCase())).join(' → '):''}</div>
     <button class="edit" data-act="editroute" data-v="${r.id}"><span style="color:${r.color}">●</span> ${esc(r.name)} ✎</button></div>`:`<button class="go wide" data-act="assign" data-v="${t.id}">AFFECTER UN ITINÉRAIRE</button>`}
   ${last}
   ${t.state!=='enroute'&&t.state!=='pending'?`<button class="danger wide" data-act="sell" data-v="${t.id}">VENDRE ${fmt$(Math.round((m.price||0)*0.5*(1-t.wear/200)))}</button>`:''}`); }
function mRoute(id){ startEdit(id); return mRouteEdit(); }
function mStation(c){ const s=STATIONS[c], rs=G.routes.filter(r=>geom(r)&&geom(r).out.stops.some(x=>x.code===c));
  return sheet(esc(s.n.toUpperCase()),`<div class="kpi"><div><span>Pays</span><b>${esc(COUNTRIES[s.c][0])}</b></div><div><span>Habitants</span><b>${s.p>=1?s.p+' M':Math.round(s.p*1000)+' k'}</b></div>
   <div><span>Voyageurs en attente</span><b>${Math.round(poolNow(c)).toLocaleString('fr')} / ${poolMax(c).toLocaleString('fr')}</b></div><div><span>Ressource</span><b>${s.mine?esc(s.res)+' ('+s.mine+' kt/sem)':s.port?(s.port>=0.6?'Port maritime':'Port fluvial'):'—'}</b></div></div>
   ${rs.length?'<h4 class="sec">VOS LIGNES</h4>'+rs.map(r=>`<div class="unit" data-act="route" data-v="${r.id}"><i class="cb" style="background:${r.color}"></i><div><b>${esc(r.name)}</b> · ${esc(stationName(r.a))} ⇄ ${esc(stationName(r.b))}</div></div>`).join(''):''}
   ${!NET.adj[c].length?'<div class="mut">Pas de voie ferrée dans cette ville (pour l\'instant).</div>':G.hubs.includes(c)?`<div class="hubok">⭐ Hub de votre compagnie · ${esc([...gaugesAt(c)].map(g=>GAUGES[g]).join(', '))}</div><button class="go wide" data-act="routefrom" data-v="${c}">CRÉER UN ITINÉRAIRE D'ICI</button>`
     :`<div class="mut">Établissez un hub ici pour y ouvrir des lignes. Écartement local : ${esc([...gaugesAt(c)].map(g=>GAUGES[g]).join(', ')||'—')}.</div><button class="go wide" data-act="hub" data-v="${c}">⭐ ÉTABLIR UN HUB · ${fmt$(hubCost(c))}</button>`}`); }
function mWorld(){ return sheet('MONDE',`<h4 class="sec">VOS HUBS (${G.hubs.length})</h4><div class="hubs">${G.hubs.map(c=>`<button class="hubchip" data-act="fly" data-v="${c}">⭐ ${esc(stationName(c))}<small>${esc(COUNTRIES[STATIONS[c].c][0])}</small></button>`).join('')}</div>
   <button data-act="globe" class="go wide">VOIR TOUTES MES LIGNES</button>
   <h4 class="sec">RÉGIONS</h4><div class="regions">${MAP_REGIONS.map((r,i)=>`<button data-act="region" data-v="${i}">${esc(r[0])}</button>`).join('')}</div>
   <h4 class="sec">GRANDS HUBS À ÉTABLIR</h4><div class="mut">Touchez une ville sur la carte pour y établir un hub. Quelques idées :</div>
   ${START_CITIES.filter(c=>!G.hubs.includes(c)).slice(0,24).map(c=>`<div class="unit"><div><b>${esc(stationName(c))}</b><div class="mut">${esc(COUNTRIES[STATIONS[c].c][0])} · ${esc([...gaugesAt(c)].map(g=>GAUGES[g]).join(', '))}</div></div><button data-act="fly" data-v="${c}">Voir</button><button class="go" data-act="hub" data-v="${c}">${fmt$(hubCost(c))}</button></div>`).join('')}`); }
function mNewGame(){ return sheet('HAKVISION RAIL',`<p>Bâtissez votre compagnie de chemin de fer au Congo, puis dans le monde entier.</p><label>Nom de votre compagnie<input id="ng-name" value="Hakvision Rail" maxlength="30"></label>
   <label>Premier hub<select id="ng-start">${START_CITIES.map(c=>`<option value="${c}">${esc(stationName(c))} (${esc(COUNTRIES[STATIONS[c].c][0])})</option>`).join('')}</select></label><div class="mut">Vous pourrez établir d'autres hubs partout dans le monde.</div><button class="go wide" data-act="startgame">COMMENCER</button>`,'',true); }

/* ---------- actions ---------- */
function toast(t,kind){ const box=$('#toasts'); if(box.children.length>3) box.firstChild.remove(); const d=document.createElement('div'); d.className='toast '+(kind||''); d.textContent=t; box.appendChild(d); setTimeout(()=>d.remove(),3800); }
function armed(b,label){ if(b.dataset.armed==='1') return true; b.dataset.armed='1'; b.dataset.old=b.innerHTML; b.textContent=label; setTimeout(()=>{ if(b.isConnected){ b.dataset.armed=''; b.innerHTML=b.dataset.old; } },4000); return false; }
const res=(e,okMsg)=>{ if(e) toast(e,'bad'); else if(okMsg) toast(okMsg); return !e; };
const ACT={
  drawer:()=>{ UI.drawer=!UI.drawer; renderDrawer(); }, dtab:b=>{ UI.dtab=b.dataset.v; renderDrawer(); },
  open:b=>openModal(b.dataset.v), close:()=>closeModal(), mtab:b=>{ UI.mtab[b.dataset.k]=b.dataset.v; UI.model=null; renderModal(); },
  ff:b=>{ UI.fleetFilter=b.dataset.v; renderModal(); }, model:b=>{ UI.model=b.dataset.v||null; renderModal(); },
  train:b=>openModal('train',+b.dataset.v), route:b=>openModal('route',+b.dataset.v),
  assign:b=>{ const t=trainById(+b.dataset.v); if(t.route) startEdit(t.route); else startEdit(null,t.id); },
  routefrom:b=>{ const c=b.dataset.v, tr=G.trains.find(t=>(t.state==='yard'||t.state==='station')&&reachable(c,MODELS[t.model]).size); if(!tr){ toast('Aucun train libre ne peut rouler ici : commandez-en un adapté.','bad'); return; } startEdit(null,tr.id,c); },
  mkroute:()=>{ const f=UI.form; if(res(createRoute(f.train,f.a,f.b,f.stop,f.name.trim()),'Itinéraire créé ! Faites partir le train depuis « À la gare ».')){ f.name=''; drawRoutes(); updateTrains(); fitAll(); closeModal(); UI.drawer=true; UI.dtab='station'; renderDrawer(); saveAll(); } },
  delroute:b=>{ if(!armed(b,'Confirmer ?')) return; if(res(deleteRoute(+b.dataset.v),'Ligne supprimée.')){ closeModal(); drawRoutes(); renderDrawer(); saveAll(); } },
  zoomroute:b=>{ const r=routeById(+b.dataset.v); closeModal(); fitCoords(legLine(geom(r).out)); },
  departsel:()=>{ const ids=UI.sel.size?[...UI.sel]:trainsIn('station').filter(t=>!canDepart(t)).map(t=>t.id); const r=departMany(ids); UI.sel.clear();
    if(r.ok) toast(r.ok+' train(s) parti(s) !'); if(r.err) toast(r.err,'bad'); renderDrawer(); updateTrains(); saveAll(); },
  departone:b=>{ if(res(depart(trainById(+b.dataset.v)),'Départ !')){ closeModal(); renderDrawer(); updateTrains(); saveAll(); } },
  buy:b=>{ const k=b.dataset.v; if(res(buyTrain(k),MODELS[k].name+' commandé : livraison dans quelques minutes.')){ renderModal(); renderDrawer(); saveAll(); } },
  sell:b=>{ if(!armed(b,'Confirmer la vente ?')) return; if(res(sellTrain(trainById(+b.dataset.v)),'Train vendu.')){ closeModal(); drawRoutes(); renderDrawer(); saveAll(); } },
  repair:b=>{ if(res(repair(trainById(+b.dataset.v)),'Train réparé.')){ renderModal(); saveAll(); } },
  repairall:()=>{ let n=0; for(const t of G.trains) if(t.state!=='enroute'&&t.wear>=1&&!repair(t)) n++; toast(n+' train(s) réparé(s).'); renderModal(); saveAll(); },
  auto:b=>{ const t=trainById(+b.dataset.v), was=t.auto; if(res(setAuto(t,!was),was?'Pilote automatique désactivé.':'Pilote automatique activé.')){ renderModal(); saveAll(); } },
  fuel:b=>{ if(res(buyFuel(b.dataset.k,+b.dataset.v),'Réservoir rempli.')){ renderModal(); saveAll(); } },
  claim:b=>{ if(res(claim(b.dataset.v),'Points gagnés !')){ renderModal(); saveAll(); } },
  shop:b=>{ if(res(shopBuy(b.dataset.v),'Achat effectué.')){ renderModal(); renderDrawer(); saveAll(); } },
  borrow:b=>{ if(res(borrow(+b.dataset.v),'Emprunt accordé.')){ renderModal(); saveAll(); } }, repay:b=>{ if(res(repay(+b.dataset.v),'Remboursé.')){ renderModal(); saveAll(); } },
  rename:()=>{ const v=$('#co-name').value.trim(); if(v){ G.name=v; saveAll(); toast('Compagnie renommée.'); renderModal(); } },
  savenow:()=>{ saveAll(); toast('Partie sauvegardée.'); renderModal(); },
  export:()=>{ const name='hakvision-rail.json', data=JSON.stringify(G); if(CLOUD.dl){ CLOUD.dl.save({filename:name,data}).catch(()=>{}); return; }
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([data],{type:'application/json'})); a.download=name; a.click(); },
  import:()=>{ const i=document.createElement('input'); i.type='file'; i.accept='.json'; i.onchange=()=>{ const fr=new FileReader(); fr.onload=()=>{ try{ if(!adopt(JSON.parse(fr.result))) throw 0; saveAll(); toast('Partie importée.'); closeModal(); fullRedraw(); }catch(e){ toast('Fichier invalide.','bad'); } }; fr.readAsText(i.files[0]); }; i.click(); },
  reset:b=>{ if(!armed(b,'Effacer la partie ? Cliquez encore')) return; openModal('newgame'); },
  startgame:()=>{ newGame($('#ng-name').value.trim()||'Hakvision Rail',$('#ng-start').value); UI.form.a=G.start; UI.sel.clear(); closeModal(); saveAll(); fullRedraw(); flyTo(STATIONS[G.start].la,STATIONS[G.start].lo,6.5); openModal('help'); },
  newroute:()=>startEdit(null,UI.form.train,UI.form.a),
  editroute:b=>startEdit(+b.dataset.v),
  saveroute:()=>{ const E=UI.edit, opt={stops:E.stops,direct:E.direct,name:E.name.trim()||undefined,color:E.color};
    if(E.id){ if(res(updateRoute(E.id,{a:E.a,b:E.b,stops:E.stops,direct:E.direct,name:opt.name||routeById(E.id).name,color:E.color}),'Itinéraire mis à jour.')){ closeModal(); drawRoutes(); renderDrawer(); updateTrains(); saveAll(); } return; }
    if(res(createRoute(E.train,E.a,E.b,opt),'Ligne créée ! Faites partir le train depuis « À la gare ».')){ drawRoutes(); updateTrains(); fitAll(); closeModal(); UI.drawer=true; UI.dtab='station'; renderDrawer(); saveAll(); } },
  stopsall:()=>{ const E=UI.edit; E.stops=pathOf(E.a,E.b,editModel()).nodes.slice(); renderModal(); },
  stopsbig:()=>{ const E=UI.edit; E.stops=pathOf(E.a,E.b,editModel()).nodes.filter(c=>c===E.a||c===E.b||STATIONS[c].p>=0.3||G.hubs.includes(c)); renderModal(); },
  stopsnone:()=>{ const E=UI.edit; E.stops=[E.a,E.b]; renderModal(); },
  color:b=>{ UI.edit.color=b.dataset.v; renderModal(); },
  ctrl:b=>{ const t=trainById(+b.dataset.v); t.ctrl=Math.max(0,Math.min(4,ctrlOf(t)+ +b.dataset.d)); renderModal(); saveAll(); },
  unpark:b=>{ if(res(setService(trainById(+b.dataset.v),true),'Train remis en service.')){ renderDrawer(); updateTrains(); saveAll(); } },
  pax:b=>{ Object.assign(PAXUI,{id:+b.dataset.v,which:b.dataset.w||'trip',f:'all',st:'',q:'',n:40,open:null}); openModal(MODELS[trainById(+b.dataset.v).model].kind==='frt'?'cargo':'pax'); },
  paxf:b=>{ PAXUI.f=b.dataset.v; PAXUI.n=40; renderModal(); }, paxmore:()=>{ PAXUI.n+=60; renderModal(); },
  paxo:b=>{ const id=+b.dataset.v; PAXUI.open=PAXUI.open===id?null:id; renderModal(); },
  hub:b=>{ const c=b.dataset.v; if(res(buyHub(c),'⭐ Hub établi à '+stationName(c)+' !')){ UI.form.a=c; drawStations(); renderModal(); saveAll(); } },
  fly:b=>{ const s=STATIONS[b.dataset.v]; closeModal(); flyTo(s.la,s.lo,7.5); setTimeout(()=>openModal('station',b.dataset.v),1100); },
  region:b=>{ const r=MAP_REGIONS[+b.dataset.v]; closeModal(); flyTo(r[1],r[2],r[3]+0.3); },
  zin:()=>mapZoom(1), zout:()=>mapZoom(-1), globe:()=>{ closeModal(); fitAll(); }, rails:()=>{ railsOn=!railsOn; drawRails(); toast(railsOn?'Voies affichées.':'Voies masquées.'); },
  view3d:b=>{ const on=toggle3D(); b.classList.toggle('on',on); toast(on?'Vue 3D inclinée (glissez avec deux doigts pour tourner).':'Vue 2D.'); }
};
document.addEventListener('click',e=>{ if(e.target.closest('[data-stop]')) return; const b=e.target.closest('[data-act]'); if(!b||b.disabled) return; e.preventDefault(); if(ACT[b.dataset.act]) ACT[b.dataset.act](b); if(G) renderTop(); });
document.addEventListener('change',e=>{ const t=e.target;
  if(t.dataset.sel){ const id=+t.dataset.sel; if(t.checked) UI.sel.add(id); else UI.sel.delete(id); renderDrawer(); return; }
  if(t.dataset.selall){ for(const tr of trainsIn('station')) if(t.checked) UI.sel.add(tr.id); else UI.sel.delete(tr.id); renderDrawer(); return; }
  if(t.dataset.f){ const k=t.dataset.f; UI.form[k]=k==='train'?+t.value:t.value; if(k!=='name') renderModal(); return; }
  if(t.dataset.pst){ PAXUI.st=t.value; PAXUI.n=40; renderModal(); return; }
  if(t.dataset.e){ const E=UI.edit, k=t.dataset.e; if(k==='direct') E.direct=t.checked; else if(k==='name'){ E.name=t.value; return; } else { E[k]=k==='train'?+t.value:t.value; E.stops=null; if(k==='a') UI.form.a=t.value; } renderModal(); return; }
  if(t.dataset.stop2){ const E=UI.edit, c=t.dataset.stop2; if(t.checked){ if(!E.stops.includes(c)) E.stops.push(c); } else E.stops=E.stops.filter(x=>x!==c); renderModal(); return; }
  if(t.dataset.svc){ const tr=trainById(+t.dataset.svc); if(res(setService(tr,t.checked),t.checked?'Train en service.':'Train mis au garage.')){ renderDrawer(); updateTrains(); saveAll(); } renderModal(); return; }
  if(t.dataset.spd){ const tr=trainById(+t.dataset.spd); tr.speed=+t.value; saveAll(); renderModal(); return; }
  if(t.dataset.g==='scale'){ G.scale=+t.value; saveAll(); toast('Vitesse modifiée.'); } });
let paxQT=0; document.addEventListener('input',e=>{ if(e.target.dataset.pq){ PAXUI.q=e.target.value; clearTimeout(paxQT); paxQT=setTimeout(()=>{ renderModal(); const i=document.querySelector('[data-pq]'); if(i){ i.focus(); i.setSelectionRange(i.value.length,i.value.length); } },350); return; } if(e.target.dataset.f==='name') UI.form.name=e.target.value; if(e.target.dataset.e==='name') UI.edit.name=e.target.value;
  if(e.target.dataset.spd){ const l=e.target.closest('label').querySelector('b'); if(l) l.textContent=Math.round(e.target.value*100)+' %'; } });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&UI.modal&&UI.modal.name!=='newgame') closeModal(); });

/* ---------- sauvegarde en ligne (compte claude.ai) + navigateur ---------- */
const CLOUD={ref:null,busy:false,at:0,err:'',dl:null};
async function cloudInit(){ try{ if(!window.claude||!window.claude.use) return null;
    const [db,user]=await Promise.all([window.claude.use('db'),window.claude.use('user')]); window.claude.use('downloads').then(d=>{ CLOUD.dl=d; }).catch(()=>{});
    if(!db||!user) return null; const id=await user.id(); if(!id) return null; CLOUD.ref=db.doc('data/users/'+id+'/saves/game');
    const s=await CLOUD.ref.get(); if(!s.exists) return null; const d=s.data(); return d&&d.json?JSON.parse(d.json):null; }catch(e){ CLOUD.err=(e&&e.code)||'erreur'; return null; } }
async function cloudSave(){ if(!CLOUD.ref||CLOUD.busy||!G||G._fresh) return; CLOUD.busy=true;
  try{ await CLOUD.ref.set({json:JSON.stringify(G),at:now(),v:SAVE_V}); CLOUD.at=now(); CLOUD.err=''; }catch(e){ CLOUD.err=(e&&e.code)||'erreur'; } CLOUD.busy=false; renderSaved(); }
function saveAll(){ save(); cloudSave(); renderSaved(); }
function saveText(){ const t=Math.max(CLOUD.at,SAVE_INFO.at); if(CLOUD.err) return 'Sauvegarde en ligne impossible ('+CLOUD.err+')'+(SAVE_INFO.local?' ; sauvegarde dans le navigateur OK.':'.');
  if(!t) return 'Pas encore sauvegardé.'; return (CLOUD.at?'Sauvegardé dans votre compte':'Sauvegardé dans ce navigateur')+' à '+new Date(t).toLocaleTimeString('fr',{hour:'2-digit',minute:'2-digit'})+'.'; }
function renderSaved(){ const el=$('#saved'); if(!el) return; const ok=CLOUD.at||SAVE_INFO.at; el.textContent=ok?'💾':'⚠️'; el.title=saveText(); }

/* ---------- démarrage et boucle ---------- */
function fullRedraw(){ RC.clear(); drawRoutes(); renderTop(); renderDrawer(); updateTrains(); }
function arrivalToasts(arr){ if(arr.length>3){ toast(arr.length+' trains arrivés : +'+fmt$(arr.reduce((s,t)=>s+(t.lastRev||0),0)),'money'); return; }
  for(const t of arr){ const r=routeOfTrain(t); toast('+'+fmt$(t.lastRev||0)+' · '+(r?r.name+' à '+stationName(t.at==='a'?r.a:r.b):t.name),'money'); } }
function boot(){
  const had=load(); if(!had){ newGame('Hakvision Rail','KIN'); G._fresh=true; }
  initMap(); renderTop(); renderDrawer(); updateTrains();
  if(had){ const arr=tick(); if(arr.length) toast('Pendant votre absence : '+arr.length+' arrivée(s), +'+fmt$(arr.reduce((s,t)=>s+(t.lastRev||0),0)),'money'); if(dailyBonus()) toast('Bonus du jour : +10 points'); fitAll(); updateTrains(); }
  else { $('#modal').innerHTML=sheet('HAKVISION RAIL','<p>Recherche de votre sauvegarde…</p>','',true); $('#modal').hidden=false; }
  cloudInit().then(o=>{ if(o&&(!had||(o.savedAt||0)>(G.savedAt||0))&&adopt(o)){ closeModal(); tick(); fullRedraw(); fitAll(); toast('Partie reprise.'); save(); }
    else if(!had) openModal('newgame'); else cloudSave(); renderSaved(); });
  let lastDrawer=0, lastModal=0;
  setInterval(()=>{ if(!G||G._fresh) return; const arr=tick(); chargeInterest(); if(arr.length){ arrivalToasts(arr); renderDrawer(); saveAll(); }
    updateTrains(); renderTop(); const n=performance.now();
    if(UI.drawer&&n-lastDrawer>(UI.dtab==='station'?5000:1000)){ lastDrawer=n; renderDrawer(); }
    const busy=document.activeElement&&['SELECT','INPUT'].includes(document.activeElement.tagName);
    if(UI.modal&&!busy&&n-lastModal>4000&&['train','service','fuel','finance','company','check'].includes(UI.modal.name)){ lastModal=n; renderModal(); } },500);
  setInterval(()=>{ if(G&&!G._fresh) saveAll(); },15000);
  document.addEventListener('visibilitychange',()=>{ if(!G||G._fresh) return; if(document.hidden) saveAll(); else { const arr=tick(); if(arr.length) arrivalToasts(arr); renderDrawer(); } });
  window.addEventListener('pagehide',()=>{ if(G&&!G._fresh) save(); }); }
window.addEventListener('DOMContentLoaded',boot);
