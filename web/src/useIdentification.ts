import { useEffect, useRef, useState, type RefObject } from "react";
import { id, type Draft } from "./domain";
import { identify } from "./ai";

export function useIdentification(
  latest: RefObject<Draft>,
  change: (patch: Partial<Draft>) => void,
  setError: (message: string) => void,
) {
  const alive = useRef(true);
  const locked = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      controller.current?.abort();
    };
  }, []);
  // Runs right after a photo is accepted; fills only fields the user hasn't typed yet.
  async function analyze() {
    if (locked.current || !latest.current.photo) return;
    locked.current = true;
    setError("");
    const before = { ...latest.current };
    const abort = new AbortController();
    controller.current = abort;
    setAnalyzing(true);
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      abort.abort();
    }, 30000);
    try {
      const { suggestion } = await identify(before, id(), abort.signal);
      // Stale-response guard: ignore results for another draft or photo.
      if (
        !alive.current ||
        abort.signal.aborted ||
        latest.current.id !== before.id ||
        latest.current.imageRevision !== before.imageRevision
      )
        return;
      const patch: Partial<Draft> = { source: "ai_assisted" };
      for (const key of ["name", "brand", "presentation", "category"] as const)
        if (suggestion[key] !== null && latest.current[key] === "")
          patch[key] = suggestion[key];
      change(patch);
    } catch (error) {
      // A manual cancel (leaving, saving) is silent; only a timeout is reported.
      if (alive.current && (timedOut || !abort.signal.aborted))
        setError(
          timedOut
            ? "No hubo respuesta de la IA. Completa los datos."
            : error instanceof Error
              ? error.message
              : "No se pudo identificar. Completa los datos.",
        );
    } finally {
      clearTimeout(timeout);
      locked.current = false;
      if (alive.current) setAnalyzing(false);
    }
  }
  return { analyzing, analyze, cancel: () => controller.current?.abort() };
}
