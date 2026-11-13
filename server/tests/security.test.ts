import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { ApiError, resultSchema } from '../src/contracts.js';
import { sanitizeImage } from '../src/image.js';
import { authenticate, Limits } from '../src/security.js';
import { device, token } from './helpers.js';

test('authenticates only the full bearer token and respects revocation', () => {
  assert.equal(authenticate(`Bearer ${token}`, [device]), device.id);
  assert.throws(() => authenticate(`Bearer ${token}x`, [device]), (error: unknown) => error instanceof ApiError && error.status === 401);
  assert.throws(() => authenticate(`Bearer ${token}`, [{ ...device, enabled: false }]), (error: unknown) => error instanceof ApiError && error.status === 403);
});

test('limits concurrency and 100 daily attempts, resetting by UTC day', () => {
  const limits = new Limits();
  const day = new Date('2026-11-13T12:00:00Z');
  const release = limits.acquire('device', 'draft', day);
  assert.throws(() => limits.acquire('device', 'other-draft', day));
  release();
  for (let i = 1; i < 100; i++) limits.acquire('device', `draft-${i}`, day)();
  assert.throws(() => limits.acquire('device', 'draft', day), (error: unknown) => error instanceof ApiError && error.code === 'daily_quota');
  limits.acquire('device', 'draft', new Date('2026-11-14T00:00:00Z'))();
});

test('re-encodes a valid image and removes EXIF before external processing', async () => {
  const original = await sharp({ create: { width: 4, height: 6, channels: 3, background: '#ffffff' } })
    .jpeg().withExif({ IFD0: { Artist: 'Private test data' } }).toBuffer();
  assert.ok((await sharp(original).metadata()).exif);
  const result = await sanitizeImage(new File([new Uint8Array(original)], 'test.jpg', { type: 'image/jpeg' }));
  assert.equal((await sharp(result).metadata()).exif, undefined);
});

test('downscales phone photos to 1024 px for faster identification without enlarging small ones', async () => {
  const photo = await sharp({ create: { width: 1600, height: 1200, channels: 3, background: '#ffffff' } }).jpeg().toBuffer();
  const resized = await sharp(await sanitizeImage(new File([new Uint8Array(photo)], 'p.jpg', { type: 'image/jpeg' }))).metadata();
  assert.deepEqual([resized.width, resized.height], [1024, 768]);
  const small = await sharp({ create: { width: 400, height: 300, channels: 3, background: '#ffffff' } }).jpeg().toBuffer();
  assert.equal((await sharp(await sanitizeImage(new File([new Uint8Array(small)], 's.jpg', { type: 'image/jpeg' }))).metadata()).width, 400);
});

test('rejects mismatched MIME and oversized dimensions', async () => {
  const jpeg = await sharp({ create: { width: 4, height: 6, channels: 3, background: '#ffffff' } }).jpeg().toBuffer();
  await assert.rejects(sanitizeImage(new File([new Uint8Array(jpeg)], 'test.png', { type: 'image/png' })), (e: unknown) => e instanceof ApiError && e.status === 415);
  const large = await sharp({ create: { width: 1601, height: 1, channels: 3, background: '#ffffff' } }).png().toBuffer();
  await assert.rejects(sanitizeImage(new File([new Uint8Array(large)], 'test.png', { type: 'image/png' })), (e: unknown) => e instanceof ApiError && e.status === 413);
});

test('output contract rejects extras, missing fields, long text and numeric confidence', () => {
  const valid = { status: 'unreadable', suggestion: { name: null, brand: null, presentation: null, category: null, warnings: [] } };
  assert.equal(resultSchema.safeParse(valid).success, true);
  assert.equal(resultSchema.safeParse({ ...valid, missingQuantity: 2 }).success, false);
  assert.equal(resultSchema.safeParse({ ...valid, confidence: 0.9 }).success, false);
  assert.equal(resultSchema.safeParse({ ...valid, suggestion: { ...valid.suggestion, name: 'x'.repeat(201) } }).success, false);
  assert.equal(resultSchema.safeParse({ ...valid, suggestion: { name: null } }).success, false);
});
