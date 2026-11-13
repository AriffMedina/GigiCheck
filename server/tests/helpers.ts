import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import sharp from 'sharp';
import { createHandler } from '../src/app.js';
import type { Provider } from '../src/contracts.js';
import { mockProvider } from '../src/provider.js';

export const token = 'test-only-device-token-not-a-real-secret-0000';
export const device = { id: 'test-device', sha256: createHash('sha256').update(token).digest('hex'), enabled: true };

export async function fixture(options: { provider?: Provider; enabled?: boolean; timeoutMs?: number; allowedOrigins?: string[] } = {}) {
  const server = createServer(createHandler({ devices: [{ ...device, enabled: options.enabled ?? true }],
    provider: options.provider ?? mockProvider(), mode: 'mock', timeoutMs: options.timeoutMs ?? 30_000,
    allowedOrigins: options.allowedOrigins ?? [] }));
  server.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  // A TCP server listening on a TCP port always exposes AddressInfo here.
  const address = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${address.port}/v1/identify-product`,
    close: () => new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
      server.closeAllConnections();
    }),
  };
}

export async function form(fields: Record<string, string> = {}, type = 'image/jpeg', image?: Uint8Array) {
  const body = new FormData();
  const bytes = image ?? await sharp({ create: { width: 2, height: 2, channels: 3, background: '#ffffff' } }).jpeg().toBuffer();
  body.append('image', new Blob([new Uint8Array(bytes)], { type }), 'test.jpg');
  for (const [key, value] of Object.entries({ requestId: 'request-1', draftId: 'draft-1', imageRevision: '2', schemaVersion: '1', ...fields })) {
    body.append(key, value);
  }
  return body;
}

export function headers() { return { Authorization: `Bearer ${token}` }; }
