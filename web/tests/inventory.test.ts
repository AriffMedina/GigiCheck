import "fake-indexeddb/auto";
import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/db";
import { auditTotals, missing, shrinkLog, surplus, validateItem, type Audit, type AuditItem } from "../src/inventory";
import * as inv from "../src/inventory-repo";

const item = (patch: Partial<AuditItem> = {}): AuditItem => ({
  id: crypto.randomUUID(), auditId: "a", position: 1, name: "Paracetamol", presentation: "",
  expected: 20, counted: 14, merma: 3, ...patch,
});
beforeEach(async () => {
  const tx = (await db()).transaction(["audits", "auditItems"], "readwrite");
  for (const store of tx.objectStoreNames) await tx.objectStore(store).clear();
  await tx.done;
});

test("faltantes son lo que el sistema espera y no aparece; sobrantes no cuentan como faltante", () => {
  assert.equal(missing(item()), 6);
  assert.equal(missing(item({ counted: 25 })), 0);
  assert.equal(surplus(item({ counted: 25 })), 5);
  assert.deepEqual(auditTotals([item(), item({ merma: 0, counted: 20 })]), { products: 2, merma: 3, missing: 6 });
});
test("la merma nunca supera lo contado y las cantidades son enteras", () => {
  assert.throws(() => validateItem(item({ merma: 15 })), /mayor que los contados/);
  assert.throws(() => validateItem(item({ counted: 1.5 })));
  assert.throws(() => validateItem(item({ expected: -1 })));
  assert.throws(() => validateItem(item({ name: "  " })));
  validateItem(item({ merma: 14 }));
});
test("el registro solo lista productos con merma o faltantes, el inventario más reciente primero", () => {
  const audits = [
    { id: "old", createdAt: 1 } as Audit,
    { id: "new", createdAt: 2 } as Audit,
  ];
  const rows = shrinkLog(audits, [
    item({ auditId: "old", name: "Viejo" }),
    item({ auditId: "new", name: "Cuadra", expected: 5, counted: 5, merma: 0 }),
    item({ auditId: "new", name: "Robado", counted: 10, merma: 0 }),
    item({ auditId: "borrado", name: "Huérfano" }),
  ]);
  assert.deepEqual(rows.map((row) => row.item.name), ["Robado", "Viejo"]);
});
test("un solo inventario activo; al finalizar ya no se puede editar", async () => {
  const first = await inv.startAudit();
  assert.equal(await inv.startAudit(), first);
  await inv.saveItem(item({ auditId: first, name: "  A  " }));
  await inv.saveItem(item({ auditId: first, name: "B" }));
  const saved = await inv.allItems();
  assert.deepEqual(saved.map((row) => [row.name, row.position]).sort(), [["A", 1], ["B", 2]]);
  await inv.saveItem({ ...saved.find((row) => row.name === "A")!, counted: 18 });
  assert.equal((await inv.allItems()).find((row) => row.name === "A")?.position, 1, "editar conserva el orden");
  await inv.closeAudit(first);
  await assert.rejects(inv.saveItem(item({ auditId: first })), /finalizado/);
  await assert.rejects(inv.removeItem(saved[0]!), /finalizado/);
  assert.notEqual(await inv.startAudit(), first);
});
