import { Checklist } from "./Checklist";
import { ExportView } from "./ExportView";
import type { Entry, Session } from "./domain";
import { Button, Icon } from "./ui";

export function FinishView({
  session,
  rows,
  onBring,
  onBack,
}: {
  session: Session;
  rows: Entry[];
  onBring: (row: Entry, add: number) => void;
  onBack: () => void;
}) {
  return (
    <>
      <div className="row">
        <button className="icon-button" onClick={onBack} aria-label="Volver">
          <Icon name="back" />
        </button>
        <h2>Compartir conteo</h2>
        <span className="icon-button" />
      </div>
      <ExportView session={session} rows={rows} />
      <hr className="rule" />
      <Checklist rows={rows} onBring={onBring} />
      <Button secondary onClick={onBack}>
        Volver al conteo
      </Button>
    </>
  );
}
