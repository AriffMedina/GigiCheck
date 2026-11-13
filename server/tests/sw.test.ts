import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('../../web/public/sw.js', import.meta.url), 'utf8');
const origin = 'https://gigicheck.example';
interface WorkerResponse {
  ok: boolean; status: number; type: string; redirected: boolean; url: string;
  clone(): WorkerResponse;
}
interface WorkerEvent {
  waitUntil(promise: Promise<unknown>): void;
  respondWith(promise: Promise<unknown>): void;
  request?: { method: string; url: string; mode: string; destination: string; headers: Headers };
}
function reply(overrides: Partial<WorkerResponse> = {}): WorkerResponse {
  return { ok: true, status: 200, type: 'basic', redirected: false, url: `${origin}/index.html`,
    clone() { return this; }, ...overrides };
}
function worker(fetcher: (url: unknown, options?: RequestInit) => Promise<WorkerResponse>, cached?: WorkerResponse) {
  const listeners = new Map<string, (event: WorkerEvent) => void>();
  const saved: unknown[] = [];
  const cache = { put: async (_key: unknown, value: unknown) => { saved.push(value); }, match: async () => cached };
  runInNewContext(source, {
    self: { location: { origin }, registration: { scope: `${origin}/` },
      addEventListener: (name: string, handler: (event: WorkerEvent) => void) => listeners.set(name, handler) },
    caches: { open: async () => cache }, fetch: fetcher, URL, Response,
  });
  return { saved, dispatch(name: string, request?: WorkerEvent['request']) {
    let operation: Promise<unknown> | undefined;
    const event: WorkerEvent = { waitUntil: promise => { operation = promise; }, respondWith: promise => { operation = promise; } };
    if (request) event.request = request;
    listeners.get(name)?.(event);
    return operation;
  } };
}

test('install rejects auth redirects, opaque responses and HTTP failures without caching them', async () => {
  for (const response of [reply({ redirected: true }), reply({ url: 'https://login.example/' }),
    reply({ type: 'opaque' }), reply({ ok: false, status: 401 })]) {
    const sw = worker(async (_url, options) => { assert.equal(options?.redirect, 'error'); return response; });
    await assert.rejects(async () => { await sw.dispatch('install'); });
    assert.equal(sw.saved.length, 0);
  }
});

test('install precaches the same-origin app shell with redirects disabled', async () => {
  const sw = worker(async (url, options) => {
    assert.equal(options?.redirect, 'error');
    return reply({ url: String(url) });
  });
  await sw.dispatch('install');
  assert.equal(sw.saved.length, 2);
});

test('runtime never caches a redirected authenticated page as a script', async () => {
  const sw = worker(async () => reply({ redirected: true, url: 'https://login.example/' }));
  await sw.dispatch('fetch', { method: 'GET', url: `${origin}/assets/app.js`, mode: 'cors', destination: 'script', headers: new Headers() });
  assert.equal(sw.saved.length, 0);
});

test('API, authorization and POST requests are never intercepted', () => {
  const sw = worker(async () => { throw new Error('Must not fetch'); });
  for (const request of [
    { method: 'POST', url: `${origin}/v1/identify-product`, headers: new Headers() },
    { method: 'GET', url: `${origin}/v1/result`, headers: new Headers() },
    { method: 'GET', url: `${origin}/assets/app.js`, headers: new Headers({ Authorization: 'Bearer private' }) },
  ]) assert.equal(sw.dispatch('fetch', { ...request, mode: 'cors', destination: 'script' }), undefined);
});

test('offline navigation uses the cached shell', async () => {
  const shell = reply();
  const sw = worker(async () => { throw new TypeError('offline'); }, shell);
  const response = await sw.dispatch('fetch', { method: 'GET', url: `${origin}/`, mode: 'navigate', destination: 'document', headers: new Headers() });
  assert.equal(response, shell);
});
