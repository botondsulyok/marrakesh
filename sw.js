// Egyszerű offline gyorsítótár: az oldal és a képek internet nélkül is betöltődnek.
const CACHE = 'marrakesh-v1';
const CORE = ['./', './index.html',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'];
const IMAGES = ['agafay','agafay2','airport','babagnaou','bahia','benyoussef','berber','darelbacha','elbadi',
  'ferblantiers','hammam','jardinsecret','jemaa','jemaaday','kasbahmosque','koutoubia','maisonphoto','majorelle','mellah',
  'menara','ouzoud','rahba','saadian','souks','tajine','tangia','ysl'].map(k => './img/' + k + '.jpg');

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.concat(IMAGES))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // A térkép csempéit nem tároljuk (túl sok lenne)
  if (url.hostname.includes('tile.openstreetmap.org')) return;
  // Az oldal maga: előbb a hálózat (hogy a frissítések megjöjjenek), offline a tárolt változat
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Minden más: előbb a tárolt, utána a hálózat
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok && (url.origin === location.origin || url.hostname.includes('unpkg.com') || url.hostname.includes('fonts.g'))) {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy));
    }
    return r;
  })));
});
