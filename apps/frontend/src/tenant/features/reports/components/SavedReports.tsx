import React, { useMemo, useState, useCallback } from "react";
import { Bookmark, Trash2, Play, Plus, Clock, User } from "lucide-react";
import { saveCollection } from "@/lib/db";
import { useLiveCollection } from "@/hooks/useLiveCollection";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";
import { FormModal } from "@/components/ui/FormModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notify } from "@/lib/notify";
import { useAuth } from "@/lib/contexts/AuthContext";
import { formatDate } from "@mms/shared";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";

export interface SavedReportItem {
  id: string;
  name: string;
  category: string;
  filters: Record<string, any>;
  lastRun: string;
  createdBy: string;
}

const CATEGORY_COLOR: Record<string, string> = {
  financial:  "bg-success/10 text-success",
  students:   "bg-info/10 text-info",
  contacts:   "bg-primary/10 text-primary",
  attendance: "bg-warning/10 text-warning",
  academic:   "bg-primary/10 text-primary",
  hasanat:    "bg-primary/10 text-primary",
  sessions:   "bg-info/10 text-info",
  faculty:    "bg-secondary/10 text-secondary",
};

interface SavedReportsProps {
  category: string;
  filters?: Record<string, any>;
  onApplyFilters?: (filters: Record<string, any>) => void;
}

/**
 * Generic component for saving, listing, running, and deleting reporting presets.
 * Re-runs filter configurations against live data.
 */
export default function SavedReports({
  category,
  filters = {},
  onApplyFilters,
}: SavedReportsProps): React.JSX.Element {
  const { t } = useTranslation();
  const { user } = useAuth();
  const globalSettings = useGlobalSettings();
  const allSaved = useLiveCollection<SavedReportItem>("reports_saved_reports", []);

  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const saved = useMemo(() => {
    return allSaved.filter((report) => report.category === category);
  }, [allSaved, category]);

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setSaving(true);
    try {
      const newReport: SavedReportItem = {
        id: `rep-${Date.now()}`,
        name: trimmedName,
        category,
        filters,
        lastRun: new Date().toISOString().split("T")[0],
        createdBy: user?.name || "System",
      };

      const updatedCollection = [...allSaved, newReport];
      saveCollection("reports_saved_reports", updatedCollection);
      notify.success(t("contacts.savedReports.saveSuccess") || "Report preset saved successfully");
      setName("");
      setSaveOpen(false);
    } catch {
      notify.error(t("settings.serverSaveFailed") || "Failed to save preset");
    } finally {
      setSaving(false);
    }
  }, [name, category, filters, allSaved, user?.name, t]);

  const handleRun = useCallback(
    (report: SavedReportItem) => {
      if (!onApplyFilters) return;

      try {
        onApplyFilters(report.filters);

        // Update last run time
        const updated = allSaved.map((r) =>
          r.id === report.id
            ? { ...r, lastRun: new Date().toISOString().split("T")[0] }
            : r
        );
        saveCollection("reports_saved_reports", updated);
        notify.success(
          t("contacts.savedReports.runSuccess") || `Running report: ${report.name}`
        );
      } catch (error) {
        console.error("Failed to run preset:", error);
        notify.error("Failed to execute report preset");
      }
    },
    [onApplyFilters, allSaved, t]
  );

  const handleDelete = useCallback(
    (id: string) => {
      try {
        const filtered = allSaved.filter((report) => report.id !== id);
        saveCollection("reports_saved_reports", filtered);
        notify.info(t("contacts.savedReports.deleteSuccess") || "Report preset deleted");
      } catch {
        notify.error("Failed to delete report preset");
      }
    },
    [allSaved, t]
  );

  const formatLastRunTime = useCallback(
    (dateStr: string) => {
      return formatDate(dateStr, globalSettings.dateFormat);
    },
    [globalSettings.dateFormat]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-left">
          <h3 className="text-sm font-semibold text-foreground">{t("reports.saved.title") || "Saved Reports"}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("reports.saved.subtitle") || "Saved filter presets — re-run against live data"}
          </p>
        </div>
        {onApplyFilters && (
          <button
            onClick={() => setSaveOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            type="button"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("reports.saved.saveCurrent") || "Save Current"}
          </button>
        )}
      </div>

      {saved.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title={t("reports.saved.emptyTitle") || "No saved reports"}
          description={t("reports.saved.emptyDescription") || "Save current filters as a preset to quickly re-run them later."}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {saved.map((report) => (
            <div key={report.id} className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 shadow-sm flex flex-col gap-3 text-left">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{report.name}</h4>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${CATEGORY_COLOR[report.category] || "bg-muted text-muted-foreground"}`}>
                    {report.category}
                  </span>
                </div>
                <Bookmark className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatLastRunTime(report.lastRun)}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {report.createdBy}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-border">
                {onApplyFilters && (
                  <button
                    onClick={() => handleRun(report)}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    type="button"
                  >
                    <Play className="w-3 h-3" /> {t("reports.saved.run") || "Run"}
                  </button>
                )}
                <button
                  onClick={() => handleDelete(report.id)}
                  className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors ml-auto"
                  type="button"
                >
                  <Trash2 className="w-3 h-3" /> {t("reports.saved.delete") || "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormModal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title={t("contacts.savedReports.saveDialogTitle") || "Save report preset"}
        size="sm"
        cancelLabel={t("common.cancel") || "Cancel"}
        saveLabel={t("contacts.savedReports.save") || "Save"}
        onSave={() => void handleSave()}
        saving={saving}
        saveDisabled={!name.trim()}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="saved-report-name">{t("contacts.savedReports.nameLabel") || "Report Name"}</Label>
            <Input
              id="saved-report-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("contacts.savedReports.namePlaceholder") || "e.g. Current Month Active"}
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
