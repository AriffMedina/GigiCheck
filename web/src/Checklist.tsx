import { useState } from "react";
import { pending, type Entry } from "./domain";

function Item({ row, onBring }: { row: Entry; onBring: (add: number) => void }) {
  const [text, setText] = useState("");
  const left = pending(row);
  const done = left === 0;
  const amount = /^\d+$/.test(text) ? Number(text) : 0;
  return (
    <li className={done ? "done" : ""}>
      {/* Tapping the name strikes the whole item (or undoes it). */}
      <button
        className="item-main"
        aria-pressed={done}
        onClick={() => onBring(done ? -row.quantity : left)}
      >
        <span className="item-name">
          {row.name}
          {row.presentation && ` · ${row.presentation}`}
        </span>
        <b>{done ? "Listo" : `Faltan ${left}`}</b>
      </button>
      {!done && (
        <form
          className="bring"
          onSubmit={(e) => {
            e.preventDefault();
            if (!amount) return;
            onBring(amount);
            setText("");
          }}
        >
          <input
            aria-label={`Unidades que bajé de ${row.name}`}
            inputMode="numeric"
            placeholder="Bajé"
            value={text}
            onChange={(e) => setText(e.target.value.replace(/\D/g, "").slice(0, 3))}
          />
          <button type="submit" disabled={!amount}>
            Registrar
          </button>
        </form>
      )}
    </li>
  );
}

export const Checklist = ({
  rows,
  onBring,
}: {
  rows: Entry[];
  onBring: (row: Entry, add: number) => void;
}) => (
  <section className="stack">
    <h2>Bodega</h2>
    <ul className="checklist">
      {rows.map((row) => (
        <Item key={row.id} row={row} onBring={(add) => onBring(row, add)} />
      ))}
    </ul>
  </section>
);
