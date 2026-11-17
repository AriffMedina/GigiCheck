import { Checklist } from "./Checklist";
import { ExportView } from "./ExportView";
import { dateLabel, totals, type BringChange, type Entry, type Session } from "./domain";
import { Snoopy } from "./Snoopy";
import Widget11 from "@/components/premium/widget-11/widget11";

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
          <Widget11 percent={percent} label="Unidades bajadas de bodega" />
          <Snoopy className="warehouse-snoopy" />
        </div>
        <p className="warehouse-summary" aria-live="polite">
          <span>{brought} de {units} unidades bajadas</span>
          <strong>{left ? `Faltan ${left}` : "¡Lista completa!"}</strong>
        </p>
      </section>
      <Checklist rows={rows} onBring={onBring} />
      <ExportView session={session} rows={rows} />
      <button className="small-link warehouse-new" onClick={onBack}>Iniciar otro conteo</button>
    </>
  );
}
