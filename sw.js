/* Service worker : « réseau d'abord » pour toujours avoir la dernière version, cache en secours (hors-ligne). */
const CACHE='hakvision-rail-v1.1.0';
const FILES=['./','index.html','vendor/leaflet.js','vendor/leaflet.css','world.js','data.js','network.js','sim.js','ui.js','manifest.json','icons/icon-192.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{ const u=new URL(e.request.url); if(e.request.method!=='GET'||u.origin!==location.origin) return;
  e.respondWith(fetch(e.request).then(r=>{ const c=r.clone(); caches.open(CACHE).then(k=>k.put(e.request,c)); return r; }).catch(()=>caches.match(e.request,{ignoreSearch:true}))); });
