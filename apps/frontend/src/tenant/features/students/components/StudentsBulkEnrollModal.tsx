import type React from "react";
import { useState } from "react";
import { BookOpen, Loader2, Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useSessions, useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import type { StudentsBulkEnrollBody } from "@mms/shared";
import { cn } from "@/lib/utils";

export interface StudentsBulkEnrollModalProps {
  open: boolean;
  onClose: () => void;
  selectedCount: number;
  onConfirm: (payload: { sessionIds: string[]; mode: StudentsBulkEnrollBody["mode"] }) => Promise<void> | void;
  isPending?: boolean;
}

export function StudentsBulkEnrollModal({
  open,
  onClose,
  selectedCount,
  onConfirm,
  isPending = false,
}: StudentsBulkEnrollModalProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const sessionsQuery = useSessions();
  const sessions = useSessionsCollection();

  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [mode, setMode] = useState<StudentsBulkEnrollBody["mode"]>("add");

  if (!open) return null;

  const toggleSession = (id: string) => {
    setSelectedSessionIds((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(id)) {
        nextSet.delete(id);
      } else {
        nextSet.add(id);
      }
      return [...nextSet];
    });
  };

  const handleSelectAll = () => {
    if (selectedSessionIds.length === sessions.length) {
      setSelectedSessionIds([]);
    } else {
      setSelectedSessionIds(sessions.map((s) => String(s.id)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSessionIds.length === 0) return;
    await onConfirm({ sessionIds: selectedSessionIds, mode });
    setSelectedSessionIds([]);
    onClose();
  };

  const selectedSessionSet = new Set(selectedSessionIds);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("students.bulkEnrollTitle")}
      icon={BookOpen}
      size="md"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="min-h-11 px-4 font-medium"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || selectedSessionIds.length === 0}
            className="flex items-center gap-2 px-5 min-h-11 font-semibold"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <BookOpen className="w-4 h-4" />
            )}
            <span>{t("students.bulkEnroll")}</span>
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-sm text-muted-foreground">
          {t("students.bulkEnrollDesc", { count: selectedCount })}
        </p>

        {/* Action Mode Radio Group */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">
            {t("students.bulkEnrollMode")}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(
              [
                { id: "add", label: t("students.bulkEnrollModeAdd") },
                { id: "replace", label: t("students.bulkEnrollModeReplace") },
                { id: "remove", label: t("students.bulkEnrollModeRemove") },
              ] as const
            ).map((opt) => {
              const isSelected = mode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMode(opt.id)}
                  className={cn(
                    "flex items-start gap-2 p-3 text-start rounded-xl border text-xs transition-colors min-h-11",
                    isSelected
                      ? "border-primary bg-primary/10 text-foreground font-medium ring-1 ring-primary"
                      : "border-border/60 hover:bg-muted/50 text-muted-foreground",
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40",
                    )}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-background" />}
                  </div>
                  <span className="leading-tight">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sessions Selection List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">
              {t("students.bulkEnrollSelectSessions")}
            </label>
            {sessions.length > 1 && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-primary hover:underline font-medium"
              >
                {selectedSessionIds.length === sessions.length
                  ? t("common.deselect")
                  : t("students.table.selectAll")}
              </button>
            )}
          </div>

          {sessionsQuery.isLoading ? (
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
                    onClick={() => toggleSession(String(session.id))}
                    className={cn(
                      "w-full flex items-center justify-between p-2.5 rounded-lg text-xs text-start transition-colors min-h-11",
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
      </form>
    </Modal>
  );
}
