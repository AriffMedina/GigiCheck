import { useEffect, useRef } from "react";
import { stepQuantity } from "./domain";
import { Button, ErrorNotice, Icon, Photo } from "./ui";
import { useEditor, type EditorProps } from "./useEditor";
import { EditorDialogs } from "./EditorDialogs";

const ROWS = [
  ["name", "Nombre"],
  ["brand", "Marca"],
  ["presentation", "Presentación"],
  ["category", "Categoría"],
] as const;

export function Editor(props: EditorProps) {
  const state = useEditor(props);
  const { draft, busy, analyzing } = state;
  const input = useRef<HTMLInputElement>(null);
  const takePhoto = () => input.current?.click();
  // A new product starts with the camera; browsers that block it fall back to the thumbnail button.
  useEffect(() => {
    if (!draft.photo && !draft.editingEntryId && !draft.name) takePhoto();
  }, []);
  const step = (delta: number) =>
    state.change({ quantityInput: stepQuantity(draft.quantityInput, delta) });
  return (
    <>
      <div className="row">
        <button
          className="icon-button"
          aria-label="Volver al conteo"
          onClick={() => void state.leave()}
        >
          <Icon name="back" />
        </button>
        <h2>{draft.editingEntryId ? "Editar producto" : "Revisar producto"}</h2>
        <span className="icon-button" />
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        aria-label="Fotografiar un producto"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void state.selectPhoto(file);
          event.target.value = "";
        }}
      />
      <div className="row ai-head">
        <div>
          <h3>
            <span className="soft">✦</span> Sugerencia de IA
          </h3>
          <p className="muted">
            {analyzing ? "Identificando…" : "Revisa antes de agregar"}
          </p>
        </div>
        <button
          className="photo-button"
          aria-label="Cambiar fotografía"
          disabled={busy}
          onClick={takePhoto}
        >
          <Photo id={draft.photo} large />
        </button>
      </div>
      <div className="rows">
        {ROWS.map(([key, label]) => (
          <label className="frow" key={key}>
            <span>{label}</span>
            <input
              maxLength={200}
              value={draft[key]}
              disabled={busy}
              aria-label={label}
              onChange={(event) => state.change({ [key]: event.target.value })}
            />
            <Icon name="chevron" size={20} />
          </label>
        ))}
      </div>
      <div className="qty-block">
        <h3>Unidades faltantes</h3>
        <div className="stepper">
          <button aria-label="Menos" disabled={busy} onClick={() => step(-1)}>
            −
          </button>
          <input
            aria-label="Unidades faltantes"
            inputMode="numeric"
            pattern="[0-9]*"
            value={draft.quantityInput}
            disabled={busy}
            onChange={(event) =>
              state.change({
                quantityInput: event.target.value.replace(/\D/g, "").slice(0, 3),
              })
            }
          />
          <button aria-label="Más" disabled={busy} onClick={() => step(1)}>
            +
          </button>
        </div>
        <p className="muted">Cantidad escrita por ti</p>
      </div>
      <ErrorNotice message={state.error} />
      <Button disabled={busy} onClick={state.commit}>
        {busy
          ? "Guardando…"
          : draft.editingEntryId
            ? "Guardar cambios"
            : "Confirmar y agregar"}
      </Button>
      {draft.editingEntryId && (
        <button
          className="small-link"
          disabled={busy}
          onClick={() => {
            const row = props.rows.find(
              (item) => item.id === draft.editingEntryId,
            );
            if (row) props.onDelete(row);
          }}
        >
          Eliminar producto
        </button>
      )}
      <EditorDialogs
        state={state}
        onOpen={props.onOpen}
        takePhoto={takePhoto}
      />
    </>
  );
}
