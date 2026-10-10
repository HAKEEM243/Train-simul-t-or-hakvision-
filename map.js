/* =========================================================
   Hakvision Rail — la carte (MapLibre GL) :
   fond en relief fabriqué pour le jeu (paquets de tuiles servis avec la page), fleuves, lacs, frontières, noms,
   voies ferrées sur leur tracé réel, vos lignes, gares, hubs et trains animés qui suivent les courbes.
   Vue 2D ou inclinée (3D), rotation, zoom fluide.
   ========================================================= */
'use strict';
let map=null, MAP_READY=false, railsOn=true, is3D=false;
const MAPCFG={packs:'map/packs/',fonts:'map/fonts/'};
const EMPTY={type:'FeatureCollection',features:[]};
const fcol=f=>({type:'FeatureCollection',features:f});

/* ---------- tuiles du relief : lues dans des paquets (un fichier = un bloc de tuiles) ---------- */
const PACKS=new Map(); let MANIFEST=null;
const manifest=()=>MANIFEST||(MANIFEST=fetch(MAPCFG.packs+'manifest.json').then(r=>r.json()).catch(()=>({})));
const packKey=(z,x,y)=>z<=4?'p0':`p${z}_${x>>4}_${y>>4}`;
const b64=t=>{ const s=atob(t.trim()), u=new Uint8Array(s.length); for(let i=0;i<s.length;i++) u[i]=s.charCodeAt(i); return u.buffer; };
function loadPack(key){ if(!PACKS.has(key)) PACKS.set(key,fetch(MAPCFG.packs+key+'.txt').then(r=>{ if(!r.ok) throw new Error('pack'); return r.text(); }).then(b64)
  .then(buf=>{ const n=new DataView(buf).getUint32(0,true); return {buf,idx:JSON.parse(new TextDecoder().decode(new Uint8Array(buf,4,n))),base:4+n}; })
  .catch(e=>{ PACKS.delete(key); throw e; })); return PACKS.get(key); }
const BLANK=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='),c=>c.charCodeAt(0)).buffer;
async function tileData(z,x,y){ const m=await manifest(), k=packKey(z,x,y); if(!m[k]) return BLANK;
  try{ const p=await loadPack(k), e=p.idx[z+'/'+x+'/'+y]; return e?p.buf.slice(p.base+e[0],p.base+e[0]+e[1]):BLANK; }catch(err){ return BLANK; } }

/* ---------- icônes dessinées (trains vus du dessus, étoile de hub) ---------- */
function trainIcon(color,frt){ const r=2, W=16*r, H=46*r, c=document.createElement('canvas'); c.width=W; c.height=H; const g=c.getContext('2d');
  g.shadowColor='rgba(0,0,0,.45)'; g.shadowBlur=3*r; g.shadowOffsetY=1*r;
  const cars=frt?4:3, gap=1.5*r, carH=(H-6*r-gap*(cars-1))/cars;
  for(let i=0;i<cars;i++){ const y=3*r+i*(carH+gap); g.fillStyle=i===0?shade(color,-25):color; g.beginPath(); g.roundRect(3*r,y,W-6*r,carH,i===0?[6*r,6*r,2*r,2*r]:2*r); g.fill(); }
  g.shadowColor='transparent';
  for(let i=0;i<cars;i++){ const y=3*r+i*(carH+gap);
    if(frt){ g.fillStyle='rgba(0,0,0,.25)'; for(let k=1;k<4;k++) g.fillRect(4*r,y+k*carH/4,W-8*r,0.8*r); }
    else { g.fillStyle='rgba(235,245,255,.95)'; g.fillRect(5*r,y+(i===0?6*r:2.5*r),W-10*r,carH-(i===0?8.5*r:5*r)); } }
  g.fillStyle='#fff9c4'; g.beginPath(); g.arc(W/2,4.2*r,1.6*r,0,7); g.fill();
  return g.getImageData(0,0,W,H); }
function shade(hex,d){ const n=parseInt(hex.slice(1),16), f=v=>Math.max(0,Math.min(255,v+d)); return `rgb(${f(n>>16)},${f(n>>8&255)},${f(n&255)})`; }
function starIcon(){ const r=2,S=28*r,c=document.createElement('canvas'); c.width=c.height=S; const g=c.getContext('2d'); g.translate(S/2,S/2);
  g.beginPath(); for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, R=i%2?5.5*r:12.5*r; g.lineTo(Math.cos(a)*R,Math.sin(a)*R); } g.closePath();
  g.shadowColor='rgba(0,0,0,.5)'; g.shadowBlur=3*r; g.fillStyle='#ffc93c'; g.fill(); g.shadowColor='transparent'; g.lineWidth=1.6*r; g.strokeStyle='#5b3b00'; g.stroke(); return g.getImageData(0,0,S,S); }
