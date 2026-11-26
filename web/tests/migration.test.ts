import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { deleteDB, openDB } from "idb";
import { db, resetConnection } from "../src/db";

test("migración v1 a v2 agrega brought a los productos y quita ajustes", async () => {
  const old = await openDB("gigicheck", 1, {
    upgrade(d) {
      d.createObjectStore("entries", { keyPath: "id" }).createIndex("sessionId", "sessionId");
      d.createObjectStore("settings");
    },
  });
  await old.put("entries", { id: "e1", sessionId: "s", quantity: 4, deletedAt: null });
  old.close();
  const upgraded = await db();
  assert.equal((await upgraded.get("entries", "e1"))?.brought, 0);
  assert(!upgraded.objectStoreNames.contains("settings" as never));
});
test("migración v2 a v3 agrega el inventario sin tocar los conteos", async () => {
  (await db()).close();
  await resetConnection();
  await deleteDB("gigicheck");
  const old = await openDB("gigicheck", 2, {
    upgrade(d) {
      d.createObjectStore("sessions", { keyPath: "id" });
      d.createObjectStore("entries", { keyPath: "id" }).createIndex("sessionId", "sessionId");
    },
  });
  await old.put("sessions", { id: "s1", status: "active" });
  old.close();
  const upgraded = await db();
  assert.equal((await upgraded.get("sessions", "s1"))?.status, "active");
  assert(upgraded.objectStoreNames.contains("audits"));
  assert(upgraded.objectStoreNames.contains("auditItems"));
});
