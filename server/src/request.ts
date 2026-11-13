import type { IncomingMessage } from 'node:http';
import { ApiError, metadataSchema } from './contracts.js';
import { IMAGE_LIMIT, sanitizeImage } from './image.js';

const BODY_LIMIT = IMAGE_LIMIT + 16 * 1024;

async function readBody(request: IncomingMessage, signal: AbortSignal): Promise<Buffer> {
  const declared = Number(request.headers['content-length']);
  if (declared > BODY_LIMIT) throw new ApiError(413, 'image_too_large');
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const cleanup = () => {
      request.off('data', onData);
      request.off('end', onEnd);
      request.off('error', onError);
      request.off('aborted', onError);
      signal.removeEventListener('abort', onTimeout);
    };
    const fail = (error: ApiError) => { cleanup(); reject(error); };
    const onTimeout = () => fail(new ApiError(504, 'identification_timeout'));
    const onError = () => fail(new ApiError(400, 'invalid_request'));
    const onEnd = () => { cleanup(); resolve(Buffer.concat(chunks)); };
    const onData = (chunk: Buffer) => {
      size += chunk.length;
      if (size > BODY_LIMIT) {
        chunks.length = 0;
        fail(new ApiError(413, 'image_too_large'));
        return;
      }
      chunks.push(chunk);
    };
    if (signal.aborted) { onTimeout(); return; }
    signal.addEventListener('abort', onTimeout, { once: true });
    request.on('data', onData);
    request.once('end', onEnd);
    request.once('error', onError);
    request.once('aborted', onError);
  });
}

export async function parseRequest(request: IncomingMessage, signal: AbortSignal) {
  const contentType = request.headers['content-type'] ?? '';
  if (!/^multipart\/form-data;\s*boundary=/i.test(contentType)) throw new ApiError(415, 'multipart_required');
  try {
    const bytes = await readBody(request, signal);
    const form = await new Response(new Uint8Array(bytes), { headers: { 'Content-Type': contentType } }).formData();
    const fields: Record<string, string> = {};
    let image: File | undefined;
    for (const [key, value] of form) {
      if (key === 'image' && value instanceof File && !image) { image = value; continue; }
      if (key === 'image' || typeof value !== 'string' || key in fields || value.length > 200) {
        throw new ApiError(400, 'invalid_metadata');
      }
      fields[key] = value;
    }
    const metadata = metadataSchema.parse(fields);
    if (!image) throw new ApiError(400, 'image_required');
    return { metadata, image: await sanitizeImage(image) };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, 'invalid_request');
  }
}
