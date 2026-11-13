import type { IncomingMessage, ServerResponse } from 'node:http';
import { ApiError, resultSchema } from './contracts.js';
import type { Provider } from './contracts.js';
import { parseRequest } from './request.js';
import { authenticate, Limits } from './security.js';
import type { Device } from './security.js';

export interface AppOptions {
  devices: readonly Device[];
  provider: Provider;
  mode: 'mock' | 'gemini';
  timeoutMs?: number;
  allowedOrigins?: readonly string[];
}

export function createHandler(options: AppOptions) {
  const limits = new Limits();
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-GigiCheck-Mode', options.mode);
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Vary', 'Origin');
    let release: (() => void) | undefined;
    let requestId: string | undefined;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 30_000);
    const onClose = () => { if (!response.writableEnded) controller.abort(); };
    response.once('close', onClose);
    try {
      const origin = request.headers.origin;
      if (origin && !options.allowedOrigins?.includes(origin)) throw new ApiError(403, 'origin_forbidden');
      if (origin) {
        response.setHeader('Access-Control-Allow-Origin', origin);
        response.setHeader('Access-Control-Expose-Headers', 'X-GigiCheck-Mode');
      }
      if (request.url !== '/v1/identify-product') throw new ApiError(404, 'not_found');
      if (request.method === 'OPTIONS' && origin) {
        response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
        response.statusCode = 204;
        response.end();
        return;
      }
      if (request.method !== 'POST') throw new ApiError(405, 'method_not_allowed');
      const device = authenticate(request.headers.authorization, options.devices);
      release = limits.acquire(device, 'active');
      const { metadata, image } = await parseRequest(request, controller.signal);
      requestId = metadata.requestId;
      if (controller.signal.aborted) throw new ApiError(504, 'identification_timeout');
      const aborted = new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => reject(new ApiError(504, 'identification_timeout')), { once: true });
      });
      const result = resultSchema.parse(await Promise.race([options.provider(image, controller.signal), aborted]));
      response.statusCode = 200;
      response.end(JSON.stringify({ requestId, imageRevision: metadata.imageRevision, ...result }));
    } catch (error) {
      const failure = error instanceof ApiError ? error : new ApiError(502, 'identification_failed');
      response.statusCode = failure.status;
      if (failure.status === 405) response.setHeader('Allow', 'POST');
      if (failure.status === 429) response.setHeader('Retry-After', '60');
      response.setHeader('Connection', 'close');
      response.end(JSON.stringify({ error: { code: failure.code, ...(requestId ? { requestId } : {}) } }));
      request.resume();
    } finally {
      clearTimeout(timer);
      response.off('close', onClose);
      release?.();
    }
  };
}