function ensureTrainImg(color,frt){ const id='tr-'+color.slice(1)+(frt?'-f':''); if(!map.hasImage(id)) map.addImage(id,trainIcon(color,frt),{pixelRatio:2}); return id; }

/* ---------- données GeoJSON ---------- */
function tierOf(s){ const p=s.p, cg=s.c==='CD'||s.c==='CG'; const t=p>=8?0:p>=2?1:p>=0.7?2:p>=0.25?3:4; return Math.max(0,t-(cg?1:0)); }
function stationsFC(){ return fcol(Object.values(STATIONS).map(s=>({type:'Feature',geometry:{type:'Point',coordinates:[s.lo,s.la]},properties:{code:s.code,n:s.n,t:tierOf(s),cg:s.c==='CD'||s.c==='CG'?1:0,r:Math.max(2.5,Math.min(7,2.5+Math.sqrt(s.p)*1.2))}}))); }
function railsFC(){ return fcol(NET.edges.filter(e=>!e.ferry).map(e=>({type:'Feature',geometry:{type:'LineString',coordinates:e.line},properties:{hs:e.hs?1:0,d:e.tr>=2?1:0,hv:e.v>=250?1:0}}))
  .concat(NET.edges.filter(e=>e.ferry).map(e=>({type:'Feature',geometry:{type:'LineString',coordinates:e.line},properties:{ferry:1}})))); }
function routesFC(){ const f=[]; for(const r of G.routes){ const g=geom(r); if(!g) continue; f.push({type:'Feature',geometry:{type:'LineString',coordinates:legLine(g.out)},properties:{id:r.id,c:r.color,n:r.name}}); } return fcol(f); }
function stopsFC(){ const f=[], seen=new Set(); for(const r of G.routes){ const g=geom(r); if(!g) continue; for(const s of g.out.stops){ const k=r.id+s.code; if(seen.has(k)) continue; seen.add(k); const st=STATIONS[s.code];
  f.push({type:'Feature',geometry:{type:'Point',coordinates:[st.lo,st.la]},properties:{code:s.code,c:r.color,n:st.n,t:tierOf(st)}}); } } return fcol(f); }
function hubsFC(){ return fcol(G.hubs.map(c=>({type:'Feature',geometry:{type:'Point',coordinates:[STATIONS[c].lo,STATIONS[c].la]},properties:{code:c,n:STATIONS[c].n}}))); }

