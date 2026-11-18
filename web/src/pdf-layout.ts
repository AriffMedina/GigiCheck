import type { jsPDF } from "jspdf";
import { drawSnoopy } from "./pdf-mascot";
import { OPERATOR } from "./domain";

export const PAGE = { bottom: 262 };

export function text(doc: jsPDF, value: string | string[], x: number, y: number,
  size = 10, bold = false, color = "#30213D", align: "left" | "right" | "center" = "left") {
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(color);
  doc.text(value, x, y, { align, lineHeightFactor: 1.2 });
}

export function wrap(doc: jsPDF, value: string, width: number, size: number, bold = false): string[] {
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(size);
  return value ? doc.splitTextToSize(value, width) as string[] : [];
}

export function reportHeader(doc: jsPDF) {
  doc.setFillColor("#F1EAF8");
  doc.roundedRect(16, 11, 183.9, 29, 4, 4, "F");
  drawSnoopy(doc);
  text(doc, "PRODUCTO", 45, 28, 10, true, "#68408B");
  text(doc, "FALTANTES", 187, 28, 9.5, true, "#68408B", "center");
  // Muted on purpose: a signature, readable but never competing with the list.
  text(doc, `${OPERATOR} · A.I.M.G`, 108, 272, 8.5, false, "#A497B0", "center");
  doc.setLineWidth(0.2);
  return 45;
}
