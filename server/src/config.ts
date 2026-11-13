import { z } from 'zod';
import { createHandler } from './app.js';
import { geminiProvider, mockProvider } from './provider.js';
import { devicesSchema } from './security.js';

/** Builds the request handler from environment variables; shared by the Node server and the Vercel function. */
export function handlerFromEnv(env: NodeJS.ProcessEnv = process.env) {
  const production = env.NODE_ENV === 'production';
  const mode = z.enum(['mock', 'gemini']).parse(env.AI_MODE);
  if (production && mode === 'mock') throw new Error('Mock is development-only');
  const devices = devicesSchema.parse(JSON.parse(env.DEVICE_TOKENS_JSON ?? '[]'));
  const allowedOrigins = z.array(z.url().refine(value => {
    const url = new URL(value);
    return url.origin === value && (url.protocol === 'https:' || (!production && url.protocol === 'http:'));
  })).max(20).parse(JSON.parse(env.CORS_ORIGINS_JSON ?? '[]'));
  const provider = mode === 'mock' ? mockProvider() : geminiProvider(
    z.string().min(1).parse(env.GEMINI_API_KEY),
    z.string().min(1).parse(env.GEMINI_MODEL),
  );
  return { mode, production, handler: createHandler({ devices, provider, mode, allowedOrigins }) };
}
