import { useState } from "react";
import { byName, dateLabel, id } from "./domain";
import { auditTotals, logDays, missing, surplus, type AuditItem } from "./inventory";
import { InventoryForm } from "./InventoryForm";
import { InventoryLog } from "./InventoryLog";
import { Button, ErrorNotice, Icon, Photo, SearchField } from "./ui";
import { useInventory } from "./useInventory";

const TABS = [["current", "Actual"], ["log", "Registro"]] as const;
type Tab = (typeof TABS)[number][0];

const balance = (item: AuditItem) =>
  missing(item) ? `−${missing(item)}` : surplus(item) ? `+${surplus(item)}` : "✓";

export function InventoryView({ auditId }: { auditId: string | null }) {
  const inv = useInventory(auditId);
  const [tab, setTab] = useState<Tab>("current");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AuditItem | null>(null);
  const { audit, rows } = inv;
  const active = audit?.status === "active";
  const sum = auditTotals(rows);
  const blank = (): AuditItem =>
    ({ id: id(), auditId: audit!.id, position: 0, name: "", presentation: "", photo: null, expected: 0, counted: 0, merma: 0 });
  function finish() {
    if (window.confirm("¿Finalizar el inventario? Ya no podrás editar sus productos.")) void inv.close();
  }
  return (
    <>
      <h1>Inventario.</h1>
      <div className="segmented" role="tablist">
        {TABS.map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? "active" : ""}
            onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>
      <ErrorNotice message={inv.error} />
      {tab === "log" && <InventoryLog days={logDays(inv.audits, inv.items)} />}
      {tab === "current" && !audit && (
        <div className="actions">
          <p className="muted">Anota lo que dice el sistema, cuenta lo que hay y marca la merma.</p>
          <Button onClick={() => void inv.start()}><Icon name="spark" />Iniciar inventario</Button>
        </div>
      )}
      {tab === "current" && audit && (
        <>
          <p className="date">{dateLabel(audit)} · {active ? "En curso" : "Finalizado"}</p>
          <div className="totals">
            <span>{sum.products} productos</span>
            <span>{sum.merma} merma</span>
            <span>{sum.missing} faltan</span>
          </div>
          {rows.length > 1 && <SearchField value={query} onChange={setQuery} />}
          {!rows.length && <p className="muted empty">Agrega el primer producto.</p>}
          {byName(rows, query).map((item) => (
            <button key={item.id} className="entry" disabled={!active} onClick={() => setEditing(item)}
              aria-label={`${item.name}: debe haber ${item.expected}, contados ${item.counted}. Editar`}>
              <Photo id={item.photo} />
              <div className="entry-copy">
                <strong>{item.name}</strong>
                <p className="muted">Debe {item.expected} · Contados {item.counted}{item.merma ? ` · Merma ${item.merma}` : ""}</p>
              </div>
              <span className="qty">{balance(item)}</span>
            </button>
          ))}
          <div className="actions">
            {active && <Button onClick={() => setEditing(blank())}><Icon name="spark" />Agregar producto</Button>}
            {active && <Button secondary disabled={!rows.length} onClick={finish}>Finalizar inventario</Button>}
            {!active && <Button secondary onClick={() => inv.open(inv.audits.find((a) => a.status === "active")?.id ?? null)}>Volver</Button>}
          </div>
        </>
      )}
      {editing && (
        <InventoryForm key={editing.id} initial={editing} onSave={inv.save} onCancel={() => setEditing(null)}
          onRemove={(item) => {
            if (window.confirm(`¿Eliminar ${item.name} del inventario?`)) void inv.remove(item).then(() => setEditing(null));
          }} />
      )}
    </>
  );
}
