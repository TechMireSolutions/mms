import { useLiveCollection } from "@/hooks/useLiveCollection";
import { useAuth } from "@/lib/contexts/AuthContext";
import { saveCollection } from "@/lib/db";
import { todayISO } from "@mms/shared";

const SAVED_REPORTS_COLLECTION_KEY = "reports_saved_reports";

export interface SavedReportsSource<TReport, TCreateInput> {
  reports: TReport[];
  isLoading: boolean;
  isError: boolean;
  retry: () => void;
  createReport: (input: TCreateInput) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  runReport: (id: string) => Promise<void>;
}

export interface LocalSavedReport {
  id: string;
  name: string;
  category: string;
  filters: Record<string, unknown>;
  lastRun: string;
  createdBy: string;
}

export interface LocalSavedReportCreateInput {
  name: string;
  filters: Record<string, unknown>;
}

export function useLocalSavedReportsSource(
  category: string,
): SavedReportsSource<LocalSavedReport, LocalSavedReportCreateInput> {
  const { user } = useAuth();
  const allReports = useLiveCollection<LocalSavedReport>(
    SAVED_REPORTS_COLLECTION_KEY,
    [],
    { serverSync: false },
  );

  const reports = allReports.filter((report) => report.category === category);

  const createReport = async (input: LocalSavedReportCreateInput): Promise<void> => {
    const report: LocalSavedReport = {
      id: `rep-${crypto.randomUUID()}`,
      name: input.name,
      category,
      filters: input.filters,
      lastRun: todayISO(),
      createdBy: user?.name || user?.email || "",
    };
    saveCollection(SAVED_REPORTS_COLLECTION_KEY, [...allReports, report]);
  };

  const deleteReport = async (id: string): Promise<void> => {
    saveCollection(
      SAVED_REPORTS_COLLECTION_KEY,
      allReports.filter((report) => report.id !== id),
    );
  };

  const runReport = async (id: string): Promise<void> => {
    saveCollection(
      SAVED_REPORTS_COLLECTION_KEY,
      allReports.map((report) =>
        report.id === id ? { ...report, lastRun: todayISO() } : report,
      ),
    );
  };

  return {
    reports,
    isLoading: false,
    isError: false,
    retry: () => undefined,
    createReport,
    deleteReport,
    runReport,
  };
}
