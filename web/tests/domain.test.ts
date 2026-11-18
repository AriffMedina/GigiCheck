import { test } from "node:test";
import assert from "node:assert/strict";
import {
  blankDraft,
  byName,
  dateLabel,
  pending,
  quantity,
  sameIdentity,
  stepQuantity,
  totals,
  validate,
  SHIFT,
  type Entry,
  type Session,
} from "../src/domain";
test("cantidades manuales enteras entre 1 y 999", () => {
  for (const value of ["", "0", "-1", "1.5", "1000", "abc", " 2 "])
    assert.throws(() => quantity(value));
  assert.equal(quantity("1"), 1);
  assert.equal(quantity("999"), 999);
});
test("normalización conserva variantes y concentración", () => {
  const a = {
    name: "  Ántiflu  Des ",
    brand: "Marca",
    presentation: "24 cápsulas 5 mg",
    category: "",
  };
  assert(
    sameIdentity(a, {
      ...a,
      name: "antiflu des",
      presentation: "24 capsulas 5 mg",
    }),
  );
  assert(!sameIdentity(a, { ...a, presentation: "24 cápsulas 10 mg" }));
  assert(!sameIdentity(a, { ...a, presentation: "Coco 625 ml" }));
});
test("nombre obligatorio, nota acotada y borrador que empieza en 1", () => {
  const draft = blankDraft("session");
  assert.equal(draft.quantityInput, "1");
  assert.throws(() => validate(draft));
  assert.throws(() =>
    validate({
      ...draft,
      name: "Producto",
      quantityInput: "1",
      note: "a".repeat(501),
    }),
  );
  assert.equal(totals([]).units, 0);
});
test("stepper limita la cantidad entre 1 y 999, también desde texto vacío o inválido", () => {
  assert.equal(stepQuantity("", 1), "1");
  assert.equal(stepQuantity("", -1), "1");
  assert.equal(stepQuantity("abc", 1), "1");
  assert.equal(stepQuantity("4", 1), "5");
  assert.equal(stepQuantity("4", -1), "3");
  assert.equal(stepQuantity("1", -1), "1");
  assert.equal(stepQuantity("999", 1), "999");
});
test("etiqueta de fecha corta y pendientes por producto", () => {
  const session = { date: "2026-11-03", shift: SHIFT } as Session;
  assert.equal(dateLabel(session), "3 nov · Vespertino");
  assert.equal(dateLabel(session, true), `3 nov · ${SHIFT}`);
  assert.equal(pending({ quantity: 5, brought: 2 } as Entry), 3);
});
test("buscar por nombre ignora acentos, mayúsculas y espacios", () => {
  const rows = [{ name: "Jabón Zote" }, { name: "Leche Lala" }, { name: "Jabon líquido" }];
  assert.deepEqual(byName(rows, "  JABON ").map((row) => row.name), ["Jabón Zote", "Jabon líquido"]);
  assert.equal(byName(rows, "").length, 3);
  assert.equal(byName(rows, "arroz").length, 0);
});
