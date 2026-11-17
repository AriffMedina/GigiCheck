import { dateLabel, totals, type Entry, type Session } from "./domain";
import { Button, Icon, Photo } from "./ui";
import { Lily } from "./Lily";

export function CountView({
  session,
  rows,
  onAdd,
  onEdit,
  onFinish,
  onCancel,
}: {
  session: Session;
  rows: Entry[];
  onAdd: () => void;
  onEdit: (e: Entry) => void;
  onFinish: () => void;
  onCancel: () => void;
}) {
  const sum = totals(rows);
  return (
    <>
      <div className="hero">
        <h1>Mi conteo.</h1>
        <Lily className="count-lily" />
        <p className="date">{dateLabel(session)}</p>
      </div>
      <div className="totals">
        <span>{sum.products} productos</span>
        <span>{sum.units} unidades</span>
      </div>
      <hr className="rule" />
      <div>
        {!rows.length ? (
          <p className="muted empty">Agrega tu primer producto.</p>
        ) : (
          rows.map((row) => (
            <button
              className="entry"
              key={row.id}
              onClick={() => onEdit(row)}
              aria-label={`${row.name}, ${row.quantity} unidades. Revisar`}
            >
              <Photo id={row.photo} />
              <div className="entry-copy">
                <strong>{row.name}</strong>
                <p className="muted">{row.presentation || row.brand}</p>
              </div>
              <span className="qty">{row.quantity}</span>
            </button>
          ))
        )}
      </div>
      <div className="actions">
        <Button onClick={onAdd}>
          <Icon name="camera" />
          Agregar producto
        </Button>
        <Button secondary disabled={!rows.length} onClick={onFinish}>
          Finalizar conteo
        </Button>
        <button className="small-link" onClick={onCancel}>
          Cancelar conteo
        </button>
      </div>
    </>
  );
}
