import "fake-indexeddb/auto";
import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { blankDraft, countTab, currentCount, type Session } from "../src/domain";
import { db, resetConnection } from "../src/db";
import * as repo from "../src/repository";

beforeEach(async () => {
  const tx = (await db()).transaction(
    ["sessions", "entries", "drafts", "photos", "consumed"], "readwrite",
  );
  for (const store of tx.objectStoreNames) await tx.objectStore(store).clear();
  await tx.done;
});
async function add(sessionId: string, id: string, amount = 4) {
  const draft = { ...blankDraft(sessionId), id, name: id, quantityInput: String(amount) };
  await repo.saveDraft(draft);
  await repo.confirm(draft);
  return draft;
}

test("productos conservan orden de alta tras edición, progreso y recarga", async () => {
  const session = await repo.createSession();
  const first = await add(session, "z-primero");
  await add(session, "a-segundo");
  await repo.bring(first.id, 1);
  const editing = { ...first, id: "edicion", editingEntryId: first.id, name: "Actualizado" };
  await repo.saveDraft(editing);
  await repo.confirm(editing);
  await resetConnection();
  assert.deepEqual((await repo.entries(session)).map((row) => row.id), [first.id, "a-segundo"]);
  const [row] = await repo.entries(session);
  assert(row);
  await repo.markDeleted(row);
  await add(session, "0-tercero");
  await repo.markDeleted(row, true);
  assert.deepEqual((await repo.entries(session)).map((entry) => entry.id), [first.id, "a-segundo", "0-tercero"]);
});

test("productos anteriores sin posición permanecen delante de altas nuevas", async () => {
  const session = await repo.createSession();
  await add(session, "z-anterior");
  const [row] = await repo.entries(session);
  assert(row);
  const { position: _position, ...legacy } = row;
  await (await db()).put("entries", legacy);
  await add(session, "a-nuevo");
  assert.deepEqual((await repo.entries(session)).map((entry) => entry.id), [row.id, "a-nuevo"]);
});

test("bajadas concurrentes se guardan y actualizan la revisión del PDF", async () => {
  const session = await repo.createSession();
  const draft = await add(session, "producto", 12);
  const before = (await repo.sessions())[0]!;
  await repo.changeStatus(before, "closed");
  const revision = (await repo.sessions())[0]!.revision;
  await Promise.all(Array.from({ length: 8 }, () => repo.bring(draft.id, 1)));
  assert.equal((await repo.entries(session))[0]?.brought, 8);
  assert.equal((await repo.sessions())[0]?.revision, revision + 8);
  await repo.bring(draft.id, 4);
  const completed = (await repo.sessions())[0]!.revision;
  await repo.bring(draft.id, 1);
  assert.equal((await repo.sessions())[0]?.revision, completed);
  await resetConnection();
  assert.equal((await repo.entries(session))[0]?.brought, 12);
});

test("bajadas rechazan números inválidos y productos eliminados", async () => {
  const session = await repo.createSession();
  const draft = await add(session, "producto");
  for (const value of [NaN, Infinity, 0.5]) await assert.rejects(repo.bring(draft.id, value));
  assert.equal((await repo.entries(session))[0]?.brought, 0);
  const [row] = await repo.entries(session);
  assert(row);
  await repo.markDeleted(row);
  await assert.rejects(repo.bring(row.id, 1));
});

test("marcar todas o reiniciar resuelve ajustes rápidos contra la última cantidad guardada", async () => {
  const session = await repo.createSession();
  const draft = await add(session, "producto", 6);
  await repo.bring(draft.id, 2);
  await Promise.all([repo.bring(draft.id, -1), repo.bring(draft.id, "all")]);
  assert.equal((await repo.entries(session))[0]?.brought, 6);
  await repo.bring(draft.id, -4);
  await Promise.all([repo.bring(draft.id, 1), repo.bring(draft.id, "none")]);
  assert.equal((await repo.entries(session))[0]?.brought, 0);
  await resetConnection();
  assert.equal((await repo.entries(session))[0]?.brought, 0);
});

test("Inicio elige únicamente el conteo activo; los finalizados se abren desde historial", async () => {
  const first = await repo.createSession();
  const old = (await repo.sessions())[0]!;
  await repo.changeStatus(old, "closed");
  await (await db()).put("sessions", { ...old, status: "closed", createdAt: 1 });
  const second = await repo.createSession();
  assert.equal(currentCount(await repo.sessions())?.id, second);
  const latest = (await repo.sessions())[0]!;
  await repo.changeStatus(latest, "closed");
  await resetConnection();
  assert.equal(currentCount(await repo.sessions()), null);
  assert.notEqual(first, second);
  assert.equal(currentCount([]), null);
  assert.equal(currentCount([
    { id: "closed", status: "closed" } as Session,
    { id: "active", status: "active" } as Session,
  ])?.id, "active");
});

test("cancelar y volver desde historial no restaura una bodega anterior, tampoco al recargar", async () => {
  const previous = await repo.createSession();
  await add(previous, "producto-anterior", 2);
  await repo.changeStatus((await repo.sessions())[0]!, "closed");
  const active = await repo.createSession();
  await add(active, "producto-cancelado");
  await repo.saveDraft({ ...blankDraft(active), name: "Borrador cancelado" });
  await repo.deleteSession(active);
  assert.equal(currentCount(await repo.sessions()), null);
  assert.equal((await repo.sessions()).length, 1);
  assert.equal((await repo.entries(previous))[0]?.quantity, 2);
  assert.equal((await repo.entries(active)).length, 0);
  assert.equal(await repo.getDraft(active), null);
  await resetConnection();
  assert.equal(currentCount(await repo.sessions()), null);
  const next = await repo.createSession();
  assert.equal(currentCount(await repo.sessions())?.id, next);
});

test("la pestaña Conteo vuelve a la bodega finalizada en pantalla, no al inicio", async () => {
  const finished = await repo.createSession();
  await add(finished, "producto-en-bodega");
  await repo.changeStatus((await repo.sessions()).find((s) => s.id === finished)!, "closed");
  assert.equal(countTab(await repo.sessions(), finished)?.id, finished);
  assert.equal(countTab(await repo.sessions(), null), null, "tras cancelar no hay nada seleccionado");
  const active = await repo.createSession();
  assert.equal(countTab(await repo.sessions(), finished)?.id, active, "el conteo activo tiene prioridad");
});
