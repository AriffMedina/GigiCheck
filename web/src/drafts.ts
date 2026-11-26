import { db } from "./db";
import type { Draft } from "./domain";
import { abort, observeTransaction } from "./transactions";

export async function getDraft(sessionId: string) {
  return (
    (await (await db()).getFromIndex("drafts", "sessionId", sessionId)) ?? null
  );
}
export async function saveDraft(draft: Draft, photo?: Blob) {
  const tx = (await db()).transaction(
    ["sessions", "drafts", "photos", "consumed"],
    "readwrite",
  );
  observeTransaction(tx);
  const session = await tx.objectStore("sessions").get(draft.sessionId);
  if (
    session?.status !== "active" ||
    (await tx.objectStore("consumed").get(draft.id))
  )
    abort(tx, "Este borrador ya no se puede modificar.");
  if (photo && draft.photo)
    await tx.objectStore("photos").put({ id: draft.photo, blob: photo });
  await tx.objectStore("drafts").put(draft);
  await tx.done;
}
export async function discardDraft(draft: Draft) {
  const tx = (await db()).transaction(
    ["drafts", "photos", "entries"],
    "readwrite",
  );
  observeTransaction(tx);
  await tx.objectStore("drafts").delete(draft.id);
  if (draft.photo) {
    const referenced = (await tx.objectStore("entries").getAll()).some(
      (row) => row.photo === draft.photo,
    );
    if (!referenced) await tx.objectStore("photos").delete(draft.photo);
  }
  await tx.done;
}
export async function cleanPhotos() {
  const tx = (await db()).transaction(
    ["entries", "drafts", "photos", "auditItems"],
    "readwrite",
  );
  observeTransaction(tx);
  for (const row of await tx.objectStore("entries").getAll())
    if (row.deletedAt && Date.now() - row.deletedAt > 8000)
      await tx.objectStore("entries").delete(row.id);
  const references = new Set(
    [
      ...(await tx.objectStore("entries").getAll()),
      ...(await tx.objectStore("drafts").getAll()),
      // Inventory items keep their photos too; without this they would be wiped as orphans.
      ...(await tx.objectStore("auditItems").getAll()),
    ].flatMap((row) => (row.photo ? [row.photo] : [])),
  );
  for (const key of await tx.objectStore("photos").getAllKeys())
    if (!references.has(key)) await tx.objectStore("photos").delete(key);
  await tx.done;
}
