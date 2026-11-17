import type { jsPDF } from "jspdf";

// Local vector artwork stays crisp when printed and never counts as a product photo.
export function drawSnoopy(doc: jsPDF) {
  const scale = 0.21, left = 20, top = 5;
  const path = (x: number, y: number, lines: number[][], fill = false) =>
    doc.lines(lines, left + x * scale, top + y * scale, [scale, scale], fill ? "FD" : "S", fill);
  const oval = (x: number, y: number, rx: number, ry: number, fill: string) => {
    doc.setFillColor(fill);
    doc.ellipse(left + x * scale, top + y * scale, rx * scale, ry * scale, "F");
  };
  doc.setDrawColor("#68408B");
  doc.setLineWidth(0.48);
  doc.setLineCap("round");
  doc.setLineJoin("round");
  oval(62, 145, 43, 5, "#E0CFEE");
  doc.setFillColor("#FFFFFF");
  path(66, 83, [[-12, 12, -13, 30, -5, 39], [-12, 8], [-7, 8, 4, 13, 17, 10], [19, -1], [11, -1, 12, -7, 4, -15], [-4, -4], [7, -17, 2, -29, -5, -36]], true);
  path(84, 116, [[11, 4, 18, -1, 19, -7]]);
  doc.setFillColor("#FFFFFF");
  path(88, 32, [[-9, -17, -30, -18, -44, -8], [-7, 5, -10, 14, -14, 15], [-8, 0, -16, -1, -19, 5], [-6, 12, 4, 27, 22, 32], [8, 2, 17, 2, 24, 0], [4, 11], [22, -1], [3, -12], [18, -9, 20, -27, 12, -37], [-3, -3, -6, -4, -10, -5]], true);
  doc.setFillColor("#79519B");
  path(88, 31, [[-11, 4, -13, 21, -11, 35], [3, 21, 14, 26, 22, 10], [7, -13, 8, -31, 1, -40], [-3, -3, -7, -5, -12, -5]], true);
  oval(14, 45, 6.5, 4.5, "#503065");
  oval(43, 35, 2.1, 2.7, "#503065");
  path(21, 61, [[11, 8, 22, 11, 30, 4]]);
  path(61, 84, [[21, -1]]);
  path(61, 88, [[21, -1]]);
  doc.setFillColor("#FFFFFF");
  path(58, 136, [[-17, -6, -28, -2, -29, 3], [-1, 5, 18, 9, 33, 4]], true);
  path(77, 136, [[12, -5, 26, -2, 27, 3], [1, 5, -18, 9, -30, 4]], true);
  doc.setFillColor("#F7F1FC");
  path(26, 96, [[30, -4], [6, 37], [-30, 4]], true);
  doc.setFillColor("#FFFFFF");
  path(33, 94, [[15, -2], [1, 6], [-15, 2]], true);
  path(37, 109, [[3, 3], [6, -8]]);
  path(39, 121, [[3, 3], [6, -8]]);
  path(62, 111, [[-8, -5, -14, -3, -13, 2], [1, 5, 9, 5, 14, 3]]);
  doc.setFillColor("#B590D0");
  path(122, 37, [[2, -6], [2, 6], [6, 2], [-6, 2], [-2, 6], [-2, -6], [-6, -2]], true);
  path(-5, 22, [[1.5, -4], [1.5, 4], [4, 1.5], [-4, 1.5], [-1.5, 4], [-1.5, -4], [-4, -1.5]], true);
}
