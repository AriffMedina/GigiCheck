import { jsPDF } from "jspdf";
import { dateLabel, OPERATOR, totals, type Entry, type Session } from "./domain";
import { db } from "./db";
import { compressImage, dataUrl } from "./photos";

export const reportName = (session: Session) => `faltantes_${session.date}.pdf`;

export function makePdf(
  session: Session,
  rows: Entry[],
  images: Record<string, string> = {},
  generated = new Date().toLocaleString("es-MX"),
): Blob {
  if (!rows.length)
    throw Error("Agrega al menos un producto antes de exportar.");
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const width = 215.9;
  const bottom = 252;
  let y = 0;
  const wrap = (
    text: string,
    size: number,
    maxWidth: number,
    bold = false,
  ): string[] => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    return doc.splitTextToSize(text, maxWidth) as string[];
  };
  const header = () => {
    doc.setTextColor(27, 19, 36);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("GigiCheck", 16, 16);
    doc.setFont("times", "bold");
    doc.setFontSize(25);
    doc.text("Conteo de faltantes", 16, 29);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      // Standard PDF fonts lack the en dash of the shift label.
      `${dateLabel(session, true).replace("–", "-")}${session.status === "active" ? " · En curso" : ""}`,
      16,
      37,
    );
    doc.text(OPERATOR, 16, 43);
    const top = 47;
    doc.setFillColor(229, 217, 246);
    doc.rect(16, top, width - 32, 9, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Producto", 19, top + 6);
    doc.text("Cantidad", width - 19, top + 6, { align: "right" });
    y = top + 10;
  };
  header();
  for (const row of rows) {
    const image = images[row.id];
    const name = wrap(row.name, 11, image ? 127 : 145, true);
    const details = wrap(
      [row.brand, row.presentation || "Sin especificar"]
        .filter(Boolean)
        .join(" · "),
      9,
      image ? 127 : 145,
    );
    const note = row.note ? wrap(row.note, 9, 145) : [];
    const height = Math.max(
      image ? 24 : 0,
      10 + name.length * 5 + details.length * 4 + note.length * 4,
    );
    if (y + height > bottom) {
      doc.addPage();
      header();
    }
    const x = image ? 42 : 19;
    if (image) {
      // Fit inside 19x19 mm keeping the photo's proportions.
      const { width: w, height: h } = doc.getImageProperties(image);
      const scale = 19 / Math.max(w, h);
      doc.addImage(image, "JPEG", 19, y + 3, w * scale, h * scale, undefined, "FAST");
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(name, x, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(details, x, y + 6 + name.length * 5);
    if (note.length)
      doc.text(note, 19, y + 8 + name.length * 5 + details.length * 4);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(String(row.quantity), width - 19, y + 7, { align: "right" });
    y += height;
    doc.setDrawColor(198, 180, 215);
    doc.line(16, y, width - 16, y);
  }
  if (y + 18 > bottom) {
    doc.addPage();
    header();
  }
  const sum = totals(rows);
  doc.setFillColor(229, 217, 246);
  doc.rect(16, y + 5, width - 32, 12, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(
    `${sum.products} productos registrados · ${sum.units} unidades faltantes`,
    19,
    y + 13,
  );
  const count = doc.getNumberOfPages();
  for (let page = 1; page <= count; page++) {
    doc.setPage(page);
    doc.setTextColor(80, 70, 90);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Generado: ${generated}`, 16, 264);
    doc.text(
      "Conteo manual de faltantes; identificación revisada por la usuaria.",
      16,
      269,
    );
    doc.text(`${page} / ${count}`, width - 16, 269, { align: "right" });
  }
  return doc.output("blob");
}

export async function createPdf(
  session: Session,
  rows: Entry[],
  photos: boolean,
  // Injectable so tests can run without a DOM canvas.
  compress: (blob: Blob) => Promise<Blob> = (blob) =>
    compressImage(blob, 320, 0.65),
) {
  const snapshot = rows.map((row) => ({ ...row }));
  const images: Record<string, string> = {};
  if (photos) {
    const database = await db();
    for (const row of snapshot) {
      if (!row.photo) continue;
      const image = await database.get("photos", row.photo);
      if (image) images[row.id] = await dataUrl(await compress(image.blob));
    }
  }
  return new File(
    [makePdf({ ...session }, snapshot, images)],
    reportName(session),
    { type: "application/pdf" },
  );
}

export function download(file: File) {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
