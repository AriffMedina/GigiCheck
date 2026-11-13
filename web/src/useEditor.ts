import { useEffect, useRef, useState } from "react";
import { id, sameIdentity, validate, type Draft, type Entry } from "./domain";
import * as repo from "./repository";
import { compressImage } from "./photos";
import { useIdentification } from "./useIdentification";

export interface EditorProps {
  initial: Draft;
  rows: Entry[];
  onDone: () => void;
  onDelete: (entry: Entry) => void;
  onOpen: (entry: Entry) => void;
}
export function useEditor({ initial, rows, onDone }: EditorProps) {
  const [draft, setDraft] = useState(initial);
  const latest = useRef(initial);
  const queue = useRef(Promise.resolve());
  const alive = useRef(true);
  const locked = useRef(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [duplicate, setDuplicate] = useState<Entry | null>(null);
  const [reviewPhoto, setReviewPhoto] = useState<Blob | null>(null);
  const [reviewUrl, setReviewUrl] = useState<string | null>(null);
  const ai = useIdentification(latest, change, setError);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      ai.cancel();
    };
  }, []);
  useEffect(() => {
    if (!reviewPhoto) {
      setReviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(reviewPhoto);
    setReviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [reviewPhoto]);
  function change(patch: Partial<Draft>) {
    if ("photo" in patch) ai.cancel();
    const next = {
      ...latest.current,
      ...patch,
      formRevision: latest.current.formRevision + 1,
    };
    latest.current = next;
    setDraft(next);
    // A later edit retries a failed autosave with the complete current form.
    queue.current = queue.current
      .catch(() => undefined)
      .then(() => repo.saveDraft(next));
    void queue.current.catch(() => {
        if (alive.current)
          setError(
            "No se pudo guardar el borrador. Reintenta; no cierres la app.",
          );
    });
  }
  async function persistLatest() {
    await queue.current.catch(() => undefined);
    await repo.saveDraft(latest.current);
  }
  async function leave() {
    ai.cancel();
    setError("");
    try {
      await persistLatest();
      onDone();
    } catch {
      setError(
        "No se pudo guardar. Mantén este formulario abierto y reintenta.",
      );
    }
  }
  async function save(merge?: repo.Merge) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    ai.cancel();
    setError("");
    try {
      await persistLatest();
      await repo.confirm(latest.current, merge);
      onDone();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar. Reintenta.",
      );
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  function commit() {
    setError("");
    try {
      validate(latest.current);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Revisa los datos.");
      return;
    }
    const found = rows.find(
      (row) => row.id !== draft.editingEntryId && sameIdentity(row, draft),
    );
    if (found && !draft.editingEntryId) {
      setDuplicate(found);
      return;
    }
    void save();
  }
  async function selectPhoto(file: File) {
    setError("");
    try {
      setReviewPhoto(await compressImage(file));
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "No se pudo abrir la foto.",
      );
    }
  }
  async function acceptPhoto() {
    if (!reviewPhoto || locked.current) return;
    locked.current = true;
    ai.cancel();
    setBusy(true);
    try {
      await persistLatest();
      const next = {
        ...latest.current,
        photo: id(),
        imageRevision: latest.current.imageRevision + 1,
        formRevision: latest.current.formRevision + 1,
      };
      await repo.saveDraft(next, reviewPhoto);
      latest.current = next;
      setDraft(next);
      setReviewPhoto(null);
        void ai.analyze();
    } catch {
      setError(
        "No se pudo guardar la fotografía. Revisa el espacio disponible y reintenta.",
      );
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return {
    draft,
    error,
    busy,
    analyzing: ai.analyzing,
    duplicate,
    reviewPhoto,
    reviewUrl,
    change,
    leave,
    save,
    commit,
    selectPhoto,
    acceptPhoto,
    setDuplicate,
    setReviewPhoto,
  };
}
