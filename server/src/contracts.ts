import { z } from 'zod';

const text = z.string().trim().max(200).nullable();
export const suggestionSchema = z.strictObject({
  name: text, brand: text, presentation: text, category: text,
  warnings: z.array(z.string().trim().min(1).max(200)).max(5),
});
export const resultSchema = z.strictObject({
  status: z.enum(['identified', 'uncertain', 'unreadable']),
  suggestion: suggestionSchema,
});
const identifier = z.string().min(1).max(100).regex(/^[A-Za-z0-9_-]+$/);
export const metadataSchema = z.strictObject({
  requestId: identifier, draftId: identifier,
  imageRevision: z.string().regex(/^\d{1,9}$/).transform(Number),
  schemaVersion: z.literal('1'),
});
export type Metadata = z.infer<typeof metadataSchema>;
export type Identification = z.infer<typeof resultSchema>;
export type Provider = (image: Buffer, signal: AbortSignal) => Promise<Identification>;

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string) {
    super(code);
  }
}