/* ---------- style de la carte ---------- */
const FONT={reg:['NotoSansRegular'],med:['NotoSansMedium'],ita:['NotoSansItalic']};
function mapStyle(){ const glyphs='hkf://{fontstack}/{range}', relief=(o)=>Object.assign({type:'raster',tiles:['hk://r/{z}/{x}/{y}'],tileSize:256},o);
  const zi=(a,b)=>['interpolate',['linear'],['zoom'],...a.flatMap((v,i)=>[b[i],v])];
  return {version:8,glyphs,
   sources:{relief:relief({maxzoom:6,attribution:'Relief : Mapzen Terrain Tiles (AWS Open Data) · Natural Earth · MapLibre'}),
    r7a:relief({minzoom:7,maxzoom:7,bounds:[-20,-36,55,38]}),r7e:relief({minzoom:7,maxzoom:7,bounds:[-11,35,32,61]}),r8:relief({minzoom:8,maxzoom:8,bounds:[10,-14,32,5]}),
    lakes:{type:'geojson',data:MAPDATA.lakes},rivers:{type:'geojson',data:MAPDATA.rivers},borders:{type:'geojson',data:MAPDATA.borders},labels:{type:'geojson',data:MAPDATA.labels},
    rails:{type:'geojson',data:railsFC()},routes:{type:'geojson',data:EMPTY},stops:{type:'geojson',data:EMPTY},stations:{type:'geojson',data:stationsFC()},hubs:{type:'geojson',data:EMPTY},trains:{type:'geojson',data:EMPTY}},
   layers:[
    {id:'bg',type:'background',paint:{'background-color':'#2c6aa0'}},
    {id:'relief',type:'raster',source:'relief',paint:{'raster-fade-duration':200}},
    {id:'r7a',type:'raster',source:'r7a',minzoom:6.6,paint:{'raster-fade-duration':200}},{id:'r7e',type:'raster',source:'r7e',minzoom:6.6,paint:{'raster-fade-duration':200}},
    {id:'r8',type:'raster',source:'r8',minzoom:7.6,paint:{'raster-fade-duration':200}},
    {id:'lakes',type:'fill',source:'lakes',paint:{'fill-color':'#86bde3','fill-outline-color':'#5e9ccc'}},
    {id:'rivers',type:'line',source:'rivers',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#79b2df','line-opacity':['interpolate',['linear'],['zoom'],2,['case',['<=',['get','r'],4],0.9,0],5,['case',['<=',['get','r'],6],0.9,0.3],7,0.95],
      'line-width':['interpolate',['linear'],['zoom'],2,['case',['<=',['get','r'],3],0.9,0.3],6,['case',['<=',['get','r'],3],2.4,0.9],9,['case',['<=',['get','r'],3],4.5,1.8]]}},
    {id:'borders-halo',type:'line',source:'borders',paint:{'line-color':'rgba(255,255,255,.35)','line-width':zi([2,4.5],[2,8])}},
    {id:'borders',type:'line',source:'borders',paint:{'line-color':'#7d4f86','line-opacity':0.7,'line-width':zi([0.7,1.6],[2,8]),'line-dasharray':[3,2]}},
    {id:'rails-ferry',type:'line',source:'rails',filter:['==',['get','ferry'],1],paint:{'line-color':'#2f5f8a','line-width':1.4,'line-dasharray':[2,2]}},
    {id:'rails-case',type:'line',source:'rails',filter:['!=',['get','ferry'],1],layout:{'line-join':'round','line-cap':'round'},
      paint:{'line-color':['case',['==',['get','hs'],1],'#8a7f72',['==',['get','hv'],1],'#3b2f5c','#3a3a3a'],'line-opacity':['case',['==',['get','hs'],1],0.55,0.85],'line-width':zi([0.8,1.6,3.2,4.8],[2,5,7,10])}},
    {id:'rails-ties',type:'line',source:'rails',minzoom:5.5,filter:['all',['!=',['get','ferry'],1],['!=',['get','hs'],1]],paint:{'line-color':'#fafafa','line-width':zi([0.8,1.8,2.6],[5.5,7,10]),'line-dasharray':[2.2,2.2]}},
    {id:'routes-glow',type:'line',source:'routes',layout:{'line-join':'round','line-cap':'round'},paint:{'line-color':['get','c'],'line-opacity':0.35,'line-blur':4,'line-width':zi([6,12,18],[2,6,10])}},
    {id:'routes',type:'line',source:'routes',layout:{'line-join':'round','line-cap':'round'},paint:{'line-color':['get','c'],'line-width':zi([2.4,4.5,7],[2,6,10])}},
    ...[4,3,2,1,0].map(t=>({id:'st-dot'+t,type:'circle',source:'stations',minzoom:[2,3.4,4.6,5.8,7][t],filter:['==',['get','t'],t],
      paint:{'circle-radius':zi([['*',['get','r'],0.6],['get','r'],['*',['get','r'],1.5]],[3,6,10]),'circle-color':'#ffffff','circle-stroke-color':'#2b2b2b','circle-stroke-width':1.2}})),
    {id:'stops',type:'circle',source:'stops',paint:{'circle-radius':zi([3.5,6,8],[2,6,10]),'circle-color':'#ffffff','circle-stroke-color':['get','c'],'circle-stroke-width':zi([2,3.5,4.5],[2,6,10])}},
    {id:'lbl-region',type:'symbol',source:'labels',filter:['==',['get','k'],'region'],minzoom:3,maxzoom:8,layout:{'text-field':['get','n'],'text-font':FONT.ita,'text-size':zi([11,15],[3,7]),'text-letter-spacing':0.12,'text-transform':'uppercase','text-max-width':8},
      paint:{'text-color':'#6b4f2f','text-halo-color':'rgba(255,250,235,.7)','text-halo-width':1.2,'text-opacity':0.85}},
    {id:'lbl-sea',type:'symbol',source:'labels',filter:['==',['get','k'],'mer'],layout:{'text-field':['get','n'],'text-font':FONT.ita,'text-size':zi([11,16],[2,6]),'text-letter-spacing':0.15,'text-max-width':7},paint:{'text-color':'#d6ecff','text-halo-color':'rgba(20,60,110,.6)','text-halo-width':1}},
    {id:'lbl-country',type:'symbol',source:'labels',filter:['all',['==',['get','k'],'pays'],['<=',['get','z'],5]],maxzoom:8,layout:{'text-field':['get','n'],'text-font':FONT.med,'text-size':zi([10,15,19],[2,4,6]),'text-transform':'uppercase','text-letter-spacing':0.18,'text-max-width':7,
      'symbol-sort-key':['get','z']},paint:{'text-color':'#4a2e55','text-halo-color':'rgba(255,255,255,.75)','text-halo-width':1.5,'text-opacity':['interpolate',['linear'],['zoom'],2,['case',['<=',['get','z'],3],1,0],4,1,7,0.8]}},
    ...[0,1,2,3,4].map(t=>({id:'st-lbl'+t,type:'symbol',source:'stations',minzoom:[2.4,3.6,4.8,6,7.2][t],filter:['==',['get','t'],t],
      layout:{'text-field':['get','n'],'text-font':t<=1?FONT.med:FONT.reg,'text-size':[15,13.5,12.5,11.5,11][t],'text-variable-anchor':['left','right','top','bottom'],'text-radial-offset':0.8,'text-optional':true},
      paint:{'text-color':['case',['==',['get','cg'],1],'#111111','#2a2a2a'],'text-halo-color':'rgba(255,255,255,.92)','text-halo-width':1.6}})),
    {id:'stops-lbl',type:'symbol',source:'stops',minzoom:4.5,layout:{'text-field':['get','n'],'text-font':FONT.med,'text-size':13,'text-variable-anchor':['left','right','top','bottom'],'text-radial-offset':0.9,'text-optional':true,'symbol-sort-key':['get','t']},paint:{'text-color':'#111','text-halo-color':'#fff','text-halo-width':1.8}},
    {id:'hubs',type:'symbol',source:'hubs',layout:{'icon-image':'hub','icon-allow-overlap':true,'icon-size':zi([0.8,1.1],[3,8]),'text-field':['get','n'],'text-font':FONT.med,'text-size':14,'text-anchor':'left','text-offset':[1.2,0],'text-optional':true},
      paint:{'text-color':'#3b2600','text-halo-color':'#ffe9a8','text-halo-width':2}},
    {id:'trains',type:'symbol',source:'trains',layout:{'icon-image':['get','img'],'icon-rotate':['get','b'],'icon-rotation-alignment':'map','icon-pitch-alignment':'map','icon-allow-overlap':true,'icon-ignore-placement':true,
      'icon-size':zi([0.55,0.8,1.15],[3,6,10])}},
    {id:'trains-lbl',type:'symbol',source:'trains',minzoom:6.5,layout:{'text-field':['get','n'],'text-font':FONT.med,'text-size':12,'text-offset':[0,1.8],'text-allow-overlap':false},paint:{'text-color':'#fff','text-halo-color':['get','c'],'text-halo-width':2.5}}
   ]}; }

