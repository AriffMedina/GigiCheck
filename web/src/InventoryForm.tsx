import { useEffect, useRef, useState } from "react";
import SpinnerEllipsis from "@/components/premium/spinner-05/spinner-05";
import { missing, surplus, type AuditItem } from "./inventory";
import { Button, ErrorNotice, Photo } from "./ui";
import { useItemPhoto } from "./useItemPhoto";

const amount = (text: string) => (/^\d+$/.test(text) ? Number(text) : NaN);
// Keeps only digits so letters, signs or decimals can never reach a quantity.
const digits = (text: string) => text.replace(/\D/g, "").slice(0, 4);

export function InventoryForm({ initial, onSave, onRemove, onCancel }: {
  initial: AuditItem;
  onSave: (item: AuditItem) => Promise<boolean>;
  onRemove: (item: AuditItem) => void;
  onCancel: () => void;
}) {
  const isNew = !initial.name;
  const [name, setName] = useState(initial.name);
  const [presentation, setPresentation] = useState(initial.presentation);
  const [expected, setExpected] = useState(isNew ? "" : String(initial.expected));
  const [counted, setCounted] = useState(isNew ? "" : String(initial.counted));
  const [merma, setMerma] = useState(initial.merma);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const camera = useItemPhoto(initial.id, initial.photo, (s) => {
    // Fills only fields still empty, like the count editor.
    setName((value) => value || s.name || "");
    setPresentation((value) => value || [s.brand, s.presentation].filter(Boolean).join(" · "));
  }, setError);
  // A new product starts with the camera, like the count editor.
  useEffect(() => {
    if (isNew) input.current?.click();
  }, []);
  const found = Number.isNaN(amount(counted)) ? 0 : amount(counted);
  const item = { ...initial, name, presentation, photo: camera.photo,
    expected: amount(expected), counted: amount(counted), merma: Math.min(merma, found) };
  const complete = !Number.isNaN(item.expected) && !Number.isNaN(item.counted);
  async function save() {
    setBusy(true);
    if (await onSave(item)) onCancel();
    setBusy(false);
  }
  return (
    <div className="sheet-backdrop">
      <section className="sheet inventory-form" role="dialog" aria-modal="true" aria-label="Producto del inventario">
        <div className="row">
          <div>
            <h2>{isNew ? "Agregar producto" : "Editar producto"}</h2>
            <p className="muted flex items-center gap-2">
              {camera.analyzing ? <>Identificando <SpinnerEllipsis /></> : "Toma una foto para rellenar los datos"}
            </p>
          </div>
          <button className="photo-button" aria-label="Fotografiar producto" onClick={() => input.current?.click()}>
            <Photo id={camera.photo} />
          </button>
        </div>
        <input ref={input} type="file" accept="image/*" capture="environment" hidden aria-label="Fotografiar un producto"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void camera.pick(file);
            e.target.value = "";
          }} />
        <label className="field">Nombre
          <input value={name} maxLength={200} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">Presentación (opcional)
          <input value={presentation} maxLength={200} onChange={(e) => setPresentation(e.target.value)} />
        </label>
        <div className="inventory-pair">
          <label className="field">Debe haber
            <input inputMode="numeric" pattern="[0-9]*" placeholder="Sistema" value={expected}
              onChange={(e) => setExpected(digits(e.target.value))} />
          </label>
          <label className="field">Contados
            <input inputMode="numeric" pattern="[0-9]*" placeholder="Exhibición + bodega" value={counted}
              onChange={(e) => setCounted(digits(e.target.value))} />
          </label>
        </div>
        {found > 0 && (
          <label className="field">Merma (echados a perder): {item.merma} de {found}
            <input type="range" min={0} max={found} value={item.merma} onChange={(e) => setMerma(Number(e.target.value))} />
          </label>
        )}
        {complete && (
          <p className="inventory-result" aria-live="polite">
            {missing(item) ? `Faltan ${missing(item)} (no aparecen)` : surplus(item) ? `Sobran ${surplus(item)}` : "Cuadra con el sistema"}
          </p>
        )}
        <ErrorNotice message={error} />
        <Button disabled={busy} onClick={() => void save()}>Guardar</Button>
        {!isNew && <button className="small-link" onClick={() => onRemove(initial)}>Eliminar producto</button>}
        <button className="small-link" onClick={onCancel}>Cancelar</button>
      </section>
    </div>
  );
}
