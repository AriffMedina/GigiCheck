import { useState } from "react";
import { Backdrop } from "./Backdrop";
import { CountView } from "./CountView";
import { Editor } from "./Editor";
import { FinishView } from "./FinishView";
import { History } from "./History";
import { InventoryView } from "./InventoryView";
import { Home } from "./Home";
import { Lily } from "./Lily";
import { ErrorNotice, Icon } from "./ui";
import { useWorkspace } from "./useWorkspace";

export default function App() {
  const app = useWorkspace();
  const { session, draft, rows, page } = app;
  // Inventory opened from the shared history; null means "the active one".
  const [auditId, setAuditId] = useState<string | null>(null);
  const showInventory = (id: string | null) => {
    setAuditId(id);
    app.navigate("inventory");
  };
  let content;
  if (app.loading) content = <p className="muted">Abriendo tus conteos…</p>;
  else if (page === "inventory") content = <InventoryView key={auditId ?? "active"} auditId={auditId} />;
  else if (page === "history")
    content = <History sessions={app.all} onOpen={app.open} onOpenAudit={showInventory} />;
  else if (page === "editor" && draft)
    content = (
      <Editor
        key={draft.id}
        initial={draft}
        rows={rows}
        onDone={app.done}
        onDelete={app.remove}
        onOpen={app.openExisting}
      />
    );
  else if (session?.status === "closed")
    content = (
      <FinishView
        session={session}
        rows={rows}
        onBring={app.bring}
        onBack={app.start}
      />
    );
  else if (session?.status === "active")
    content = (
      <CountView
        session={session}
        rows={rows}
        onAdd={app.add}
        onEdit={app.edit}
        onFinish={app.finish}
        onCancel={app.deleteCount}
      />
    );
  const home = !content;
  if (home) content = <Home onStart={app.start} />;
  return (
    <div className="app">
      <Backdrop dim={!home} />
      <header className="topbar">
        <div className="wordmark">
          Gigi<span>Check</span>
        </div>
        <Lily className="brand-lily" />
      </header>
      <main className="content">
        {!app.online && (
          <p className="notice muted" role="status">
            Sin conexión. Tu conteo y el PDF siguen disponibles.
          </p>
        )}
        <ErrorNotice message={app.error} />
        {content}
      </main>
      {page !== "editor" && (
        <nav className="nav" aria-label="Navegación principal">
          <button
            className={page === "count" || page === "finish" ? "active" : ""}
            onClick={() => app.navigate("count")}
          >
            <Icon name="home" />
            Conteo
          </button>
          <button
            className={page === "inventory" ? "active" : ""}
            onClick={() => showInventory(null)}
          >
            <Icon name="box" />
            Inventario
          </button>
          <button
            className={page === "history" ? "active" : ""}
            onClick={() => app.navigate("history")}
          >
            <Icon name="history" />
            Historial
          </button>
        </nav>
      )}
      {app.undo && (
        <div className="toast" role="status">
          <span>Producto eliminado</span>
          <button onClick={app.undoRemove}>Deshacer</button>
        </div>
      )}
    </div>
  );
}