/* ---------- création de la carte ---------- */
function initMap(){
  if(!window.maplibregl){ document.getElementById('map').innerHTML='<div class="maperr">La carte ne peut pas s\'afficher (WebGL indisponible).</div>'; return; }
  net();
  maplibregl.addProtocol('hkf',async(params)=>{ const m=params.url.match(/^hkf:\/\/([^/]+)\/([\d-]+)/); const r=await fetch(MAPCFG.fonts+decodeURIComponent(m[1]).split(',')[0]+'/'+m[2]+'.txt'); if(!r.ok) throw new Error('glyphs'); return {data:b64(await r.text())}; });
  maplibregl.addProtocol('hk',async(params)=>{ const m=params.url.match(/^hk:\/\/r\/(\d+)\/(\d+)\/(\d+)/); return {data:m?await tileData(+m[1],+m[2],+m[3]):BLANK}; });
  const s=STATIONS[G.start]||STATIONS.KIN;
  map=new maplibregl.Map({container:'map',style:mapStyle(),center:[s.lo,s.la],zoom:5.2,minZoom:1.6,maxZoom:11.5,attributionControl:{compact:true},dragRotate:true,pitchWithRotate:true,maxPitch:70,renderWorldCopies:true});
  map.on('styleimagemissing',e=>{ const id=e.id; if(id==='hub'){ map.addImage('hub',starIcon(),{pixelRatio:2}); } else if(id.startsWith('tr-')){ const p=id.split('-'); map.addImage(id,trainIcon('#'+p[1],p[2]==='f'),{pixelRatio:2}); } });
  map.on('load',()=>{ const at=document.querySelector('.maplibregl-ctrl-attrib'); if(at) at.classList.remove('maplibregl-compact-show'); MAP_READY=true; drawRoutes(); updateTrains(); setInterval(()=>{ if(!document.hidden&&G&&!G._fresh) updateTrains(); },120); });
  const click=(layer,fn)=>{ map.on('click',layer,e=>{ const f=e.features&&e.features[0]; if(f) fn(f.properties); }); map.on('mouseenter',layer,()=>map.getCanvas().style.cursor='pointer'); map.on('mouseleave',layer,()=>map.getCanvas().style.cursor=''); };
  click('trains',p=>openModal('train',+p.id)); click('hubs',p=>openModal('station',p.code)); click('stops',p=>openModal('station',p.code)); click('routes',p=>startEdit(+p.id));
  for(const t of [0,1,2,3,4]){ click('st-dot'+t,p=>openModal('station',p.code)); click('st-lbl'+t,p=>openModal('station',p.code)); }
}
function setData(src,data){ if(!MAP_READY) return; const s=map.getSource(src); if(s) s.setData(data); }
function drawRoutes(){ const st=stopsFC(); setData('routes',routesFC()); setData('stops',st); drawStations();
  if(MAP_READY){ const codes=[...new Set(st.features.map(f=>f.properties.code))];      // pas de doublon : les gares de vos lignes ont déjà leur étiquette
    for(const t of [0,1,2,3,4]) map.setFilter('st-lbl'+t,['all',['==',['get','t'],t],['!',['in',['get','code'],['literal',codes]]]]); } }
