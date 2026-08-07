import { Readable } from 'node:stream';
import { buildCsvContent } from '@mms/shared';

export type CsvExportMeta = { count: number; filename: string };

export type CsvExportPageResult<TRow> = {
  rows: TRow[];
  hasMore: boolean;
};

export type CsvStreamFactoryOptions<TRow, TCol extends { label: string }> = {
  filename: string;
  chunkSize: number;
  columns: TCol[];
  includeIds?: string[];
  loadByIds: (ids: string[]) => Promise<TRow[]>;
  loadPage: (page: number, limit: number) => Promise<CsvExportPageResult<TRow>>;
  /** Yield CSV data chunks for one batch (no header). */
  yieldDataChunks: (
    rows: TRow[],
    columns: TCol[],
    chunkSize: number,
  ) => Generator<string, void, undefined>;
};

/** Coerce export query includeDeleted flags; strip when allowDeleted is false. */
export function normalizeIncludeDeletedFlag(
  value: unknown,
  allowDeleted: boolean,
): boolean | undefined {
  const includeDeletedRaw =
    value === true || value === 'true'
      ? true
      : value === false || value === 'false'
        ? false
        : undefined;
  return allowDeleted ? includeDeletedRaw : undefined;
}

/**
 * Async generator: CSV header → selection by ids OR SQL page-walk.
 * Module services supply loaders + domain yieldDataChunks.
 */
export async function* generateCsvStreamChunks<TRow, TCol extends { label: string }>(
  options: CsvStreamFactoryOptions<TRow, TCol>,
): AsyncGenerator<string, CsvExportMeta, undefined> {
  const { filename, chunkSize, columns, includeIds, loadByIds, loadPage, yieldDataChunks } =
    options;

  yield buildCsvContent([columns.map((col) => col.label)]);

  if (includeIds && includeIds.length > 0) {
    const rows = await loadByIds(includeIds);
    if (rows.length === 0) {
      return { count: 0, filename };
    }
    yield* yieldDataChunks(rows, columns, chunkSize);
    return { count: rows.length, filename };
  }

  let page = 1;
  let exported = 0;
  for (;;) {
    const pageResult = await loadPage(page, chunkSize);
    if (pageResult.rows.length > 0) {
      yield* yieldDataChunks(pageResult.rows, columns, chunkSize);
      exported += pageResult.rows.length;
    }
    if (!pageResult.hasMore) {
      return { count: exported, filename };
    }
    page += 1;
  }
}

export function streamCsvExportFromGenerator(
  generator: AsyncGenerator<string, CsvExportMeta, undefined>,
): Readable {
  return Readable.from(generator);
}

export async function buildCsvExportFromGenerator(
  generator: AsyncGenerator<string, CsvExportMeta, undefined>,
  fallbackFilename: string,
): Promise<{ csv: string; filename: string; count: number }> {
  const chunks: string[] = [];
  let step = await generator.next();
  while (!step.done) {
    chunks.push(step.value);
    step = await generator.next();
  }
  const meta = step.value;
  return {
    csv: chunks.join(''),
    filename: meta?.filename || fallbackFilename,
    count: meta?.count ?? 0,
  };
}
