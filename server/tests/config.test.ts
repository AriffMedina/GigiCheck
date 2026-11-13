import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ConfigError, handlerFromEnv } from '../src/config.js';

const valid = {
  NODE_ENV: 'production', AI_MODE: 'gemini', GEMINI_API_KEY: 'secret-key-value', GEMINI_MODEL: 'model',
  DEVICE_TOKENS_JSON: JSON.stringify([{ id: 'phone', sha256: 'a'.repeat(64), enabled: true }]), CORS_ORIGINS_JSON: '["https://app.example.com"]',
};

test('valid production environment builds a gemini handler', () => {
  assert.equal(handlerFromEnv(valid).mode, 'gemini');
});

test('invalid variables are reported by name without leaking values', () => {
  const cases: Array<[string, Record<string, string>]> = [
    ['AI_MODE', { AI_MODE: 'Gemini ' }],
    ['CORS_ORIGINS_JSON', { CORS_ORIGINS_JSON: 'https://app.example.com/' }],
    ['CORS_ORIGINS_JSON', { CORS_ORIGINS_JSON: '["https://app.example.com/"]' }],
    ['DEVICE_TOKENS_JSON', { DEVICE_TOKENS_JSON: '{secret-key-value' }],
    ['DEVICE_TOKENS_JSON', { DEVICE_TOKENS_JSON: JSON.stringify({ id: 'phone', sha256: 'a'.repeat(64), enabled: true }) }],
    ['GEMINI_API_KEY', { GEMINI_API_KEY: '' }],
  ];
  for (const [name, override] of cases) {
    assert.throws(() => handlerFromEnv({ ...valid, ...override }),
      (e: unknown) => e instanceof ConfigError && e.message === name && !e.message.includes('secret'));
  }
});