function drawStations(){ setData('hubs',hubsFC()); }
function drawRails(){ if(!MAP_READY) return; for(const id of ['rails-case','rails-ties','rails-ferry']) map.setLayoutProperty(id,'visibility',railsOn?'visible':'none'); }
function trainPos(tr){ const r=routeOfTrain(tr); if(!r) return null; const g=geom(r); if(!g) return null;
  if(tr.state==='enroute'){ const leg=g[tr.dir], f=Math.min(1,(now()-tr.dep)/tr.dur); return legPos(leg,f*leg.T); }
  if(tr.state==='station'){ const c=tr.at==='a'?r.a:r.b, leg=g[tr.at==='a'?'out':'ret'], e=leg.edges[0], p=edgePoint(e,leg.nodes[0],0.0001); return {lnglat:[STATIONS[c].lo,STATIONS[c].la],bearing:p[2],at:c}; } return null; }
function trainLL(tr){ const p=trainPos(tr); return p?{ll:[p.lnglat[1],p.lnglat[0]]}:null; }
let TRAIN_COUNT=0;
function updateTrains(){ if(!MAP_READY) return; const f=[];
  for(const tr of G.trains){ const p=trainPos(tr); if(!p) continue; const r=routeOfTrain(tr), frt=MODELS[tr.model].kind==='frt';
    f.push({type:'Feature',geometry:{type:'Point',coordinates:p.lnglat},properties:{id:tr.id,img:'tr-'+r.color.slice(1)+(frt?'-f':''),b:p.bearing||0,n:r.name,c:r.color}}); }
  TRAIN_COUNT=f.length; setData('trains',fcol(f)); }
function boundsOf(pts){ let a=[180,90,-180,-90]; for(const [lo,la] of pts){ a=[Math.min(a[0],lo),Math.min(a[1],la),Math.max(a[2],lo),Math.max(a[3],la)]; } return [[a[0],a[1]],[a[2],a[3]]]; }
function fitCoords(pts,maxZoom){ if(!map||!pts.length) return; if(pts.length===1) return flyTo(pts[0][1],pts[0][0],7); map.fitBounds(boundsOf(pts),{padding:{top:110,bottom:90,left:70,right:110},maxZoom:maxZoom||8,duration:900}); }
function fitAll(){ const pts=G.routes.flatMap(r=>{ const g=geom(r); return g?legLine(g.out):[]; }); if(pts.length) fitCoords(pts); else { const s=STATIONS[G.start]; flyTo(s.la,s.lo,6); } }
function flyTo(la,lo,z){ if(map) map.flyTo({center:[lo,la],zoom:z,duration:1100,essential:true}); }
function toggle3D(){ if(!map) return; is3D=!is3D; map.easeTo({pitch:is3D?58:0,bearing:is3D?-12:0,duration:900}); return is3D; }
function mapZoom(d){ if(map) d>0?map.zoomIn():map.zoomOut(); }
