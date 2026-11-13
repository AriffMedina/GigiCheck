import "fake-indexeddb/auto";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { blankDraft, localDate, SHIFT } from "../src/domain";
import { db, resetConnection } from "../src/db";
import * as repo from "../src/repository";
beforeEach(async () => {
  const tx = (await db()).transaction(
    ["sessions", "entries", "drafts", "photos", "consumed"],
    "readwrite",
  );
  for (const store of tx.objectStoreNames) await tx.objectStore(store).clear();
  await tx.done;
});
async function setup() {
  const session = await repo.createSession();
  const draft = {
    ...blankDraft(session),
    name: "Electrolit",
    presentation: "Coco · 625 ml",
    quantityInput: "3",
  };
  await repo.saveDraft(draft);
  return { session, draft };
}
test("un único conteo activo incluso ante creación concurrente", async () => {
  const result = await Promise.allSettled([
    repo.createSession(),
    repo.createSession(),
  ]);
  assert.equal(result.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal((await repo.sessions()).length, 1);
});
test("confirmar dos veces no duplica y un guardado tardío no resucita borrador", async () => {
  const { session, draft } = await setup();
  await Promise.all([repo.confirm(draft), repo.confirm(draft)]);
  assert.equal((await repo.entries(session)).length, 1);
  assert.equal(await repo.getDraft(session), null);
  await assert.rejects(repo.saveDraft(draft));
  assert.equal(await repo.getDraft(session), null);
});
test("consolidación atómica, repetible sin sumar dos veces", async () => {
  const { session, draft } = await setup();
  await repo.confirm(draft);
  const next = {
    ...blankDraft(session),
    name: draft.name,
    presentation: draft.presentation,
    quantityInput: "4",
  };
  await repo.saveDraft(next);
  await repo.confirm(next, { mode: "sum", targetId: draft.id });
  await repo.confirm(next, { mode: "sum", targetId: draft.id });
  assert.equal((await repo.entries(session))[0]?.quantity, 7);
  assert.equal(await repo.getDraft(session), null);
});
test("sumar por encima de 999 preserva registro y borrador", async () => {
  const { session, draft } = await setup();
  await repo.confirm(draft);
  const next = {
    ...blankDraft(session),
    name: draft.name,
    quantityInput: "999",
  };
  await repo.saveDraft(next);
  await assert.rejects(repo.confirm(next, { mode: "sum", targetId: draft.id }));
  assert.equal((await repo.entries(session))[0]?.quantity, 3);
  assert.equal((await repo.getDraft(session))?.id, next.id);
});
test("edición recuperada actualiza el mismo registro y eliminar permite deshacer", async () => {
  const { session, draft } = await setup();
  await repo.confirm(draft);
  const editing = {
    ...blankDraft(session),
    name: "Corregido",
    quantityInput: "8",
    editingEntryId: draft.id,
  };
  await repo.saveDraft(editing);
  const recovered = await repo.getDraft(session);
  assert(recovered);
  await repo.confirm(recovered);
  const rows = await repo.entries(session);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.quantity, 8);
  assert.equal(rows[0]?.name, "Corregido");
  assert(rows[0]);
  await repo.markDeleted(rows[0]);
  assert.equal((await repo.entries(session)).length, 0);
  await repo.markDeleted(rows[0], true);
  assert.equal((await repo.entries(session)).length, 1);
});
test("fotografía y borrador durables, limpieza respeta referencia confirmada", async () => {
  const { session, draft } = await setup();
  const photo = { ...draft, photo: "photo-1" };
  await repo.saveDraft(photo, new Blob(["image"], { type: "image/jpeg" }));
  await repo.confirm(photo);
  await repo.cleanPhotos();
  assert.equal((await (await db()).get("photos", "photo-1"))?.blob.size, 5);
  await repo.deleteSession(session);
  assert.equal(await (await db()).get("photos", "photo-1"), undefined);
});
test("cerrar exige resolver borrador y conteo cerrado rechaza modificaciones", async () => {
  const { session, draft } = await setup();
  const count = (await repo.sessions())[0];
  assert(count);
  await assert.rejects(repo.changeStatus(count, "closed"));
  await repo.confirm(draft);
  await repo.changeStatus(count, "closed");
  await assert.rejects(repo.markDeleted((await repo.entries(session))[0]!));
  await assert.rejects(repo.saveDraft(blankDraft(session)));
});
test("iniciar conteo lo crea al instante con fecha de hoy y turno fijo", async () => {
  const id = await repo.createSession();
  const [session] = await repo.sessions();
  assert.equal(session?.id, id);
  assert.equal(session?.status, "active");
  assert.equal(session?.date, localDate());
  assert.equal(session?.shift, SHIFT);
});
test("checklist de bodega: parcial, tachar todo, sin bajar de 0 y persistente", async () => {
  const { session, draft } = await setup();
  await repo.confirm(draft);
  const count = (await repo.sessions())[0];
  assert(count);
  await repo.changeStatus(count, "closed");
  const brought = async () => (await repo.entries(session))[0]?.brought;
  assert.equal(await brought(), 0);
  await repo.bring(draft.id, 1);
  assert.equal(await brought(), 1);
  await repo.bring(draft.id, 1);
  assert.equal(await brought(), 2);
  await repo.bring(draft.id, 50);
  assert.equal(await brought(), 3);
  await repo.bring(draft.id, -3);
  assert.equal(await brought(), 0);
  await repo.bring(draft.id, -5);
  assert.equal(await brought(), 0);
  // Reopening the connection simulates a reload: progress is read back from IndexedDB.
  await repo.bring(draft.id, 3);
  await resetConnection();
  assert.equal(await brought(), 3);
  await assert.rejects(repo.bring("missing", 1));
});
test("editar a una cantidad menor recorta lo ya bajado", async () => {
  const { session, draft } = await setup();
  await repo.confirm(draft);
  await repo.bring(draft.id, 3);
  const editing = {
    ...blankDraft(session),
    name: draft.name,
    quantityInput: "2",
    editingEntryId: draft.id,
  };
  await repo.saveDraft(editing);
  await repo.confirm(editing);
  assert.equal((await repo.entries(session))[0]?.brought, 2);
});
