import { useEffect, useState } from "react";
import type { Audit, AuditItem } from "./inventory";
import * as inv from "./inventory-repo";

export function useInventory(initialId: string | null) {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [items, setItems] = useState<AuditItem[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function load(next?: string | null) {
    const [list, all] = await Promise.all([inv.audits(), inv.allItems()]);
    setAudits(list);
    setItems(all);
    setOpenId(next !== undefined ? next : list.find((audit) => audit.status === "active")?.id ?? null);
  }
  async function run(work: () => Promise<void>) {
    setError("");
    try {
      await work();
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo guardar. Reintenta.");
      return false;
    }
  }
  useEffect(() => {
    void run(() => load(initialId ?? undefined));
  }, []);
  const audit = audits.find((item) => item.id === openId) ?? null;
  return {
    audits,
    items,
    audit,
    rows: items.filter((item) => item.auditId === openId).sort((a, b) => a.position - b.position),
    error,
    open: (auditId: string | null) => setOpenId(auditId),
    start: () => run(async () => load(await inv.startAudit())),
    save: (item: AuditItem) => run(async () => { await inv.saveItem(item); await load(openId); }),
    remove: (item: AuditItem) => run(async () => { await inv.removeItem(item); await load(openId); }),
    close: () => run(async () => { if (openId) await inv.closeAudit(openId); await load(openId); }),
  };
}
