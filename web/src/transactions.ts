export function observeTransaction(tx: { done: Promise<void> }): void {
  // Callers still await tx.done; this handles its parallel rejection if a request fails first.
  void tx.done.catch(() => undefined);
}
export function abort(tx: { abort(): void }, message: string): never {
  tx.abort();
  throw Error(message);
}
