/* Service worker : « réseau d'abord » pour toujours avoir la dernière version, cache en secours (hors-ligne). */
const CACHE='hakvision-rail-v3.1.0';
const FILES=['./','index.html','vendor/maplibre-gl.js','vendor/maplibre-gl.css','mapdata.js','data.js','data-world.js','rails.js','network.js','game.js','map.js','passengers.js','ui.js','manifest.json','icons/icon-192.png','map/packs/manifest.json','map/packs/p0.txt'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{ const u=new URL(e.request.url); if(e.request.method!=='GET'||u.origin!==location.origin) return;
  e.respondWith(fetch(e.request).then(r=>{ const c=r.clone(); caches.open(CACHE).then(k=>k.put(e.request,c)); return r; }).catch(()=>caches.match(e.request,{ignoreSearch:true}))); });
