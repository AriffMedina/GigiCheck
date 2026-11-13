import type { IncomingMessage, ServerResponse } from 'node:http';
import { ConfigError, handlerFromEnv } from '../src/config.js';

// Vercel terminates TLS at its edge, so the self-hosted TLS check in index.ts does not apply here.
let invalidVariable = 'unknown';
function load() {
  try {
    return handlerFromEnv().handler;
  } catch (error) {
    // Only the variable name is exposed; values can contain credentials.
    if (error instanceof ConfigError) invalidVariable = error.message;
    console.error(`server_start_failed: invalid ${invalidVariable}`);
    return null;
  }
}
const handler = load();

export default function identify(request: IncomingMessage, response: ServerResponse) {
  if (!handler) {
    response.statusCode = 503;
    response.end(JSON.stringify({ error: 'service_unconfigured', variable: invalidVariable }));
    return;
  }
  // The handler routes on the public path; Vercel's rewrite may expose the function path instead.
  request.url = '/v1/identify-product';
  return handler(request, response);
}

export const config = { maxDuration: 35 };
