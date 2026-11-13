import sharp from 'sharp';
import { ApiError } from './contracts.js';

export const IMAGE_LIMIT = 2 * 1024 * 1024;

export async function sanitizeImage(file: File): Promise<Buffer> {
  if (file.size > IMAGE_LIMIT) throw new ApiError(413, 'image_too_large');
  if (!['image/jpeg', 'image/png'].includes(file.type)) throw new ApiError(415, 'unsupported_image');
  const bytes = Buffer.from(await file.arrayBuffer());
  try {
    const image = sharp(bytes, { limitInputPixels: 1600 * 1600, failOn: 'warning', animated: false });
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height || Math.max(metadata.width, metadata.height) > 1600) {
      throw new ApiError(413, 'image_dimensions');
    }
    const expected = file.type === 'image/jpeg' ? 'jpeg' : 'png';
    if (metadata.format !== expected || (metadata.pages ?? 1) > 1) throw new ApiError(415, 'unsupported_image');
    // Re-encoding drops EXIF/location and rejects incomplete image data before sending anything.
    return await image.autoOrient().jpeg({ quality: 85 }).toBuffer();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(415, 'invalid_image');
  }
}
