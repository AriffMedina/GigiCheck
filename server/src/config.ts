import { z } from 'zod';
import { createHandler } from './app.js';
import { geminiProvider, mockProvider } from './provider.js';
import { devicesSchema } from './security.js';

/** Thrown with only the variable name, never its value, so it is safe to log and return. */
export class ConfigError extends Error {}

function read<T>(name: string, parse: () => T): T {
  try {
    return parse();
  } catch {
    throw new ConfigError(name);
  }
}

/** Builds the request handler from environment variables; shared by the Node server and the Vercel function. */
export function handlerFromEnv(env: NodeJS.ProcessEnv = process.env) {
  const production = env.NODE_ENV === 'production';
  const mode = read('AI_MODE', () => z.enum(['mock', 'gemini']).parse(env.AI_MODE?.trim()));
  if (production && mode === 'mock') throw new ConfigError('AI_MODE');
  const devices = read('DEVICE_TOKENS_JSON', () => devicesSchema.parse(JSON.parse(env.DEVICE_TOKENS_JSON ?? '[]')));
  const allowedOrigins = read('CORS_ORIGINS_JSON', () => z.array(z.url().refine(value => {
    const url = new URL(value);
    return url.origin === value && (url.protocol === 'https:' || (!production && url.protocol === 'http:'));
  })).max(20).parse(JSON.parse(env.CORS_ORIGINS_JSON ?? '[]')));
  const provider = mode === 'mock' ? mockProvider() : geminiProvider(
    read('GEMINI_API_KEY', () => z.string().trim().min(1).parse(env.GEMINI_API_KEY)),
    read('GEMINI_MODEL', () => z.string().trim().min(1).parse(env.GEMINI_MODEL)),
  );
  return { mode, production, handler: createHandler({ devices, provider, mode, allowedOrigins }) };
}
