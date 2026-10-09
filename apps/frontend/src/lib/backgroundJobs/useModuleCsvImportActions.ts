import { useCallback, useState } from "react";
import {
  parseCsvRows,
  mapCsvGridToObjects,
  generateCsvTemplate,
  type CsvImportFieldMapping,
  type CsvTemplateColumn,
  type BackgroundJobRecord,
} from "@mms/shared";
import { triggerFileDownload } from "@/lib/download";
import { notify } from "@/lib/notify";
import { startServerModuleCsvImport } from "@/lib/backgroundJobs/startServerModuleCsvImport";

export interface UseModuleCsvImportActionsOptions<TRow = Record<string, unknown>> {
  apiPath: string;
  moduleId: string;
  mappings: CsvImportFieldMapping<TRow>[];
  templateColumns: CsvTemplateColumn[];
  defaultLabel?: string;
  onSuccess?: () => void;
}

export function useModuleCsvImportActions<TRow = Record<string, unknown>>(
  options: UseModuleCsvImportActionsOptions<TRow>,
) {
  const { apiPath, moduleId, mappings, templateColumns, defaultLabel, onSuccess } = options;
  const [isOpen, setIsOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parsedRows, setParsedRows] = useState<TRow[]>([]);
  const [missingHeaders, setMissingHeaders] = useState<string[]>([]);
  const [rowErrors, setRowErrors] = useState<Array<{ row: number; error: string }>>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [completedJob, setCompletedJob] = useState<BackgroundJobRecord | null>(null);

  const resetState = useCallback(() => {
    setFileName("");
    setParsedRows([]);
    setMissingHeaders([]);
    setRowErrors([]);
    setIsImporting(false);
    setProgress(null);
    setCompletedJob(null);
  }, []);

  const handleDownloadTemplate = useCallback(() => {
    const csvContent = generateCsvTemplate(templateColumns);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    triggerFileDownload(blob, `${moduleId}_import_template.csv`);
  }, [moduleId, templateColumns]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      resetState();
      setFileName(file.name);
      try {
        const text = await file.text();
        const grid = parseCsvRows(text);
        const result = mapCsvGridToObjects<TRow>(grid, mappings);

        setMissingHeaders(result.missingHeaders);
        setRowErrors(result.rowErrors);
        setParsedRows(result.rows);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setRowErrors([{ row: 0, error: `Failed to read CSV: ${msg}` }]);
      }
    },
    [mappings, resetState],
  );

  const handleStartImport = useCallback(async () => {
    if (parsedRows.length === 0 || isImporting) return;
    setIsImporting(true);
    setProgress({ current: 0, total: parsedRows.length });

    try {
      const job = await startServerModuleCsvImport({
        path: apiPath,
        body: {
          rows: parsedRows,
          label: defaultLabel || `Importing ${moduleId}`,
        },
        onProgress: (updatedJob) => {
          if (updatedJob.progress) {
            setProgress(updatedJob.progress);
          }
        },
      });

      setCompletedJob(job);
      notify.success(job.label || `Successfully imported ${moduleId}`);
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      notify.error(`Import failed: ${msg}`);
    } finally {
      setIsImporting(false);
    }
  }, [apiPath, defaultLabel, isImporting, moduleId, onSuccess, parsedRows]);

  return {
    isOpen,
    setIsOpen,
    fileName,
    parsedRows,
    missingHeaders,
    rowErrors,
    isImporting,
    progress,
    completedJob,
    resetState,
    handleFileSelect,
    handleDownloadTemplate,
    handleStartImport,
  };
}
