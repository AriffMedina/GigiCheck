export interface Identity { name: string; brand: string; presentation: string; category: string }
export interface Session { id: string; workDate: string; shift: string; timezone: string; status: 'active' | 'closed'; revision: number; branch: string; responsible: string; notes: string }
export interface Entry extends Identity { id: string; sessionId: string; quantity: number; note: string; photo: string | null; sourceDraftId: string; source: 'manual' | 'ai_assisted'; deletedAt: number | null }
export interface Draft extends Identity { id: string; sessionId: string; quantityInput: string; note: string; photo: string | null; imageRevision: number; formRevision: number; source: 'manual' | 'ai_assisted'; editingEntryId: string | null }
export function quantity(text: string): number {
  if (!/^[0-9]+$/.test(text) || Number(text) < 1 || Number(text) > 999) throw new Error('Escribe un entero de 1 a 999.');
  return Number(text);
}
export const normalized = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
export const sameIdentity = (a: Identity, b: Identity) => ['name', 'brand', 'presentation'].every(key => normalized(a[key as keyof Identity]) === normalized(b[key as keyof Identity]));
export function validate(draft: Draft): number {
  if (!draft.name.trim()) throw new Error('Escribe el nombre del producto.');
  if ([draft.name, draft.brand, draft.presentation, draft.category].some(value => value.length > 200)) throw new Error('Cada campo admite hasta 200 caracteres.');
  return quantity(draft.quantityInput);
}
export const totals = (entries: Entry[]) => ({ products: entries.length, units: entries.reduce((sum, row) => sum + row.quantity, 0) });
export function localDate(): string { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
export function validDate(value: string): boolean { const parsed = new Date(`${value}T12:00:00Z`); return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value; }
