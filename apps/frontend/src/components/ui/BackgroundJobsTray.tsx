import React, { useState } from "react";
import { Download, Loader2, CheckCircle2, AlertCircle, RefreshCw, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useBackgroundJobs } from "@/hooks/useBackgroundJobs";
import { downloadBackgroundJobArtifact } from "@/lib/backgroundJobs/backgroundJobApi";
import { FormModal } from "@/components/ui/FormModal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AppTranslationKey } from "@mms/shared";

interface BackgroundJobsTrayProps {
  compact?: boolean;
  className?: string;
}

type ModuleLabelKey =
  | "backgroundJobs.module.contacts"
  | "backgroundJobs.module.students"
  | "backgroundJobs.module.accounting"
  | "backgroundJobs.module.obligations";

function moduleLabel(moduleId: string, t: (key: AppTranslationKey) => string): string {
  const keyMap: Record<string, ModuleLabelKey> = {
    contacts: "backgroundJobs.module.contacts",
    students: "backgroundJobs.module.students",
    accounting: "backgroundJobs.module.accounting",
    obligations: "backgroundJobs.module.obligations",
  };
  const key = keyMap[moduleId];
  return key ? t(key) : moduleId;
}

/** Global download / background job centre (globle1 §8). */
export function BackgroundJobsTray({
  compact = false,
  className,
}: BackgroundJobsTrayProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const { jobs, activeJobs, dismiss, clearFinished, refresh } = useBackgroundJobs();
  const [open, setOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  if (jobs.length === 0) return null;

  const badgeCount = activeJobs.length || jobs.filter((j) => j.status === "failed").length;

  const handleDownload = async (jobId: string) => {
    setDownloadingId(jobId);
    try {
      await downloadBackgroundJobArtifact(jobId);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label={t("backgroundJobs.trayLabel")}
        onClick={() => setOpen(true)}
        className={cn(
          "relative rounded-lg p-2 hover:bg-muted transition-colors",
          className,
        )}
      >
        <Download className={cn("text-muted-foreground", compact ? "h-[18px] w-[18px]" : "h-5 w-5")} />
        {badgeCount > 0 && (
          <Badge
            variant="secondary"
            className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[9px] flex items-center justify-center"
          >
            {badgeCount}
          </Badge>
        )}
      </button>

      <FormModal
        open={open}
        onClose={() => setOpen(false)}
        title={t("backgroundJobs.panelTitle")}
        size="sm"
        cancelLabel={t("common.close")}
        saveLabel={t("common.close")}
        onSave={() => setOpen(false)}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-muted-foreground">{t("backgroundJobs.panelDesc")}</p>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              {t("backgroundJobs.refresh")}
            </button>
          </div>
          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {jobs.map((job) => {
              const pct =
                job.progress && job.progress.total > 0
                  ? Math.round((job.progress.current / job.progress.total) * 100)
                  : null;
              return (
                <li
                  key={job.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border px-3 py-2.5 text-sm"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    {job.status === "running" ? (
                      <Loader2 className="w-4 h-4 shrink-0 animate-spin mt-0.5 text-info" />
                    ) : job.status === "failed" ? (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-destructive" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{job.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {moduleLabel(job.moduleId, t)}
                        {" · "}
                        {new Date(job.createdAt).toLocaleString()}
                        {pct != null ? ` · ${pct}%` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {job.status === "completed" && job.hasDownload && (
                      <button
                        type="button"
                        onClick={() => void handleDownload(job.id)}
                        disabled={downloadingId === job.id}
                        className="p-1 rounded hover:bg-muted text-primary"
                        aria-label={t("backgroundJobs.download")}
                      >
                        {downloadingId === job.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                    {job.status !== "running" && (
                      <button
                        type="button"
                        onClick={() => dismiss(job.id)}
                        className="p-1 rounded hover:bg-muted"
                        aria-label={t("backgroundJobs.dismiss")}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {jobs.some((j) => j.status !== "running") && (
            <button
              type="button"
              onClick={clearFinished}
              className="text-xs text-muted-foreground underline hover:no-underline"
            >
              {t("backgroundJobs.clearFinished")}
            </button>
          )}
        </div>
      </FormModal>
    </>
  );
}
