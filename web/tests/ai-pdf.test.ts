import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseResult } from "../src/ai";
import { createPdf, makePdf, reportName } from "../src/pdf";
import { db } from "../src/db";
import { SHIFT, type Entry, type Session } from "../src/domain";
const session: Session = {
  id: "s",
  date: "2026-11-13",
  shift: SHIFT,
  timezone: "America/Mexico_City",
  status: "active",
  revision: 1,
};
const factory = (index: number): Entry => ({
  id: String(index),
  sessionId: "s",
  name: `Producto ${index} presentación y descripción larga con acentos áéíóú ñ`,
  brand: "Marca",
  presentation: "625 ml sabor coco",
  category: "",
  quantity: 1,
  brought: 0,
  note: "",
  photo: null,
  sourceDraftId: String(index),
  source: "manual",
  deletedAt: null,
});
test("IA acepta nulos y rechaza cantidad, stock y campos adicionales", () => {
  const valid = {
    requestId: "r",
    imageRevision: 1,
    status: "uncertain",
    suggestion: {
      name: null,
      brand: null,
      presentation: null,
      category: null,
      warnings: [],
    },
  };
  assert.equal(parseResult(valid).suggestion.name, null);
  assert.throws(() => parseResult({ ...valid, quantity: 5 }));
  assert.throws(() =>
    parseResult({ ...valid, suggestion: { ...valid.suggestion, stock: 3 } }),
  );
  assert.throws(() =>
    parseResult({
      ...valid,
      suggestion: { ...valid.suggestion, name: "x".repeat(201) },
    }),
  );
});
test("PDF offline de 1, 20 y 100 filas contiene todas, totales y páginas", async () => {
  for (const count of [1, 20, 100]) {
    const blob = makePdf(
      session,
      Array.from({ length: count }, (_, i) => factory(i)),
    );
    const text = await blob.text();
    assert(text.startsWith("%PDF"));
    assert(text.includes(`${count} productos registrados`));
    for (let i = 0; i < count; i++) assert(text.includes(`Producto ${i} `));
    assert(text.includes("/Type /Page"));
  }
  assert.throws(() => makePdf(session, []));
  assert.equal(reportName(session), "faltantes_2026-11-13.pdf");
});
test("PDF muestra la operadora fija y el turno", async () => {
  const text = await makePdf(session, [factory(1)]).text();
  assert(text.includes("Regina Sanchez"));
  assert(text.includes("13 nov"));
  assert(text.includes("Vespertino"));
  assert(text.includes("9:00 p.m. - 6:00 a.m."));
});
// Smallest valid JPEG; stands in for a compressed product photo.
const JPEG = Uint8Array.from(
  atob(
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
  ),
  (c) => c.charCodeAt(0),
);
test("Incluir fotos incrusta la imagen en el PDF y desactivarlo no", async () => {
  await (
    await db()
  ).put("photos", { id: "p1", blob: new Blob([JPEG], { type: "image/jpeg" }) });
  const rows = [{ ...factory(1), photo: "p1" }, factory(2)];
  const identity = async (blob: Blob) => blob;
  const without = await createPdf(session, rows, false, identity);
  const withPhotos = await createPdf(session, rows, true, identity);
  const text = await withPhotos.text();
  assert(!(await without.text()).includes("/Subtype /Image"));
  assert.equal(text.match(/\/Subtype \/Image/g)?.length, 1);
  assert(withPhotos.size > without.size);
});
