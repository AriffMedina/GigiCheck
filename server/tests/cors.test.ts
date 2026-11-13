import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fixture } from './helpers.js';

test('PWA preflight permits only exact configured origins and headers', async () => {
  const origin = 'https://gigicheck.example';
  const app = await fixture({ allowedOrigins: [origin] });
  try {
    const allowed = await fetch(app.url, { method: 'OPTIONS', headers: { Origin: origin,
      'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' } });
    assert.equal(allowed.status, 204);
    assert.equal(allowed.headers.get('access-control-allow-origin'), origin);
    assert.equal(allowed.headers.get('access-control-allow-headers'), 'Authorization, Content-Type');
    assert.equal(allowed.headers.get('access-control-allow-credentials'), null);
    const denied = await fetch(app.url, { method: 'OPTIONS', headers: { Origin: `${origin}.attacker.test` } });
    assert.equal(denied.status, 403);
    assert.equal(denied.headers.get('access-control-allow-origin'), null);
  } finally { await app.close(); }
});
