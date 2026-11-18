import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseResult } from "../src/ai";
import { createPdf, makePdf, reportName } from "../src/pdf";
import { db } from "../src/db";
import { SHIFT, type Entry, type Session } from "../src/domain";
const session: Session = {
  id: "s", date: "2026-11-13", shift: SHIFT,
  timezone: "America/Mexico_City", status: "active", revision: 1,
};
const factory = (index: number): Entry => ({
  id: String(index), sessionId: "s",
  name: `Producto ${index} presentación y descripción larga con acentos áéíóú ñ`,
  brand: "Marca", presentation: "625 ml sabor coco", category: "",
  quantity: 1, brought: 0, note: "Nota privada que no se comparte", photo: null,
  sourceDraftId: String(index), source: "manual", deletedAt: null,
});
test("IA acepta nulos y rechaza cantidad, stock y campos adicionales", () => {
  const valid = {
    requestId: "r", imageRevision: 1, status: "uncertain",
    suggestion: { name: null, brand: null, presentation: null, category: null, warnings: [] },
  };
  assert.equal(parseResult(valid).suggestion.name, null);
  assert.throws(() => parseResult({ ...valid, quantity: 5 }));
  assert.throws(() => parseResult({ ...valid, suggestion: { ...valid.suggestion, stock: 3 } }));
  assert.throws(() => parseResult({ ...valid, suggestion: { ...valid.suggestion, name: "x".repeat(201) } }));
});
test("PDF offline de 1, 20 y 100 filas conserva los productos en orden", async () => {
  for (const count of [1, 20, 100]) {
    const text = await makePdf(Array.from({ length: count }, (_, i) => factory(i))).text();
    assert(text.startsWith("%PDF"));
    let last = -1;
    for (let i = 0; i < count; i++) {
      const position = text.indexOf(`Producto ${i} `);
      assert(position > last);
      last = position;
    }
    assert(text.includes("/Type /Page"));
  }
  assert.throws(() => makePdf([]));
  assert.equal(reportName(session), "faltantes_2026-11-13.pdf");
});
test("PDF solo muestra identificación del producto y faltantes originales", async () => {
  const text = await makePdf([{ ...factory(1), quantity: 6, brought: 2 }]).text();
  for (const label of ["PRODUCTO", "FALTANTES", "Producto 1", "Marca", "625 ml sabor coco", "(6) Tj"])
    assert(text.includes(label));
  for (const omitted of ["GigiCheck", "En bodega", "SOLICITADAS", "BAJADAS", "PENDIENTES", "Completo",
    "Vespertino", "Generado", "13 nov", "productos registrados", "Nota privada", "(2) Tj", "(4) Tj"])
    assert(!text.includes(omitted), `no debe incluir ${omitted}`);
});
test("el avance de bodega no cambia el contenido del PDF para el personal de arriba", async () => {
  const rows = [{ ...factory(1), quantity: 6, brought: 0 }];
  const before = await makePdf(rows).text();
  const after = await makePdf(rows.map((row) => ({ ...row, brought: row.quantity }))).text();
  const streams = (value: string) => value.match(/stream\n[^]*?\nendstream/g);
  assert.deepEqual(streams(after), streams(before));
});
test("Snoopy se imprime como vectores sin añadir imágenes ni texto al reporte", async () => {
  const text = await makePdf([factory(1)]).text();
  assert(!text.includes("/Subtype /Image"));
  assert((text.match(/ c\n/g)?.length ?? 0) > 35, "el dibujo debe conservar sus curvas vectoriales");
  assert(!text.includes("(Snoopy)"));
});
test("una hoja admite ocho productos cortos con espacio reservado para fotos", async () => {
  const rows = Array.from({ length: 8 }, (_, i) => ({ ...factory(i), name: `Producto ${i}`, brand: "" }));
  const text = await makePdf(rows).text();
  assert.equal(text.match(/\/Type \/Page\b/g)?.length, 1);
});
test("PDF pagina nombres y presentaciones extensas sin perder productos", async () => {
  const rows = Array.from({ length: 20 }, (_, i) => ({
    ...factory(i),
    name: `Producto ${i} ${"nombre extenso ".repeat(12)}`.slice(0, 200),
    presentation: "Presentación larga ".repeat(10),
  }));
  const text = await makePdf(rows).text();
  const pages = text.match(/\/Type \/Page\b/g)?.length ?? 0;
  assert(pages > 1);
  assert.equal(text.match(/\(FALTANTES\) Tj/g)?.length, pages);
  assert.equal(text.match(/\(Regina Sanchez . A\.I\.M\.G\) Tj/g)?.length, pages, "la firma va en cada hoja");
  for (let index = 0; index < rows.length; index++) assert(text.includes(`Producto ${index} `));
  assert(!text.includes("Nota privada"));
});
// Smallest valid JPEG; stands in for a compressed product photo.
const JPEG = Uint8Array.from(atob(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
), (c) => c.charCodeAt(0));
test("cada exportación incluye las fotos guardadas y conserva productos manuales", async () => {
  await (await db()).put("photos", { id: "p1", blob: new Blob([JPEG], { type: "image/jpeg" }) });
  const rows = [{ ...factory(1), photo: "p1" }, factory(2)];
  const file = await createPdf(session, rows, async (blob) => blob);
  const text = await file.text();
  assert.equal(text.match(/\/Subtype \/Image/g)?.length, 1);
  assert(text.includes("Producto 1 "));
  assert(text.includes("Producto 2 "));
  assert.equal(file.name, "faltantes_2026-11-13.pdf");
});
