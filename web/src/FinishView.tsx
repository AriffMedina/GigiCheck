import { Checklist } from "./Checklist";
import { ExportView } from "./ExportView";
import { dateLabel, totals, type BringChange, type Entry, type Session } from "./domain";
import { Snoopy } from "./Snoopy";

export function FinishView({ session, rows, onBring, onBack }: {
  session: Session;
  rows: Entry[];
  onBring: (row: Entry, change: BringChange) => void;
  onBack: () => void;
}) {
  const units = totals(rows).units;
  const brought = rows.reduce((sum, row) => sum + row.brought, 0);
  const percent = units ? Math.round(brought / units * 100) : 0;
  const left = units - brought;
  return (
    <>
      <section className="warehouse-hero" aria-labelledby="warehouse-title">
        <p className="warehouse-date">{dateLabel(session)}</p>
        <h1 id="warehouse-title">{units > 0 && !left ? "Todo en orden." : "En bodega"}</h1>
        <div className="warehouse-progress">
          <div className="warehouse-gauge" role="img" aria-label={`${percent}% completado, ${brought} de ${units} unidades bajadas`}>
            <svg viewBox="0 0 220 124" aria-hidden="true">
              <path className="gauge-track" d="M20 110a90 90 0 0 1 180 0" pathLength="100" />
              <path className="gauge-fill" d="M20 110a90 90 0 0 1 180 0" pathLength="100"
                strokeDasharray={`${percent} 100`} />
            </svg>
            <div><strong>{percent}%</strong><span>completado</span></div>
          </div>
          <Snoopy className="warehouse-snoopy" />
        </div>
        <p className="warehouse-summary" aria-live="polite">
          <span>{brought} de {units} unidades bajadas</span>
          <strong>{left ? `Faltan ${left}` : "¡Lista completa!"}</strong>
        </p>
      </section>
      <Checklist rows={rows} onBring={onBring} />
      <p className="saved warehouse-saved"><span className="status-dot" />Guardado en tu teléfono</p>
      <ExportView session={session} rows={rows} />
      <button className="small-link warehouse-new" onClick={onBack}>Iniciar otro conteo</button>
    </>
  );
}
