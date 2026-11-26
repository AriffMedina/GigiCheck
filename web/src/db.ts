import {
  openDB,
  type DBSchema,
  type IDBPDatabase,
  type IDBPTransaction,
  type StoreNames,
} from "idb";
import type { Draft, Entry, Session } from "./domain";
import type { Audit, AuditItem } from "./inventory";
export interface Data extends DBSchema {
  sessions: { key: string; value: Session };
  entries: { key: string; value: Entry; indexes: { sessionId: string } };
  drafts: { key: string; value: Draft; indexes: { sessionId: string } };
  photos: { key: string; value: { id: string; blob: Blob } };
  consumed: { key: string; value: { id: string; sessionId: string } };
  audits: { key: string; value: Audit };
  auditItems: { key: string; value: AuditItem; indexes: { auditId: string } };
}
// v1 -> v2: entries gain `brought`; the settings store (consent/AI config) is gone.
async function migrateV2(
  db: IDBPDatabase<Data>,
  tx: IDBPTransaction<Data, StoreNames<Data>[], "versionchange">,
) {
  (db as IDBPDatabase<unknown>).deleteObjectStore("settings");
  for (const row of await tx.objectStore("entries").getAll())
    await tx.objectStore("entries").put({ ...row, brought: row.brought ?? 0 });
}
let opening: Promise<IDBPDatabase<Data>> | undefined;
export function db() {
  opening ??= openDB<Data>("gigicheck", 3, {
    async upgrade(db, oldVersion, _new, tx) {
      // v2 -> v3 only adds the inventory stores; existing counts are untouched.
      if (oldVersion < 3) {
        db.createObjectStore("audits", { keyPath: "id" });
        db.createObjectStore("auditItems", { keyPath: "id" }).createIndex("auditId", "auditId");
      }
      if (oldVersion === 1) return migrateV2(db, tx);
      if (oldVersion >= 1) return;
      db.createObjectStore("sessions", { keyPath: "id" });
      db.createObjectStore("entries", { keyPath: "id" }).createIndex(
        "sessionId",
        "sessionId",
      );
      db.createObjectStore("drafts", { keyPath: "id" }).createIndex(
        "sessionId",
        "sessionId",
        { unique: true },
      );
      db.createObjectStore("photos", { keyPath: "id" });
      db.createObjectStore("consumed", { keyPath: "id" });
    },
  }).catch((error) => {
    opening = undefined;
    throw error;
  });
  return opening;
}
export async function resetConnection() {
  if (opening) (await opening).close();
  opening = undefined;
}
