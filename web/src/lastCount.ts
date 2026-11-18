const KEY = "gigicheck:last-count";
// Remembers which count was on screen so a reload in bodega reopens it instead of Home.
// It is only a convenience: if storage is blocked (private mode), a reload simply lands on Home.
export function rememberCount(id: string | null) {
  try {
    localStorage.setItem(KEY, id ?? "");
  } catch {
    /* Blocked storage only loses the reload convenience; the count data lives in IndexedDB. */
  }
}
export function lastCount(): string | null {
  try {
    return localStorage.getItem(KEY) || null;
  } catch {
    return null;
  }
}
