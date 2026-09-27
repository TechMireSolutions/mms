import type React from "react";
import { useState } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useSessions, useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import type { StudentsBulkEnrollBody } from "@mms/shared";
import { cn } from "@/lib/utils";
import { StudentsBulkEnrollSessionList } from "@/tenant/features/students/components/StudentsBulkEnrollSessionList";

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
            className="min-h-11 px-4 font-medium cursor-pointer"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || selectedSessionIds.length === 0}
            className="flex items-center gap-2 px-5 min-h-11 font-semibold cursor-pointer"
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
          <label className="text-xs font-semibold text-foreground" id="bulk-enroll-mode-label">
            {t("students.bulkEnrollMode")}
          </label>
          <div
            role="radiogroup"
            aria-labelledby="bulk-enroll-mode-label"
            className="grid grid-cols-1 sm:grid-cols-3 gap-2"
          >
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
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setMode(opt.id)}
                  className={cn(
                    "flex items-start gap-2 p-3 text-start rounded-xl border text-xs transition-colors min-h-11 cursor-pointer",
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

        <StudentsBulkEnrollSessionList
          sessions={sessions}
          isLoading={sessionsQuery.isLoading}
          selectedSessionIds={selectedSessionIds}
          onToggleSession={toggleSession}
          onSelectAll={handleSelectAll}
        />
      </form>
    </Modal>
  );
}
