const CACHE='hourtoyou-shell-v1';
const FILES=['/','/index.html','/offline.html','/offline.css','/offline.js','/manifest.webmanifest','/logo.svg','/2.jpeg','/images.jpeg','/images.jpg','/style.css','/dashboard.css','/punch.css','/worktime.css','/reports.css','/messages.css','/pwa.css','/dashboard.js','/server-sync.js','/app.js','/punch.js','/worktime.js','/reports.js','/report-logo.js','/profile.js','/messages.js','/pwa.js','/vendor/jszip.min.js','/vendor/pdf-bundle.js','/vendor/pdf-lib.min.js','/vendor/docx.iife.js','/icons/icon-192.png','/icons/icon-512.png','/icons/icon-maskable-512.png','/icons/apple-touch-icon.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('hourtoyou-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;if(request.mode==='navigate'){event.respondWith(fetch(request).catch(async()=>await caches.match('/index.html')||await caches.match('/offline.html')));return;}if(!FILES.includes(url.pathname))return;event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)));}return response;}).catch(()=>caches.match(request)));});



