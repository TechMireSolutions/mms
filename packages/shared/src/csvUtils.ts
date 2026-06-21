const FORMULA_INJECTION_PREFIX = /^[=+\-@]/;

/**
 * Escapes a CSV cell and neutralises spreadsheet formula injection.
 */
export function escapeCsvCell(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const safe = FORMULA_INJECTION_PREFIX.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Builds a CSV document from row arrays. */
export function buildCsvContent(rows: unknown[][]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}
