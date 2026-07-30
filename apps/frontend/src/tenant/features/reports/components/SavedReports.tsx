import React, { useState, useCallback } from "react";
import { Bookmark, Plus } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useTranslation } from "@/hooks/useTranslation";
import { FormModal } from "@/components/ui/FormModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";
import {
  type GenericSavedReport,
  type GenericSavedReportCategory,
  type GenericSavedReportCreateInput,
} from "@mms/shared";
import type { SavedReportsSource } from "@/hooks/useSavedReportsSource";
import { SavedReportCard } from "./SavedReportCard";

interface SavedReportsProps {
  category: GenericSavedReportCategory;
  source: SavedReportsSource<GenericSavedReport, GenericSavedReportCreateInput>;
  filters?: Record<string, unknown>;
  onApplyFilters?: (filters: Record<string, unknown>) => void;
}

/**
 * Generic component for saving, listing, running, and deleting reporting presets.
 * Re-runs filter configurations against live data.
 */
export default function SavedReports({
  category,
  source,
  filters = {},
  onApplyFilters,
}: SavedReportsProps): React.JSX.Element {
  const { t } = useTranslation();
  const {
    reports: saved,
    isLoading,
    isError,
    retry,
    createReport,
    deleteReport,
    runReport,
  } = source;

  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setSaving(true);
    try {
      await createReport({
        name: trimmedName,
        category,
        filters,
      });
      notify.success(t("contacts.savedReports.saveSuccess"));
      setName("");
      setSaveOpen(false);
    } catch {
      notify.error(t("contacts.savedReports.saveDialogTitle"));
    } finally {
      setSaving(false);
    }
  }, [name, category, filters, createReport, t]);

  const handleRun = useCallback(
    async (report: GenericSavedReport) => {
      if (!onApplyFilters) return;

      try {
        await runReport(report.id);
        onApplyFilters(report.filters);
        notify.success(t("contacts.savedReports.runSuccess"));
      } catch {
        notify.error(t("contacts.savedReports.staleWarningTitle"));
      }
    },
    [onApplyFilters, runReport, t]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteReport(id);
        notify.info(t("contacts.savedReports.deleteSuccess"));
      } catch {
        notify.error(t("contacts.savedReports.delete"));
      }
    },
    [deleteReport, t]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 text-start">
          <h3 className="text-sm font-semibold text-foreground">{t("reports.saved.title")}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("reports.saved.subtitle")}
          </p>
        </div>
        {onApplyFilters && (
          <Button
            onClick={() => setSaveOpen(true)}
            className="flex w-full sm:w-auto items-center gap-1.5 min-h-11 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("reports.saved.saveCurrent")}
          </Button>
        )}
      </div>

      {isError ? (
        <ErrorState
          title={t("errors.state.generic")}
          description={t("common.retry")}
          onRetry={retry}
          compact
        />
      ) : isLoading ? (
        <p className="text-xs text-muted-foreground">{t("common.loading")}</p>
      ) : saved.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title={t("reports.saved.emptyTitle")}
          description={t("reports.saved.emptyDescription")}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {saved.map((report) => (
              <SavedReportCard
                key={report.id}
                report={report}
                onRun={onApplyFilters ? handleRun : undefined}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <FormModal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title={t("contacts.savedReports.saveDialogTitle")}
        size="sm"
        cancelLabel={t("common.cancel")}
        saveLabel={t("contacts.savedReports.save")}
        onSave={() => void handleSave()}
        saving={saving}
        saveDisabled={!name.trim()}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="saved-report-name">{t("contacts.savedReports.nameLabel")}</Label>
            <Input
              id="saved-report-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("contacts.savedReports.namePlaceholder")}
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
