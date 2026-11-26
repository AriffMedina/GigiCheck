export interface Identity {
  name: string;
  brand: string;
  presentation: string;
  category: string;
}
export interface Session {
  id: string;
  date: string;
  shift: string;
  timezone: string;
  status: "active" | "closed";
  revision: number;
  createdAt?: number;
}
export interface Entry extends Identity {
  id: string;
  sessionId: string;
  // Older records retain their existing order ahead of newly confirmed products.
  position?: number;
  quantity: number;
  // Units already brought down from the warehouse (0..quantity).
  brought: number;
  note: string;
  photo: string | null;
  sourceDraftId: string;
  source: "manual" | "ai_assisted";
  deletedAt: number | null;
}
export interface Draft extends Identity {
  id: string;
  sessionId: string;
  quantityInput: string;
  note: string;
  photo: string | null;
  imageRevision: number;
  formRevision: number;
  source: "manual" | "ai_assisted";
  editingEntryId: string | null;
}
export const OPERATOR = "Regina Sánchez";
export const SHIFT = "Vespertino (9:00 p.m. – 6:00 a.m.)";
export const id = () => crypto.randomUUID();
export const normalized = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
// Accent- and case-insensitive so "jabon" finds "Jabón".
export const byName = <T extends { name: string }>(rows: T[], query: string) =>
  rows.filter((row) => normalized(row.name).includes(normalized(query)));
export const sameIdentity = (a: Identity, b: Identity) =>
  ["name", "brand", "presentation"].every(
    (key) =>
      normalized(a[key as keyof Identity]) ===
      normalized(b[key as keyof Identity]),
  );
export function quantity(text: string): number {
  if (!/^\d+$/.test(text) || Number(text) < 1 || Number(text) > 999)
    throw Error("Escribe un entero de 1 a 999.");
  return Number(text);
}
export function validate(d: Draft): number {
  if (!d.name.trim()) throw Error("Escribe el nombre del producto.");
  if ([d.name, d.brand, d.presentation, d.category].some((x) => x.length > 200))
    throw Error("Cada campo admite hasta 200 caracteres.");
  if (d.note.length > 500) throw Error("La nota admite hasta 500 caracteres.");
  return quantity(d.quantityInput);
}
export const totals = (rows: Entry[]) => ({
  products: rows.length,
  units: rows.reduce((sum, row) => sum + row.quantity, 0),
});
export function localDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export const dateLabel = (session: Pick<Session, "date" | "shift">, full = false) =>
  `${Number(session.date.slice(8))} ${MONTHS[Number(session.date.slice(5, 7)) - 1]} · ${full ? session.shift : session.shift.split(" (")[0]}`;
export const pending = (row: Entry) => row.quantity - row.brought;
export type BringChange = number | "all" | "none";
// History entries must only reopen explicitly, especially after canceling a new count.
export const currentCount = (sessions: Session[]): Session | null =>
  sessions.find((session) => session.status === "active") ?? null;
// The Conteo tab returns to the count on screen (e.g. a finished one in bodega) when none is active.
// A canceled count leaves nothing selected, so it still falls back to Home.
export const countTab = (sessions: Session[], selected: string | null): Session | null =>
  currentCount(sessions) ?? sessions.find((session) => session.id === selected) ?? null;
// Steps the quantity text by delta, always landing in 1..999 (also from empty or invalid text).
export function stepQuantity(text: string, delta: number): string {
  const current = /^\d+$/.test(text) ? Number(text) : 0;
  return String(Math.min(999, Math.max(1, current + delta)));
}
export const blankDraft = (sessionId: string): Draft => ({
  id: id(),
  sessionId,
  name: "",
  brand: "",
  presentation: "",
  category: "",
  quantityInput: "1",
  note: "",
  photo: null,
  imageRevision: 0,
  formRevision: 0,
  source: "manual",
  editingEntryId: null,
});
