import { createHash, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { ApiError } from './contracts.js';

export const devicesSchema = z.array(z.strictObject({
  id: z.string().min(1).max(100).regex(/^[A-Za-z0-9_-]+$/),
  sha256: z.string().regex(/^[a-f0-9]{64}$/), enabled: z.boolean(),
})).min(1).max(1000).refine(devices => new Set(devices.map(d => d.id)).size === devices.length
  && new Set(devices.map(d => d.sha256)).size === devices.length);
export type Device = z.infer<typeof devicesSchema>[number];

export function authenticate(header: string | undefined, devices: readonly Device[]): string {
  if (!header?.startsWith('Bearer ') || header.length > 2048) throw new ApiError(401, 'unauthorized');
  const token = header.slice(7);
  if (token.length < 32 || !/^[A-Za-z0-9_-]+$/.test(token)) throw new ApiError(401, 'unauthorized');
  const digest = createHash('sha256').update(token).digest();
  let match: Device | undefined;
  for (const device of devices) {
    if (timingSafeEqual(digest, Buffer.from(device.sha256, 'hex'))) match = device;
  }
  if (!match) throw new ApiError(401, 'unauthorized');
  if (!match.enabled) throw new ApiError(403, 'device_revoked');
  return match.id;
}

export class Limits {
  private readonly activeDevices = new Set<string>();
  private readonly activeDrafts = new Set<string>();
  private readonly usage = new Map<string, number>();
  private day = '';

  acquire(device: string, draft: string, now = new Date()): () => void {
    const day = now.toISOString().slice(0, 10);
    if (this.day !== day) { this.usage.clear(); this.day = day; }
    const draftKey = `${device}:${draft}`;
    if (this.activeDevices.has(device) || this.activeDrafts.has(draftKey)) throw new ApiError(429, 'request_active');
    if ((this.usage.get(device) ?? 0) >= 100) throw new ApiError(429, 'daily_quota');
    this.usage.set(device, (this.usage.get(device) ?? 0) + 1);
    this.activeDevices.add(device);
    this.activeDrafts.add(draftKey);
    return () => { this.activeDevices.delete(device); this.activeDrafts.delete(draftKey); };
  }
}
