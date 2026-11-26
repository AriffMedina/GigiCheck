import { useEffect, useState } from "react";
import { dateLabel, type Session } from "./domain";
import type { Audit } from "./inventory";
import * as inv from "./inventory-repo";
import { Icon } from "./ui";

type Row = { kind: "count"; item: Session } | { kind: "inventory"; item: Audit };
// Newest day first; within a day, the most recently started first.
const newest = (a: Row, b: Row) =>
  b.item.date.localeCompare(a.item.date) || (b.item.createdAt ?? 0) - (a.item.createdAt ?? 0);

export function History({
  sessions,
  onOpen,
  onOpenAudit,
}: {
  sessions: Session[];
  onOpen: (id: string) => void;
  onOpenAudit: (id: string) => void;
}) {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    inv.audits().then(setAudits, () => setError("No se pudieron cargar los inventarios."));
  }, []);
  const rows: Row[] = [
    ...sessions.map((item) => ({ kind: "count" as const, item })),
    ...audits.map((item) => ({ kind: "inventory" as const, item })),
  ].sort(newest);
  return (
    <>
      <h1>Tu historial.</h1>
      {error && <p className="error" role="alert">{error}</p>}
      {!rows.length && <p className="muted">No tienes conteos anteriores.</p>}
      {rows.map((row) => (
        <button key={row.item.id} className="entry"
          onClick={() => (row.kind === "count" ? onOpen : onOpenAudit)(row.item.id)}>
          <Icon name={row.kind === "count" ? "history" : "box"} />
          <div className="entry-copy">
            <strong>{dateLabel(row.item)}</strong>
            <p className="muted">
              <span className={`kind-tag ${row.kind}`}>{row.kind === "count" ? "Conteo" : "Inventario"}</span>
              {" · "}{row.item.status === "active" ? "En curso" : "Finalizado"}
            </p>
          </div>
          <span aria-hidden="true">→</span>
        </button>
      ))}
    </>
  );
}
