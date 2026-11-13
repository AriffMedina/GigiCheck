import type { IncomingMessage, ServerResponse } from 'node:http';
import { handlerFromEnv } from '../src/config.js';

// Vercel terminates TLS at its edge, so the self-hosted TLS check in index.ts does not apply here.
function load() {
  try {
    return handlerFromEnv().handler;
  } catch {
    // Configuration errors can contain credentials; only a fixed code is logged.
    console.error('server_start_failed: review server configuration');
    return null;
  }
}
const handler = load();

export default function identify(request: IncomingMessage, response: ServerResponse) {
  if (!handler) {
    response.statusCode = 503;
    response.end(JSON.stringify({ error: 'service_unconfigured' }));
    return;
  }
  // The handler routes on the public path; Vercel's rewrite may expose the function path instead.
  request.url = '/v1/identify-product';
  return handler(request, response);
}

export const config = { maxDuration: 35 };
