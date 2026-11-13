import { createServer as httpServer } from 'node:http';
import { createServer as httpsServer } from 'node:https';
import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { handlerFromEnv } from './config.js';

async function start() {
  const { mode, production, handler } = handlerFromEnv();
  const keyPath = process.env.TLS_KEY_PATH;
  const certificatePath = process.env.TLS_CERT_PATH;
  if (production && (!keyPath || !certificatePath)) throw new Error('Production requires TLS');
  const server = keyPath && certificatePath
    ? httpsServer({ key: await readFile(keyPath), cert: await readFile(certificatePath) }, handler)
    : httpServer(handler);
  server.requestTimeout = 30_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  const port = z.coerce.number().int().min(1).max(65535).parse(process.env.PORT ?? '3001');
  server.listen(port, process.env.HOST ?? '127.0.0.1', () => console.info(`GigiCheck ${mode} listening on ${port}`));
}

start().catch(() => {
  // Configuration errors can contain credentials; only a fixed code is logged.
  console.error('server_start_failed: review server configuration');
  process.exitCode = 1;
});
