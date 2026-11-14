/* Service worker : « réseau d'abord » pour avoir la dernière version, cache en secours pour jouer hors ligne. */
const CACHE='ville-v1';
const FILES=['./','index.html','manifest.webmanifest','icons/icon-180.png','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('ville-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
function save(req,res){const c=res.clone();caches.open(CACHE).then(k=>k.put(req,c));return res;}
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin){ // polices Google : cache d'abord
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>save(e.request,res))));
    return;
  }
  e.respondWith(fetch(e.request).then(res=>save(e.request,res)).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('index.html'))));
});
