/* Build replaces the version and complete Vite asset list. No user data is cached here. */
const CACHE_NAME = 'gigicheck-shell-__GIGI_VERSION__';
const PRECACHE = ["__GIGI_PRECACHE__"];
const scoped = path => new URL(path, self.registration.scope).href;

self.addEventListener('install', event => {
  const assets = PRECACHE[0] === '__GIGI_PRECACHE__' ? ['./', './index.html'] : PRECACHE;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    for (const asset of assets) {
      const url = scoped(asset);
      const response = await fetch(url, { redirect: 'error', cache: 'reload' });
      if (!response.ok || response.type !== 'basic' || response.redirected
        || new URL(response.url).origin !== self.location.origin) throw new Error('shell_asset_unavailable');
      await cache.put(url, response);
    }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith('gigicheck-shell-') && name !== CACHE_NAME) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin
    || request.headers.has('Authorization') || /\/(v1|api)\//.test(url.pathname)) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try { return await fetch(request); }
      catch {
        const cache = await caches.open(CACHE_NAME);
        const shell = await cache.match(scoped('./index.html'));
        return shell ?? Response.error();
      }
    })());
    return;
  }
  if (!['script', 'style', 'font', 'image', 'manifest'].includes(request.destination)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.status === 200 && response.type === 'basic' && !response.redirected
      && new URL(response.url).origin === self.location.origin) {
      await cache.put(request, response.clone());
    }
    return response;
  })());
});
