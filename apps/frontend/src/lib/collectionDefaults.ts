/** Use instead of demo seed arrays — collections start empty until synced from server. */
export const EMPTY_COLLECTION = [] as const;

export function emptyCollection<T>(): T[] {
  return [];
}
