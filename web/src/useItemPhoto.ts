import { useEffect, useRef, useState } from "react";
import { identify, type Suggestion } from "./ai";
import { db } from "./db";
import { id } from "./domain";
import { compressImage } from "./photos";

// Same photo → AI flow as the count editor, for an inventory item that is not saved yet.
export function useItemPhoto(
  itemId: string,
  initial: string | null,
  onSuggest: (suggestion: Suggestion) => void,
  setError: (message: string) => void,
) {
  const [photo, setPhoto] = useState(initial);
  const [analyzing, setAnalyzing] = useState(false);
  const revision = useRef(0);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function pick(file: File) {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      abort.abort();
    }, 45000);
    setError("");
    try {
      const photoId = id();
      await (await db()).put("photos", { id: photoId, blob: await compressImage(file) });
      if (abort.signal.aborted) return;
      setPhoto(photoId);
      setAnalyzing(true);
      const { suggestion } = await identify(
        { id: itemId, photo: photoId, imageRevision: ++revision.current }, id(), abort.signal);
      if (!abort.signal.aborted) onSuggest(suggestion);
    } catch (error) {
      // A replaced photo or closed form aborts silently; only real failures and timeouts are shown.
      if (timedOut) setError("No hubo respuesta de la IA. Completa los datos.");
      else if (!abort.signal.aborted)
        setError(error instanceof Error ? error.message : "No se pudo identificar. Completa los datos.");
    } finally {
      clearTimeout(timer);
      if (controller.current === abort) setAnalyzing(false);
    }
  }
  return { photo, analyzing, pick };
}
