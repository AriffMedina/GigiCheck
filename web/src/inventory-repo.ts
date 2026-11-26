import { db } from "./db";
import { id, localDate } from "./domain";
import { newAudit, validateItem, type AuditItem } from "./inventory";
import { abort, observeTransaction } from "./transactions";

export async function audits() {
  return (await (await db()).getAll("audits")).sort((a, b) => b.createdAt - a.createdAt);
}
export async function allItems() {
  return (await db()).getAll("auditItems");
}
// Reuses the active inventory so a double tap cannot open two at once.
export async function startAudit() {
  const tx = (await db()).transaction("audits", "readwrite");
  observeTransaction(tx);
  const active = (await tx.store.getAll()).find((audit) => audit.status === "active");
  const audit = active ?? newAudit(id(), localDate());
  if (!active) await tx.store.add(audit);
  await tx.done;
  return audit.id;
}
async function editable(auditId: string) {
  const tx = (await db()).transaction(["audits", "auditItems"], "readwrite");
  observeTransaction(tx);
  if ((await tx.objectStore("audits").get(auditId))?.status !== "active")
    abort(tx, "Este inventario ya está finalizado.");
  return tx;
}
export async function saveItem(item: AuditItem) {
  validateItem(item);
  const tx = await editable(item.auditId);
  const items = tx.objectStore("auditItems");
  const position = (await items.get(item.id))?.position ??
    (await items.index("auditId").getAll(item.auditId))
      .reduce((last, row) => Math.max(last, row.position), 0) + 1;
  await items.put({ ...item, name: item.name.trim(), presentation: item.presentation.trim(), position });
  await tx.done;
}
export async function removeItem(item: AuditItem) {
  const tx = await editable(item.auditId);
  await tx.objectStore("auditItems").delete(item.id);
  await tx.done;
}
export async function closeAudit(auditId: string) {
  const tx = await editable(auditId);
  const audit = (await tx.objectStore("audits").get(auditId))!;
  await tx.objectStore("audits").put({ ...audit, status: "closed" });
  await tx.done;
}
