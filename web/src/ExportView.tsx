import { useEffect, useState } from "react";
import { dateLabel, totals, type Entry, type Session } from "./domain";
import { createPdf, download } from "./pdf";
import { Button, ErrorNotice, Icon } from "./ui";

export function ExportView({
  session,
  rows,
}: {
  session: Session;
  rows: Entry[];
}) {
  const [photos, setPhotos] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const sum = totals(rows);
  // The PDF is rebuilt whenever the toggle or the report content changes, so the shared
  // file always matches what is on screen. Sharing needs it ready before the tap (iOS).
  useEffect(() => {
    let current = true;
    setFile(null);
    setError("");
    createPdf(session, rows, photos).then(
      (pdf) => current && setFile(pdf),
      (e: unknown) =>
        current &&
        setError(e instanceof Error ? e.message : "No se pudo generar el PDF."),
    );
    return () => {
      current = false;
    };
  }, [session.id, session.revision, photos]);
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
    <>
      <div className="preview">
        <strong>GigiCheck</strong>
        <h2>
          Conteo de
          <br />
          faltantes
        </h2>
        <p style={{ fontSize: 13 }}>{dateLabel(session)}</p>
        <div className="row" style={{ background: "#e4d7f3", padding: 8, fontWeight: 700 }}>
          <span>Producto</span>
          <b>Cantidad</b>
        </div>
        {rows.slice(0, 5).map((row) => (
          <div className="row" key={row.id}>
            <span>
              {row.name} · {row.presentation || "Sin especificar"}
            </span>
            <b>{row.quantity}</b>
          </div>
        ))}
        {rows.length > 5 && (
          <p style={{ fontSize: 12 }}>Y {rows.length - 5} productos más en el PDF.</p>
        )}
        <div className="preview-total">
          {sum.products} productos · {sum.units} unidades
        </div>
      </div>
      <label className="check-label">
        <span>Incluir fotos</span>
        <input
          type="checkbox"
          role="switch"
          checked={photos}
          onChange={(e) => setPhotos(e.target.checked)}
        />
      </label>
      <ErrorNotice message={error} />
      <Button disabled={!file} onClick={() => void share()}>
        <Icon name="share" />
        {file ? "Compartir PDF" : "Preparando PDF…"}
      </Button>
    </>
  );
}
