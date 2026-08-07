import {
  buildCsvExportFromGenerator,
  generateCsvStreamChunks,
  streamCsvExportFromGenerator,
} from './csvExportStreamFactory.js';

export type ModuleCsvExportColumn = { id?: string; label: string };

export type ModuleCsvExportManifestBits = {
  defaultExportFilename: string;
  exportChunkSize: number;
};

export type ModuleCsvExportOptions = {
  columns?: ModuleCsvExportColumn[];
  filename?: string;
  viewerRole: string;
  chunkSize?: number;
  allowDeleted?: boolean;
};

export type ModuleCsvExportResult = {
  csv: string;
  filename: string;
  count: number;
};

export type CreateModuleCsvExportServiceOptions<
  TRow,
  TQuery,
  TCol extends ModuleCsvExportColumn,
  TContext = undefined,
> = {
  manifest: ModuleCsvExportManifestBits;
  normalizeQuery: (
    query: TQuery,
    allowDeleted: boolean,
  ) => TQuery & { includeIds?: Array<string | number> };
  prepareExport: (
    options: ModuleCsvExportOptions & { columns?: TCol[] },
  ) =>
    | { columns: TCol[]; context: TContext }
    | Promise<{ columns: TCol[]; context: TContext }>;
  loadByIds: (ids: string[]) => Promise<TRow[]>;
  loadPage: (
    query: TQuery & { includeIds?: Array<string | number> },
    page: number,
    limit: number,
  ) => Promise<{ rows: TRow[]; hasMore: boolean }>;
  yieldDataChunks: (
    rows: TRow[],
    columns: TCol[],
    chunkSize: number,
    context: TContext,
  ) => Generator<string, void, undefined>;
};

/**
 * Shared generate/stream/build wrappers over {@link generateCsvStreamChunks}.
 */
export function createModuleCsvExportService<
  TRow,
  TQuery,
  TCol extends ModuleCsvExportColumn,
  TContext = undefined,
>(options: CreateModuleCsvExportServiceOptions<TRow, TQuery, TCol, TContext>) {
  async function* generateStreamChunks(
    query: TQuery,
    exportOptions: ModuleCsvExportOptions & { columns?: TCol[] },
  ): AsyncGenerator<string, { count: number; filename: string }, undefined> {
    const normalized = options.normalizeQuery(query, exportOptions.allowDeleted === true);
    const includeIds = normalized.includeIds?.map(String).filter(Boolean);
    const prepared = await options.prepareExport(exportOptions);
    const filename =
      exportOptions.filename?.trim() || options.manifest.defaultExportFilename;
    const chunkSize = Math.max(
      1,
      exportOptions.chunkSize ?? options.manifest.exportChunkSize,
    );

    return yield* generateCsvStreamChunks({
      filename,
      chunkSize,
      columns: prepared.columns,
      includeIds,
      loadByIds: options.loadByIds,
      loadPage: async (page, limit) => options.loadPage(normalized, page, limit),
      yieldDataChunks: (rows, cols, size) =>
        options.yieldDataChunks(
          rows as TRow[],
          cols as TCol[],
          size,
          prepared.context,
        ),
    });
  }

  function streamExport(
    query: TQuery,
    exportOptions: ModuleCsvExportOptions & { columns?: TCol[] },
  ) {
    return streamCsvExportFromGenerator(generateStreamChunks(query, exportOptions));
  }

  async function buildExport(
    query: TQuery,
    exportOptions: ModuleCsvExportOptions & { columns?: TCol[] },
  ): Promise<ModuleCsvExportResult> {
    return buildCsvExportFromGenerator(
      generateStreamChunks(query, exportOptions),
      exportOptions.filename?.trim() || options.manifest.defaultExportFilename,
    );
  }

  return { generateStreamChunks, streamExport, buildExport };
}
