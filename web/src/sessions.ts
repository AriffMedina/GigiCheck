import { db } from "./db";
import { id, localDate, SHIFT, type Session } from "./domain";
import { abort, observeTransaction } from "./transactions";
import { cleanPhotos } from "./drafts";

export async function sessions() {
  return (await (await db()).getAll("sessions")).sort(
    (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
  );
}
export async function createSession() {
  const tx = (await db()).transaction("sessions", "readwrite");
  observeTransaction(tx);
  if ((await tx.store.getAll()).some((item) => item.status === "active"))
    abort(tx, "Ya tienes un conteo activo. Finalízalo antes de iniciar otro.");
  const session: Session = {
    id: id(),
    date: localDate(),
    shift: SHIFT,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    status: "active",
    revision: 1,
  };
  await tx.store.add(session);
  await tx.done;
  return session.id;
}
export async function changeStatus(
  session: Session,
  status: "active" | "closed",
) {
  const tx = (await db()).transaction(["sessions", "drafts"], "readwrite");
  observeTransaction(tx);
  const current = await tx.objectStore("sessions").get(session.id);
  if (!current) abort(tx, "El conteo ya no existe.");
  if (
    status === "active" &&
    (await tx.objectStore("sessions").getAll()).some(
      (item) => item.status === "active" && item.id !== session.id,
    )
  )
    abort(tx, "Finaliza el conteo activo antes de reabrir este.");
  if (
    status === "closed" &&
    (await tx.objectStore("drafts").index("sessionId").get(session.id))
  )
    abort(tx, "Confirma o descarta el borrador antes de finalizar.");
  await tx
    .objectStore("sessions")
    .put({ ...current, status, revision: current.revision + 1 });
  await tx.done;
}
export async function deleteSession(sessionId: string) {
  const tx = (await db()).transaction(
    ["sessions", "entries", "drafts", "consumed"],
    "readwrite",
  );
  observeTransaction(tx);
  for (const store of ["entries", "drafts", "consumed"] as const)
    for (const row of await tx.objectStore(store).getAll())
      if (row.sessionId === sessionId)
        await tx.objectStore(store).delete(row.id);
  await tx.objectStore("sessions").delete(sessionId);
  await tx.done;
  await cleanPhotos();
}
