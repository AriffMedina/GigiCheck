import { useEffect, useState } from "react";
import { countTab, type Draft, type Entry, type Session } from "./domain";
import * as repo from "./repository";
import { lastCount, rememberCount } from "./lastCount";
export type Page = "count" | "history" | "editor" | "finish" | "inventory";
export function useWorkspaceData() {
  const [all, setAll] = useState<Session[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [rows, setRows] = useState<Entry[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [page, setPage] = useState<Page>("count");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [undo, setUndo] = useState<Entry | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const session = all.find((item) => item.id === selected) ?? null;
  async function refresh(preferred?: string) {
    const list = await repo.sessions();
    const next =
      preferred ??
      selected ??
      countTab(list, lastCount())?.id ??
      null;
    rememberCount(next);
    setAll(list);
    setSelected(next);
    if (next) {
      const [products, pending] = await Promise.all([
        repo.entries(next),
        repo.getDraft(next),
      ]);
      setRows(products);
      setDraft(pending);
    } else {
      setRows([]);
      setDraft(null);
    }
    setLoading(false);
    return list;
  }
  async function action(work: () => Promise<void>) {
    setError("");
    try {
      await work();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar. Revisa el espacio disponible y reintenta.",
      );
    }
  }
  useEffect(() => {
    void refresh().catch(() => {
      setLoading(false);
      setError(
        "No se pudo abrir el almacenamiento. Desactiva la navegación privada o libera espacio y recarga.",
      );
    });
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => {
      setUndo(null);
      void repo
        .cleanPhotos()
        .catch(() =>
          setError(
            "No se pudieron limpiar fotos sin uso. Tus productos siguen guardados.",
          ),
        );
    }, 8000);
    return () => clearTimeout(timer);
  }, [undo]);
  return {
    all,
    setAll,
    selected,
    setSelected,
    rows,
    setRows,
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
  };
}
