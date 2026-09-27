import React from "react";
import { Loader2, Check } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

export interface SessionItem {
  id: string | number;
  name: string;
  type?: string | null;
}

export interface StudentsBulkEnrollSessionListProps {
  sessions: SessionItem[];
  isLoading: boolean;
  selectedSessionIds: string[];
  onToggleSession: (id: string) => void;
  onSelectAll: () => void;
}

export function StudentsBulkEnrollSessionList({
  sessions,
  isLoading,
  selectedSessionIds,
  onToggleSession,
  onSelectAll,
}: StudentsBulkEnrollSessionListProps): React.JSX.Element {
  const { t } = useTranslation();
  const selectedSessionSet = new Set(selectedSessionIds);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground">
          {t("students.bulkEnrollSelectSessions")}
        </label>
        {sessions.length > 1 && (
          <button
            type="button"
            onClick={onSelectAll}
            className="text-xs text-primary hover:underline font-medium cursor-pointer"
          >
            {selectedSessionIds.length === sessions.length
              ? t("common.deselect")
              : t("students.table.selectAll")}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-6 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin me-2" />
          <span className="text-sm">{t("common.loading")}</span>
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-xs text-muted-foreground py-3">
          {t("students.detail.noClassesConfigured")}
        </p>
      ) : (
        <div className="max-h-56 overflow-y-auto space-y-1.5 pe-1 border border-border/40 rounded-xl p-2 bg-muted/20">
          {sessions.map((session) => {
            const isChecked = selectedSessionSet.has(String(session.id));
            return (
              <button
                key={session.id}
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                onClick={() => onToggleSession(String(session.id))}
                className={cn(
                  "w-full flex items-center justify-between p-2.5 rounded-lg text-xs text-start transition-colors min-h-11 cursor-pointer",
                  isChecked
                    ? "bg-primary/15 text-foreground font-semibold"
                    : "hover:bg-muted text-muted-foreground",
                )}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {session.name}
                  </p>
                  {session.type && (
                    <p className="text-3xs text-muted-foreground truncate capitalize">
                      {session.type}
                    </p>
                  )}
                </div>
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ms-2 ${
                    isChecked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 bg-background"
                  }`}
                >
                  {isChecked && <Check className="w-3.5 h-3.5" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
