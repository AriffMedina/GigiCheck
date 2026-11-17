import { useEffect, useState } from "react";
import type { Entry, Session } from "./domain";
import { createPdf, download } from "./pdf";
import { Button, ErrorNotice, Icon } from "./ui";

export function ExportView({ session, rows }: { session: Session; rows: Entry[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  // iOS sharing needs the file ready before the user's tap.
  useEffect(() => {
    let current = true;
    setFile(null);
    setError("");
    createPdf(session, rows).then(
      (pdf) => current && setFile(pdf),
      (e: unknown) => current && setError(e instanceof Error ? e.message : "No se pudo generar el PDF."),
    );
    return () => { current = false; };
  }, [session.id, session.revision, rows]);
  async function share() {
    if (!file) return;
    setError("");
    try {
      if (navigator.canShare?.({ files: [file] }))
        await navigator.share({ files: [file], title: "Conteo de faltantes" });
      else download(file);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError("No se pudo compartir. Reintenta.");
    }
  }
  return (
    <section className="warehouse-export" aria-label="Compartir conteo">
      <ErrorNotice message={error} />
      <Button secondary disabled={!file} onClick={() => void share()}>
        <Icon name="share" />
        {file ? "Compartir conteo" : "Preparando PDF…"}
      </Button>
    </section>
  );
}
