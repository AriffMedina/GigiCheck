import { dateLabel } from "./domain";
import { missing, type LogRow } from "./inventory";

export function InventoryLog({ rows }: { rows: LogRow[] }) {
  const merma = rows.filter((row) => row.item.merma > 0);
  const lost = rows.filter((row) => missing(row.item) > 0);
  const section = (title: string, list: LogRow[], units: (row: LogRow) => number) => (
    <section className="inventory-log" aria-label={title}>
      <h3>{title} · {list.reduce((sum, row) => sum + units(row), 0)} unidades</h3>
      {!list.length && <p className="muted">Sin registros.</p>}
      {list.map((row) => (
        <div className="entry" key={row.item.id}>
          <div className="entry-copy">
            <strong>{row.item.name}</strong>
            <p className="muted">{dateLabel(row.audit)}{row.item.presentation && ` · ${row.item.presentation}`}</p>
          </div>
          <span className="qty">{units(row)}</span>
        </div>
      ))}
    </section>
  );
  return (
    <>
      {section("Merma (echados a perder)", merma, (row) => row.item.merma)}
      {section("Faltantes (no aparecen)", lost, (row) => missing(row.item))}
    </>
  );
}
