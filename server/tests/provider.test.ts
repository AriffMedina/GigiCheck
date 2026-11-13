import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiError } from '../src/contracts.js';
import { geminiProvider } from '../src/provider.js';

const valid = { status: 'identified', suggestion: { name: 'Producto de prueba', brand: null, presentation: null, category: null, warnings: [] } };
const payload = (result: unknown) => ({ candidates: [{ content: { parts: [{ text: 'hidden reasoning', thought: true }, { text: JSON.stringify(result) }] } }] });

test('real adapter sends only sanitized image and schema, and makes one call', async () => {
  let calls = 0;
  const provider = geminiProvider('test-only-key', 'configured-model', async (url, init) => {
    calls++;
    assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/models/configured-model:generateContent');
    assert.equal(new Headers(init?.headers).get('x-goog-api-key'), 'test-only-key');
    assert.equal(typeof init?.body, 'string');
    const body: unknown = JSON.parse(String(init?.body));
    assert.ok(body && typeof body === 'object');
    assert.equal(Reflect.has(body, 'draftId'), false);
    assert.equal(Reflect.has(body, 'missingQuantity'), false);
    return Response.json(payload(valid));
  });
  assert.deepEqual(await provider(Buffer.from('sanitized-test-image'), new AbortController().signal), valid);
  assert.equal(calls, 1);
});

test('provider refuses schema extras and missing identity instead of passing them to app', async () => {
  for (const result of [{ ...valid, missingQuantity: 20 }, { ...valid, suggestion: { ...valid.suggestion, name: null } }]) {
    const provider = geminiProvider('test-only-key', 'configured-model', async () => Response.json(payload(result)));
    await assert.rejects(provider(Buffer.alloc(0), new AbortController().signal), (e: unknown) => e instanceof ApiError && e.status === 502);
  }
});

test('upstream failure has no sensitive response details and is never retried', async () => {
  let calls = 0;
  const provider = geminiProvider('test-only-key', 'configured-model', async () => {
    calls++;
    return new Response('sensitive provider diagnostics', { status: 500 });
  });
  await assert.rejects(provider(Buffer.alloc(0), new AbortController().signal), (e: unknown) => e instanceof ApiError && e.code === 'provider_failed');
  assert.equal(calls, 1);
});

test('rejects oversized provider output before parsing it', async () => {
  const provider = geminiProvider('test-only-key', 'configured-model', async () => new Response('x'.repeat(70 * 1024)));
  await assert.rejects(provider(Buffer.alloc(0), new AbortController().signal), (e: unknown) => e instanceof ApiError && e.status === 502);
});

test('truncated thinking response with no answer text is rejected, and the cap leaves room for thinking', async () => {
  let cap = 0;
  const provider = geminiProvider('test-only-key', 'configured-model', async (_url, init) => {
    const body: unknown = JSON.parse(String(init?.body));
    cap = Number(Reflect.get(Reflect.get(body as object, 'generationConfig') as object, 'maxOutputTokens'));
    return Response.json({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: 'thinking', thought: true }] } }] });
  });
  await assert.rejects(provider(Buffer.alloc(0), new AbortController().signal), (e: unknown) => e instanceof ApiError && e.code === 'provider_invalid_response');
  assert.ok(cap >= 8192);
});

test('blocked response without content is rejected as invalid, not crashed', async () => {
  const provider = geminiProvider('test-only-key', 'configured-model', async () => Response.json({ candidates: [{ finishReason: 'SAFETY' }] }));
  await assert.rejects(provider(Buffer.alloc(0), new AbortController().signal), (e: unknown) => e instanceof ApiError && e.code === 'provider_invalid_response');
});
