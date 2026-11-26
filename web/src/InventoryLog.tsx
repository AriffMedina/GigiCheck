import { useState } from "react";
import { dateLabel } from "./domain";
import { missing, type LogDay, type LogRow } from "./inventory";
import { Icon } from "./ui";

const sum = (rows: LogRow[], units: (row: LogRow) => number) => rows.reduce((total, row) => total + units(row), 0);
const merma = (row: LogRow) => row.item.merma;
const lost = (row: LogRow) => missing(row.item);

function Section({ title, rows, units }: { title: string; rows: LogRow[]; units: (row: LogRow) => number }) {
  return (
    <section className="inventory-log" aria-label={title}>
      <h3>{title} · {sum(rows, units)} unidades</h3>
      {!rows.length && <p className="muted">Sin registros.</p>}
      {rows.map((row) => (
        <div className="entry" key={row.item.id}>
          <div className="entry-copy">
            <strong>{row.item.name}</strong>
            {row.item.presentation && <p className="muted">{row.item.presentation}</p>}
          </div>
          <span className="qty">{units(row)}</span>
        </div>
      ))}
    </section>
  );
}

// One row per inventory day, like the history; tapping a day shows only that day's losses.
export function InventoryLog({ days }: { days: LogDay[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const day = days.find((item) => item.date === open);
  if (day)
    return (
      <>
        <button className="small-link inventory-back" onClick={() => setOpen(null)}>← Todos los días</button>
        <h2>{dateLabel(day.audit)}</h2>
        <Section title="Merma (echados a perder)" rows={day.merma} units={merma} />
        <Section title="Faltantes (no aparecen)" rows={day.missing} units={lost} />
      </>
    );
  if (!days.length) return <p className="muted">Todavía no hay merma ni faltantes registrados.</p>;
  return (
    <>
      {days.map((item) => (
        <button key={item.date} className="entry" onClick={() => setOpen(item.date)}>
          <Icon name="history" />
          <div className="entry-copy">
            <strong>{dateLabel(item.audit)}</strong>
            <p className="muted">{sum(item.merma, merma)} merma · {sum(item.missing, lost)} faltantes</p>
          </div>
          <span aria-hidden="true">→</span>
        </button>
      ))}
    </>
  );
}
