import { CountView } from "./CountView";
import { Editor } from "./Editor";
import { FinishView } from "./FinishView";
import { History } from "./History";
import { Home } from "./Home";
import { ErrorNotice, Icon } from "./ui";
import { useWorkspace } from "./useWorkspace";

export default function App() {
  const app = useWorkspace();
  const { session, draft, rows, page } = app;
  let content;
  if (app.loading) content = <p className="muted">Abriendo tus conteos…</p>;
  else if (page === "history")
    content = <History sessions={app.all} onOpen={app.open} />;
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
  else if (page === "finish" && session)
    content = (
      <FinishView
        session={session}
        rows={rows}
        onBring={app.bring}
        onBack={() => app.navigate("count")}
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
  else content = <Home onStart={app.start} />;
  return (
    <div className="app">
      <header className="topbar">
        <div className="wordmark">
          Gigi<span>Check</span>
        </div>
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
            className={page === "count" ? "active" : ""}
            onClick={() => app.navigate("count")}
          >
            <Icon name="home" />
            Conteo
          </button>
          <button
            className={page === "history" || page === "finish" ? "active" : ""}
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
