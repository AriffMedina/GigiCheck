import { useEffect, useState } from "react";
import { db } from "./db";
export function usePhoto(photo: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    setUrl(null);
    if (photo)
      void db()
        .then((x) => x.get("photos", photo))
        .then((value) => {
          if (active && value) {
            objectUrl = URL.createObjectURL(value.blob);
            setUrl(objectUrl);
          }
        })
        .catch(() => setUrl(null));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photo]);
  return url;
}
export async function compressImage(
  file: Blob,
  maxSide = 1600,
  quality = 0.78,
): Promise<Blob> {
  const image = new Image();
  const url = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(
          Error("No se pudo leer la fotografía. Usa una imagen JPEG o PNG."),
        );
      image.src = url;
    });
    const scale = Math.min(
      1,
      maxSide / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) throw Error("No se pudo procesar la fotografía.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const result = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(Error("No se pudo comprimir la foto.")),
        "image/jpeg",
        quality,
      ),
    );
    if (result.size > 2 * 1024 * 1024)
      throw Error(
        "La foto supera 2 MB. Toma otra foto más cerca de la etiqueta.",
      );
    return result;
  } finally {
    URL.revokeObjectURL(url);
  }
}
// Always a JPEG data URL (what jsPDF is told to expect); avoids FileReader so it also runs in Node tests.
export async function dataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:image/jpeg;base64,${btoa(binary)}`;
}
