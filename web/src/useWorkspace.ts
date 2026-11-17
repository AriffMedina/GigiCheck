import { blankDraft, currentCount, type BringChange, type Entry } from "./domain";
import * as repo from "./repository";
import { useWorkspaceData, type Page } from "./useWorkspaceData";
export type { Page } from "./useWorkspaceData";
export function useWorkspace() {
  const data = useWorkspaceData();
  const {
    all,
    setSelected,
    rows,
    draft,
    setDraft,
    page,
    setPage,
    loading,
    error,
    setError,
    undo,
    setUndo,
    online,
    session,
    refresh,
    action,
  } = data;
  const show = (next: Page) => {
    setPage(next);
    window.scrollTo(0, 0);
  };
  // Closed counts open in bodega while their original product list stays unchanged.
  const open = (sessionId: string) => {
    void action(async () => {
      const list = await refresh(sessionId);
      const closed = list.find((item) => item.id === sessionId)?.status === "closed";
      show(closed ? "finish" : "count");
    });
  };
  const start = () => {
    void action(async () => {
      const list = await repo.sessions();
      const active = list.find((item) => item.status === "active");
      await refresh(active?.id ?? await repo.createSession());
      show("count");
    });
  };
  async function editingDraft(entry: Entry) {
    const next = {
      ...blankDraft(entry.sessionId),
      name: entry.name,
      brand: entry.brand,
      presentation: entry.presentation,
      category: entry.category,
      quantityInput: String(entry.quantity),
      note: entry.note,
      photo: entry.photo,
      source: entry.source,
      editingEntryId: entry.id,
    };
    await repo.saveDraft(next);
    setDraft(next);
    show("editor");
  }
  function add() {
    if (!session) return;
    void action(async () => {
      const next = draft ?? blankDraft(session.id);
      await repo.saveDraft(next);
      setDraft(next);
      show("editor");
    });
  }
  function edit(entry: Entry) {
    if (session?.status !== "active") {
      setError("Reabre el conteo para editar sus productos.");
      return;
    }
    void action(async () => {
      if (draft) {
        show("editor");
        setError(
          "Tienes un borrador pendiente. Confírmalo o descártalo antes de editar otro producto.",
        );
        return;
      }
      await editingDraft(entry);
    });
  }
  function remove(entry: Entry) {
    if (
      !window.confirm(
        `¿Eliminar ${entry.name}? Podrás deshacer durante 8 segundos.`,
      )
    )
      return;
    void action(async () => {
      await repo.markDeleted(entry);
      if (draft?.editingEntryId === entry.id) await repo.discardDraft(draft);
      setUndo(entry);
      await refresh();
      show("count");
    });
  }
  function navigate(next: Page) {
    if (page === "editor") {
      setError(
        "Usa la flecha para volver al conteo y guardar tu borrador.",
      );
      return;
    }
    setError("");
    if (next === "count")
      void action(async () => {
        await refresh(currentCount(await repo.sessions())?.id ?? "");
        show("count");
      });
    else show(next);
  }
  function deleteCount() {
    if (
      !session ||
      !window.confirm(
        "¿Cancelar este conteo? Se eliminarán sus productos y no se puede deshacer.",
      )
    )
      return;
    void action(async () => {
      await repo.deleteSession(session.id);
      setSelected(null);
      await refresh("");
      show("count");
    });
  }
  function finish() {
    if (!session) return;
    const unsaved = draft && (draft.name || draft.photo);
    if (unsaved && !window.confirm("Hay un producto sin confirmar. ¿Finalizar sin agregarlo?"))
      return;
    void action(async () => {
      if (draft) await repo.discardDraft(draft);
      await repo.changeStatus(session, "closed");
      await refresh();
      show("finish");
    });
  }
  const bring = (entry: Entry, change: BringChange) => {
    void action(async () => {
      await repo.bring(entry.id, change);
      await refresh();
    });
  };
  function openExisting(entry: Entry) {
    if (
      !window.confirm(
        "¿Descartar el borrador nuevo y abrir el producto existente?",
      )
    )
      return;
    void action(async () => {
      if (draft) await repo.discardDraft(draft);
      await editingDraft(entry);
    });
  }
  const done = () => {
    void action(async () => {
      await refresh();
      show("count");
    });
  };
  const undoRemove = () => {
    if (undo)
      void action(async () => {
        await repo.markDeleted(undo, true);
        setUndo(null);
        await refresh();
      });
  };
  return {
    all,
    session,
    rows,
    draft,
    page,
    loading,
    error,
    undo,
    online,
    open,
    start,
    add,
    edit,
    remove,
    navigate,
    deleteCount,
    finish,
    bring,
    openExisting,
    done,
    undoRemove,
  };
}
