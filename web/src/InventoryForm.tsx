import { useState } from "react";
import { missing, surplus, type AuditItem } from "./inventory";
import { Button } from "./ui";

const amount = (text: string) => (/^\d+$/.test(text) ? Number(text) : NaN);

export function InventoryForm({ initial, onSave, onRemove, onCancel }: {
  initial: AuditItem;
  onSave: (item: AuditItem) => Promise<boolean>;
  onRemove: (item: AuditItem) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [presentation, setPresentation] = useState(initial.presentation);
  const [expected, setExpected] = useState(initial.name ? String(initial.expected) : "");
  const [counted, setCounted] = useState(initial.name ? String(initial.counted) : "");
  const [merma, setMerma] = useState(initial.merma);
  const [busy, setBusy] = useState(false);
  const found = Number.isNaN(amount(counted)) ? 0 : amount(counted);
  const item = { ...initial, name, presentation, expected: amount(expected), counted: amount(counted), merma: Math.min(merma, found) };
  const complete = !Number.isNaN(item.expected) && !Number.isNaN(item.counted);
  async function save() {
    setBusy(true);
    if (await onSave(item)) onCancel();
    setBusy(false);
  }
  return (
    <div className="sheet-backdrop">
      <section className="sheet inventory-form" role="dialog" aria-modal="true" aria-label="Producto del inventario">
        <h2>{initial.name ? "Editar producto" : "Agregar producto"}</h2>
        <label className="field">Nombre
          <input value={name} maxLength={200} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">Presentación (opcional)
          <input value={presentation} maxLength={200} onChange={(e) => setPresentation(e.target.value)} />
        </label>
        <div className="inventory-pair">
          <label className="field">Debe haber
            <input inputMode="numeric" placeholder="Sistema" value={expected} onChange={(e) => setExpected(e.target.value)} />
          </label>
          <label className="field">Contados
            <input inputMode="numeric" placeholder="Exhibición + bodega" value={counted} onChange={(e) => setCounted(e.target.value)} />
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
        <Button disabled={busy} onClick={() => void save()}>Guardar</Button>
        {initial.name && (
          <button className="small-link" onClick={() => onRemove(initial)}>Eliminar producto</button>
        )}
        <button className="small-link" onClick={onCancel}>Cancelar</button>
      </section>
    </div>
  );
}
