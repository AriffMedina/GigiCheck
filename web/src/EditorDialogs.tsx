import type { Entry } from "./domain";
import { Button, ErrorNotice, Icon } from "./ui";
import { useEditor } from "./useEditor";
type State = ReturnType<typeof useEditor>;
export function EditorDialogs({
  state,
  onOpen,
  takePhoto,
}: {
  state: State;
  onOpen: (entry: Entry) => void;
  takePhoto: () => void;
}) {
  const { duplicate, draft, busy, error } = state;
  return (
    <>
      {state.reviewPhoto && (
        <div className="sheet-backdrop">
          <section
            className="sheet review"
            role="dialog"
            aria-modal="true"
            aria-label="Revisar fotografía"
          >
            {state.reviewUrl && (
              <img src={state.reviewUrl} alt="Fotografía pendiente de aceptar" />
            )}
            <div className="round-actions">
              <button
                className="round"
                aria-label="Tomar otra foto"
                disabled={busy}
                onClick={() => {
                  state.setReviewPhoto(null);
                  takePhoto();
                }}
              >
                <Icon name="close" size={32} />
              </button>
              <button
                className="round accept"
                aria-label="Usar esta foto"
                disabled={busy}
                onClick={() => void state.acceptPhoto()}
              >
                <Icon name="check" size={32} />
              </button>
            </div>
            <ErrorNotice message={error} />
          </section>
        </div>
      )}
      {duplicate && (
        <div className="sheet-backdrop">
          <section
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="duplicate-title"
          >
            <h2 id="duplicate-title">Posible duplicado</h2>
            <p>
              {duplicate.name} · {duplicate.presentation || "Sin especificar"}
            </p>
            <p className="muted">
              Existente: {duplicate.quantity} unidades. Nuevo:{" "}
              {draft.quantityInput}. Comprueba la presentación antes de decidir.
              Consolidar conserva la foto existente.
            </p>
            <Button secondary disabled={busy} onClick={() => onOpen(duplicate)}>
              Abrir existente
            </Button>
            <Button
              secondary
              disabled={busy}
              onClick={() => {
                const result = duplicate.quantity + Number(draft.quantityInput);
                if (
                  window.confirm(
                    `¿Confirmas sumar y guardar ${result} unidades? Se conserva la fotografía existente.`,
                  )
                )
                  void state.save({ mode: "sum", targetId: duplicate.id });
              }}
            >
              Sumar cantidades
            </Button>
            <Button
              secondary
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    `¿Confirmas reemplazar ${duplicate.quantity} por ${draft.quantityInput} unidades? Se conserva la fotografía existente.`,
                  )
                )
                  void state.save({ mode: "replace", targetId: duplicate.id });
              }}
            >
              Reemplazar cantidad
            </Button>
            <Button disabled={busy} onClick={() => void state.save()}>
              Guardar por separado
            </Button>
            <button
              className="small-link"
              disabled={busy}
              onClick={() => state.setDuplicate(null)}
            >
              Volver a revisar
            </button>
            <ErrorNotice message={error} />
          </section>
        </div>
      )}
    </>
  );
}
