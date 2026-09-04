const FORMULA_INJECTION_PREFIX = /^[=+\-@]/;

/**
 * Escapes a CSV cell and neutralises spreadsheet formula injection.
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const raw = typeof value === "string" ? value : String(value);
  if (!raw) return '""';
  const safe = FORMULA_INJECTION_PREFIX.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Builds a CSV document from row arrays. */
export function buildCsvContent(rows: unknown[][]): string {
  const rowCount = rows.length;
  if (rowCount === 0) return "";

  const lines = new Array<string>(rowCount);
  for (let i = 0; i < rowCount; i++) {
    const row = rows[i];
    const colCount = row.length;
    let line = "";
    for (let j = 0; j < colCount; j++) {
      if (j > 0) line += ",";
      line += escapeCsvCell(row[j]);
    }
    lines[i] = line;
  }
  return lines.join("\n");
}
