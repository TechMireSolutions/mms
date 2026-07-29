import React, { useMemo, useState, useCallback } from "react";
import { Bookmark, Trash2, Play, Plus, Clock, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { saveCollection } from "@/lib/db";
import { useLiveCollection } from "@/hooks/useLiveCollection";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";
import { FormModal } from "@/components/ui/FormModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { notify } from "@/lib/notify";
import { useAuth } from "@/lib/contexts/AuthContext";
import { formatDate, todayISO, type AppTranslationKey } from "@mms/shared";

import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";

const MotionCard = motion.create(Card);

export interface SavedReportItem {
  id: string;
  name: string;
  category: string;
  filters: Record<string, unknown>;
  lastRun: string;
  createdBy: string;
}

const CATEGORY_BADGE_CLS: Record<string, string> = {
  financial:  SEMANTIC_BADGE.success,
  students:   SEMANTIC_BADGE.info,
  contacts:   "bg-primary/10 text-primary border-primary/20",
  attendance: SEMANTIC_BADGE.warning,
  academic:   "bg-primary/10 text-primary border-primary/20",
  hasanat:    "bg-primary/10 text-primary border-primary/20",
  sessions:   SEMANTIC_BADGE.info,
  faculty:    SEMANTIC_BADGE.secondary,
};

interface SavedReportsProps {
  category: string;
  filters?: Record<string, unknown>;
  onApplyFilters?: (filters: Record<string, unknown>) => void;
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
  const allSaved = useLiveCollection<SavedReportItem>("reports_saved_reports", [], { serverSync: false });

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
        lastRun: todayISO(),
        createdBy: user?.name || "System",
      };

      const updatedCollection = [...allSaved, newReport];
      saveCollection("reports_saved_reports", updatedCollection);
      notify.success(t("contacts.savedReports.saveSuccess"));
      setName("");
      setSaveOpen(false);
    } catch {
      notify.error(t("contacts.savedReports.saveDialogTitle"));
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
            ? { ...r, lastRun: todayISO() }
            : r
        );

        saveCollection("reports_saved_reports", updated);
        notify.success(t("contacts.savedReports.runSuccess"));
      } catch {
        notify.error(t("contacts.savedReports.staleWarningTitle"));
      }
    },
    [onApplyFilters, allSaved, t]
  );

  const handleDelete = useCallback(
    (id: string) => {
      try {
        const filtered = allSaved.filter((report) => report.id !== id);
        saveCollection("reports_saved_reports", filtered);
        notify.info(t("contacts.savedReports.deleteSuccess"));
      } catch {
        notify.error(t("contacts.savedReports.delete"));
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

      {saved.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title={t("reports.saved.emptyTitle")}
          description={t("reports.saved.emptyDescription")}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {saved.map((report) => (
              <MotionCard
                key={report.id}
                layout
                whileHover={{ y: -4, scale: 1.015 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="flex flex-col gap-3 text-start group cursor-pointer hover:shadow-surface-lg p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{report.name}</h4>
                    <StatusBadge
                      status={report.category}
                      size="sm"
                      config={{
                        [report.category]: {
                          label: t(`reports.category.${report.category}` as AppTranslationKey),
                          cls: CATEGORY_BADGE_CLS[report.category] ?? SEMANTIC_BADGE.muted,
                        },
                      }}
                    />
                  </div>
                  <Bookmark className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRun(report)}
                      className="px-2 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 gap-1 cursor-pointer"
                      type="button"
                    >
                      <Play className="w-3 h-3" /> {t("reports.saved.run")}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(report.id)}
                    className="px-2 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1 ms-auto cursor-pointer"
                    type="button"
                  >
                    <Trash2 className="w-3 h-3" /> {t("reports.saved.delete")}
                  </Button>
                </div>
              </MotionCard>
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
