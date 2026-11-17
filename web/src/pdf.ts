import { jsPDF } from "jspdf";
import { type Entry, type Session } from "./domain";
import { db } from "./db";
import { compressImage, dataUrl } from "./photos";
import { PAGE, reportHeader, text, wrap } from "./pdf-layout";

export const reportName = (session: Session) => `faltantes_${session.date}.pdf`;

export function makePdf(
  rows: Entry[],
  images: Record<string, string> = {},
): Blob {
  if (!rows.length) throw Error("Agrega al menos un producto antes de exportar.");
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  let y = reportHeader(doc);
  for (const row of rows) {
    const image = images[row.id];
    const name = wrap(doc, row.name, 118, 11, true);
    const details = wrap(doc, [row.brand, row.presentation].filter(Boolean).join(" · "), 118, 9.5);
    const height = Math.max(26, 14 + name.length * 5 + details.length * 4.1);
    if (y + height > PAGE.bottom) {
      doc.addPage();
      y = reportHeader(doc);
    }
    if (image) {
      doc.setFillColor("#F7F2FB");
      doc.roundedRect(16, y + 2, 22, 22, 3, 3, "F");
      const { width, height: imageHeight } = doc.getImageProperties(image);
      const scale = 20 / Math.max(width, imageHeight);
      const w = width * scale, h = imageHeight * scale;
      doc.addImage(image, "JPEG", 17 + (20 - w) / 2, y + 3 + (20 - h) / 2, w, h, undefined, "FAST");
    }
    text(doc, name, 45, y + 10, 11, true);
    if (details.length) text(doc, details, 45, y + 10 + name.length * 5, 9.5, false, "#756881");
    doc.setFillColor("#F2E9F9");
    doc.roundedRect(174, y + 4, 26, 16, 5, 5, "F");
    text(doc, String(row.quantity), 187, y + 15, 20, true, "#68408B", "center");
    y += height;
    doc.setDrawColor("#E3D8EC");
    doc.line(16, y, 199.9, y);
  }
  return doc.output("blob");
}

export async function createPdf(
  session: Session,
  rows: Entry[],
  // Injectable so tests can run without a DOM canvas.
  compress: (blob: Blob) => Promise<Blob> = (blob) => compressImage(blob, 320, 0.65),
) {
  const snapshot = rows.map((row) => ({ ...row }));
  const images: Record<string, string> = {};
  const database = await db();
  for (const row of snapshot) {
    if (!row.photo) continue;
    const image = await database.get("photos", row.photo);
    if (image) images[row.id] = await dataUrl(await compress(image.blob));
  }
  return new File([makePdf(snapshot, images)], reportName(session), { type: "application/pdf" });
}

export function download(file: File) {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
