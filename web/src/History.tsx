import { dateLabel, type Session } from "./domain";
import { Icon } from "./ui";

export function History({
  sessions,
  onOpen,
}: {
  sessions: Session[];
  onOpen: (id: string) => void;
}) {
  return (
    <>
      <h1>Tu historial.</h1>
      {!sessions.length && <p className="muted">No tienes conteos anteriores.</p>}
      {sessions.map((item) => (
        <button key={item.id} className="entry" onClick={() => onOpen(item.id)}>
          <Icon name="history" />
          <div className="entry-copy">
            <strong>{dateLabel(item)}</strong>
            <p className="muted">
              {item.status === "active" ? "En curso" : "Finalizado"}
            </p>
          </div>
          <span aria-hidden="true">→</span>
        </button>
      ))}
    </>
  );
}
