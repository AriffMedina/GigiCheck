import { db } from "./db";
import { validate, type Draft, type Entry } from "./domain";
import { abort, observeTransaction } from "./transactions";
export type Merge = { mode: "sum" | "replace"; targetId: string };
export async function entries(sessionId: string) {
  return (
    await (await db()).getAllFromIndex("entries", "sessionId", sessionId)
  ).filter((row) => row.deletedAt === null);
}
export async function confirm(draft: Draft, merge?: Merge) {
  const amount = validate(draft);
  const tx = (await db()).transaction(
    ["sessions", "entries", "drafts", "consumed"],
    "readwrite",
  );
  observeTransaction(tx);
  try {
    if (await tx.objectStore("consumed").get(draft.id)) {
      await tx.done;
      return;
    }
    const session = await tx.objectStore("sessions").get(draft.sessionId);
    if (session?.status !== "active")
      abort(tx, "Reabre el conteo para editarlo.");
    if (!(await tx.objectStore("drafts").get(draft.id)))
      abort(tx, "El borrador no está guardado. Reintenta.");
    const targetId = draft.editingEntryId ?? merge?.targetId;
    if (targetId) {
      const row = await tx.objectStore("entries").get(targetId);
      if (!row || row.sessionId !== session.id || row.deletedAt !== null)
        abort(tx, "El producto existente cambió. Reintenta.");
      if (merge) {
        const result = merge.mode === "sum" ? row.quantity + amount : amount;
        if (result > 999)
          abort(
            tx,
            "La suma supera 999. Corrige la cantidad o guarda por separado.",
          );
        await tx
          .objectStore("entries")
          .put({ ...row, quantity: result, brought: Math.min(row.brought, result) });
      } else {
        await tx
          .objectStore("entries")
          .put({
            ...row,
            name: draft.name.trim(),
            brand: draft.brand.trim(),
            presentation: draft.presentation.trim(),
            category: draft.category.trim(),
            quantity: amount,
            brought: Math.min(row.brought, amount),
            note: draft.note,
            photo: draft.photo,
            source: draft.source,
          });
      }
    } else {
      await tx
        .objectStore("entries")
        .add({
          id: draft.id,
          sessionId: session.id,
          name: draft.name.trim(),
          brand: draft.brand.trim(),
          presentation: draft.presentation.trim(),
          category: draft.category.trim(),
          quantity: amount,
          brought: 0,
          note: draft.note,
          photo: draft.photo,
          sourceDraftId: draft.id,
          source: draft.source,
          deletedAt: null,
        });
    }
    await tx
      .objectStore("consumed")
      .put({ id: draft.id, sessionId: session.id });
    await tx.objectStore("drafts").delete(draft.id);
    await tx
      .objectStore("sessions")
      .put({ ...session, revision: session.revision + 1 });
    await tx.done;
  } catch (error) {
    try {
      tx.abort();
    } catch {
      /* An IDB request may have already aborted the transaction. */
    }
    throw error;
  }
}
export async function markDeleted(entry: Entry, undo = false) {
  const tx = (await db()).transaction(["sessions", "entries"], "readwrite");
  observeTransaction(tx);
  const session = await tx.objectStore("sessions").get(entry.sessionId);
  const current = await tx.objectStore("entries").get(entry.id);
  if (session?.status !== "active" || !current)
    abort(tx, "El conteo está cerrado.");
  if (undo && (!current.deletedAt || Date.now() - current.deletedAt > 8000))
    abort(tx, "El tiempo para deshacer terminó.");
  await tx
    .objectStore("entries")
    .put({ ...current, deletedAt: undo ? null : Date.now() });
  await tx
    .objectStore("sessions")
    .put({ ...session, revision: session.revision + 1 });
  await tx.done;
}
// Adds (or, if negative, removes) units brought down from the warehouse; stays within 0..quantity.
export async function bring(entryId: string, add: number) {
  const tx = (await db()).transaction("entries", "readwrite");
  observeTransaction(tx);
  const row = await tx.store.get(entryId);
  if (!row) abort(tx, "El producto ya no existe.");
  await tx.store.put({
    ...row,
    brought: Math.min(row.quantity, Math.max(0, row.brought + add)),
  });
  await tx.done;
}
