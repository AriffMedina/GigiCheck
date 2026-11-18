import { useState } from "react";
import { byName, pending, type BringChange, type Entry } from "./domain";
import { Photo, SearchField } from "./ui";

function Item({ row, onBring }: { row: Entry; onBring: (change: BringChange) => void }) {
  const left = pending(row);
  const done = left === 0;
  return (
    <li className={`warehouse-item ${done ? "is-complete" : ""}`}>
      <div className="warehouse-product">
        <Photo id={row.photo} />
        <div className="warehouse-copy">
          <h3>{row.name}</h3>
          <p>{row.presentation || row.brand || "Sin presentación"}</p>
          <p className="warehouse-status">
            {done ? "Todo bajado" : `Faltan ${left}`}<span> · {row.brought} de {row.quantity}</span>
          </p>
        </div>
      </div>
      <div className="warehouse-controls">
        <button className="warehouse-minus" disabled={row.brought === 0}
          aria-label={`Restar una unidad bajada de ${row.name}`} onClick={() => onBring(-1)}>−</button>
        <div className="warehouse-value" aria-live="polite">
          <strong>{row.brought}</strong><span>Bajadas</span>
        </div>
        <button className="warehouse-plus" disabled={done}
          aria-label={`Bajar una unidad de ${row.name}`} onClick={() => onBring(1)}>+1</button>
        <label className="warehouse-all">
          <input type="checkbox" checked={done}
            aria-label={`Marcar todas las unidades de ${row.name} como bajadas`}
            onChange={() => onBring(done ? "none" : "all")} />
          <span>Todo</span>
        </label>
      </div>
    </li>
  );
}

export function Checklist({ rows, onBring }: {
  rows: Entry[];
  onBring: (row: Entry, change: BringChange) => void;
}) {
  const [query, setQuery] = useState("");
  const shown = byName(rows, query);
  return (
    <section className="warehouse-list" aria-label="Productos para bajar de bodega">
      {rows.length > 1 && <SearchField value={query} onChange={setQuery} />}
      {!shown.length && <p className="muted empty">Ningún producto coincide.</p>}
      <ul className="checklist warehouse-checklist">
        {shown.map((row) => <Item key={row.id} row={row} onBring={(add) => onBring(row, add)} />)}
      </ul>
    </section>
  );
}
