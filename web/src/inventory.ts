import { SHIFT } from "./domain";

export interface Audit {
  id: string;
  date: string;
  shift: string;
  status: "active" | "closed";
  createdAt: number;
}
export interface AuditItem {
  id: string;
  auditId: string;
  position: number;
  name: string;
  presentation: string;
  photo: string | null;
  // What the pharmacy system says should be on hand.
  expected: number;
  // Everything physically found (display + warehouse), spoiled units included.
  counted: number;
  // Spoiled or damaged units among `counted`.
  merma: number;
}
export const LIMIT = 9999;
export const newAudit = (id: string, date: string): Audit =>
  ({ id, date, shift: SHIFT, status: "active", createdAt: Date.now() });
// Units the system expects but nobody found: likely theft or loss.
export const missing = (item: AuditItem) => Math.max(0, item.expected - item.counted);
export const surplus = (item: AuditItem) => Math.max(0, item.counted - item.expected);
export function validateItem(item: AuditItem) {
  if (!item.name.trim()) throw Error("Escribe el nombre del producto.");
  for (const [label, value] of [["Debe haber", item.expected], ["Contados", item.counted], ["Merma", item.merma]] as const)
    if (!Number.isInteger(value) || value < 0 || value > LIMIT)
      throw Error(`${label}: escribe un entero de 0 a ${LIMIT}.`);
  if (item.merma > item.counted) throw Error("La merma no puede ser mayor que los contados.");
}
export const auditTotals = (items: AuditItem[]) => ({
  products: items.length,
  merma: items.reduce((sum, item) => sum + item.merma, 0),
  missing: items.reduce((sum, item) => sum + missing(item), 0),
});
export interface LogRow { audit: Audit; item: AuditItem }
export interface LogDay { date: string; audit: Audit; merma: LogRow[]; missing: LogRow[] }
// The log is derived from inventory items, so it can never drift from what was counted.
export function shrinkLog(audits: Audit[], items: AuditItem[]): LogRow[] {
  const byId = new Map(audits.map((audit) => [audit.id, audit]));
  return items
    .filter((item) => item.merma > 0 || missing(item) > 0)
    .flatMap((item) => {
      const audit = byId.get(item.auditId);
      return audit ? [{ audit, item }] : [];
    })
    .sort((a, b) => b.audit.createdAt - a.audit.createdAt || a.item.position - b.item.position);
}
// Groups the log by inventory day so each day reads on its own instead of one ever-growing list.
export function logDays(audits: Audit[], items: AuditItem[]): LogDay[] {
  const days = new Map<string, LogDay>();
  for (const row of shrinkLog(audits, items)) {
    const day = days.get(row.audit.date) ?? { date: row.audit.date, audit: row.audit, merma: [], missing: [] };
    if (row.item.merma) day.merma.push(row);
    if (missing(row.item)) day.missing.push(row);
    days.set(row.audit.date, day);
  }
  return [...days.values()];
}
