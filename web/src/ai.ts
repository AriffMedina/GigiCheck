import { db } from "./db";
import type { Draft } from "./domain";
import { compressImage } from "./photos";
export interface Suggestion {
  name: string | null;
  brand: string | null;
  presentation: string | null;
  category: string | null;
  warnings: string[];
}
export interface Result {
  requestId: string;
  imageRevision: number;
  status: "identified" | "uncertain" | "unreadable";
  suggestion: Suggestion;
}
function object(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}
export function parseResult(value: unknown): Result {
  if (
    !object(value) ||
    Object.keys(value).length !== 4 ||
    typeof value.requestId !== "string" ||
    !Number.isInteger(value.imageRevision) ||
    !["identified", "uncertain", "unreadable"].includes(String(value.status)) ||
    !object(value.suggestion)
  )
    throw Error("Respuesta de IA inválida.");
  const s = value.suggestion;
  if (
    Object.keys(s).length !== 5 ||
    !["name", "brand", "presentation", "category"].every(
      (key) =>
        key in s &&
        (s[key] === null ||
          (typeof s[key] === "string" && s[key].length <= 200)),
    ) ||
    !Array.isArray(s.warnings) ||
    s.warnings.length > 5 ||
    !s.warnings.every((x) => typeof x === "string" && x.length <= 200)
  )
    throw Error("Sugerencia de IA inválida.");
  return value as unknown as Result;
}
// Surfaces the server's error code so a failure on the phone can be diagnosed without devtools.
async function errorCode(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    const code = object(body) && object(body.error) ? body.error.code : null;
    return typeof code === "string" ? code : `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}
export async function identify(
  draft: Pick<Draft, "id" | "photo" | "imageRevision">,
  requestId: string,
  signal: AbortSignal,
) {
  if (!navigator.onLine)
    throw Error("Sin conexión. Completa los datos a mano.");
  // `env` is undefined outside Vite (tests), hence the optional chaining.
  const serviceUrl = import.meta.env?.VITE_AI_URL?.replace(/\/$/, "");
  const token = import.meta.env?.VITE_AI_TOKEN;
  if (!serviceUrl || !token) throw Error("La IA no está configurada.");
  const photo = draft.photo
    ? await (await db()).get("photos", draft.photo)
    : null;
  if (!photo) throw Error("Agrega una fotografía antes de identificar.");
  const form = new FormData();
  // The server reads labels at 1024 px, so sending the 1600 px original only adds upload time on mobile data.
  form.append("image", await compressImage(photo.blob, 1024, 0.8), "product.jpg");
  form.append("requestId", requestId);
  form.append("draftId", draft.id);
  form.append("imageRevision", String(draft.imageRevision));
  form.append("schemaVersion", "1");
  const response = await fetch(`${serviceUrl}/v1/identify-product`, {
    method: "POST",
    body: form,
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  if (!response.ok)
    throw Error(
      (
        {
          401: "Credencial inválida o revocada.",
          413: "Foto demasiado grande.",
          429: "Cuota de IA agotada.",
        } as Record<number, string>
      )[response.status] ??
        `No se pudo identificar (${await errorCode(response)}). Completa los datos.`,
    );
  const result = parseResult(await response.json());
  if (
    result.requestId !== requestId ||
    result.imageRevision !== draft.imageRevision
  )
    throw Error("Se descartó una respuesta de otra fotografía.");
  return result;
}
