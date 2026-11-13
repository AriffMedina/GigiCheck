import assert from 'node:assert/strict';
import { test } from 'node:test';
import { request } from 'node:http';
import { fixture, form, headers } from './helpers.js';

test('rejects missing authentication before invoking a provider', async () => {
  let called = false;
  const app = await fixture({ provider: async () => { called = true; throw new Error(); } });
  try {
    const response = await fetch(app.url, { method: 'POST' });
    assert.equal(response.status, 401);
    assert.equal(called, false);
  } finally { await app.close(); }
});

test('revoked device receives 403', async () => {
  const app = await fixture({ enabled: false });
  try { assert.equal((await fetch(app.url, { method: 'POST', headers: headers() })).status, 403); }
  finally { await app.close(); }
});

test('mock is explicit and echoes correlation without inventing identity or quantity', async () => {
  const app = await fixture();
  try {
    const response = await fetch(app.url, { method: 'POST', headers: headers(), body: await form() });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-gigicheck-mode'), 'mock');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { requestId: 'request-1', imageRevision: 2, status: 'unreadable',
      suggestion: { name: null, brand: null, presentation: null, category: null,
        warnings: ['Simulación de desarrollo; escribe los datos manualmente.'] } });
  } finally { await app.close(); }
});

test('rejects unexpected metadata before calling provider', async () => {
  const app = await fixture();
  try {
    const response = await fetch(app.url, { method: 'POST', headers: headers(), body: await form({ missingQuantity: '5' }) });
    assert.equal(response.status, 400);
  } finally { await app.close(); }
});

test('validates file content and size independently of declared mime', async () => {
  const app = await fixture();
  try {
    const invalid = await fetch(app.url, { method: 'POST', headers: headers(), body: await form({}, 'image/jpeg', new TextEncoder().encode('not a jpeg')) });
    assert.equal(invalid.status, 415);
    const oversized = await fetch(app.url, { method: 'POST', headers: headers(), body: await form({}, 'image/jpeg', new Uint8Array(2 * 1024 * 1024 + 1)) });
    assert.equal(oversized.status, 413);
  } finally { await app.close(); }
});

test('times out once and releases the device for an explicit new request', async () => {
  let calls = 0;
  const app = await fixture({ timeoutMs: 50, provider: async () => { calls++; return new Promise(() => {}); } });
  try {
    const response = await fetch(app.url, { method: 'POST', headers: headers(), body: await form() });
    assert.equal(response.status, 504);
    assert.equal(calls, 1);
    const next = await fetch(app.url, { method: 'POST', headers: headers(), body: await form() });
    assert.equal(next.status, 504);
    assert.equal(calls, 2);
  } finally { await app.close(); }
});

test('deadline interrupts a stalled multipart upload without invoking provider', { timeout: 5000 }, async () => {
  let called = false;
  const app = await fixture({ timeoutMs: 80, provider: async () => { called = true; throw new Error(); } });
  try {
    const status = await new Promise<number | undefined>((resolve, reject) => {
      const client = request(app.url, { method: 'POST', headers: { ...headers(),
        'Content-Type': 'multipart/form-data; boundary=test', 'Content-Length': '1000' } }, response => {
        response.resume();
        resolve(response.statusCode);
        client.destroy();
      });
      client.once('error', reject);
      client.write('--test\r\n');
    });
    assert.equal(status, 504);
    assert.equal(called, false);
  } finally { await app.close(); }
});
