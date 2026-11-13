import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { openDB } from "idb";
import { db } from "../src/db";

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
