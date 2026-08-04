import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Download, Mail, MessageCircle, MessageSquare, RotateCcw, Tag } from "lucide-react";
import type { ReactElement } from "react";
import type { StandardMessagingRecipient, Student } from "@mms/shared";
import { toMessagingRecipient } from "@mms/shared";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";

type MessageChannel = "whatsapp" | "sms" | "email";

interface StudentListSelectionBarProps {
  selectedIds: string[];
  selectedStudents: Student[];
  showDeleted: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canWriteMessaging?: boolean;
  canExport?: boolean;
  studentStatusOptions: readonly string[];
  statusBadgeConfig: Record<string, StatusBadgeConfigItem>;
  onOpenComposer: (channel: MessageChannel, recipients: StandardMessagingRecipient[]) => void;
  onBulkStatusChange?: (ids: string[], status: string) => void;
  onBulkExport?: () => void;
  onRequestBulkDelete: () => void;
  onRequestBulkRestore: () => void;
  onClearSelection: () => void;
}

export function StudentListSelectionBar({
  selectedIds,
  selectedStudents,
  showDeleted,
  canWrite,
  canDelete,
  canWriteMessaging = false,
  canExport = false,
  studentStatusOptions,
  statusBadgeConfig,
  onOpenComposer,
  onBulkStatusChange,
  onBulkExport,
  onRequestBulkDelete,
  onRequestBulkRestore,
  onClearSelection,
}: StudentListSelectionBarProps): ReactElement {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-x-4 bottom-4 z-40 max-w-full sm:inset-x-auto sm:end-6 sm:bottom-6 bg-card/95 border border-primary/20 backdrop-blur-xl shadow-2xl rounded-2xl p-3 flex flex-wrap items-center gap-3 border-s-4 border-s-primary"
        >
          <span className="text-xs font-bold text-foreground ps-1">
            {t("students.selectedCount", { count: selectedIds.length })}
          </span>

          <div className="h-4 w-px bg-border" />

          {showDeleted ? (
            canDelete && (
              <Button
                type="button"
                variant="outline"
                onClick={onRequestBulkRestore}
                className="px-3 py-1.5 rounded-lg border-primary/40 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors min-h-11 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> {t("students.bulkRestore")}
              </Button>
            )
          ) : (
            <>
              {canWriteMessaging && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenComposer("whatsapp", selectedStudents.map((student) => toMessagingRecipient(student)))}
                    className="px-3 py-1.5 rounded-lg border-border text-xs font-semibold hover:bg-muted text-foreground transition-colors min-h-11 flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-success" /> {t("students.list.actionWhatsApp")}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenComposer("sms", selectedStudents.map((student) => toMessagingRecipient(student)))}
                    className="px-3 py-1.5 rounded-lg border-border text-xs font-semibold hover:bg-muted text-foreground transition-colors min-h-11 flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-info" /> {t("students.list.actionSms")}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenComposer("email", selectedStudents.filter((student) => student.email).map((student) => toMessagingRecipient(student)))}
                    className="px-3 py-1.5 rounded-lg border-border text-xs font-semibold hover:bg-muted text-foreground transition-colors min-h-11 flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5 text-primary" /> {t("students.list.actionEmail")}
                  </Button>
                </>
              )}

              {canExport && onBulkExport && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBulkExport}
                  className="px-3 py-1.5 rounded-lg border-border text-xs font-semibold hover:bg-muted text-foreground transition-colors min-h-11 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-primary" /> {t("students.bulkExport")}
                </Button>
              )}

              {canWrite && onBulkStatusChange && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="px-3 py-1.5 rounded-lg border-border text-xs font-semibold hover:bg-muted text-foreground transition-colors min-h-11 flex items-center gap-1.5"
                    >
                      <Tag className="w-3.5 h-3.5 text-primary" /> {t("students.columns.status")} <ChevronDown className="w-3 h-3 ms-0.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {studentStatusOptions.map((statusVal) => (
                      <DropdownMenuItem
                        key={statusVal}
                        onClick={() => {
                          onBulkStatusChange(selectedIds, statusVal);
                          onClearSelection();
                        }}
                      >
                        <StatusBadge status={statusVal} size="sm" config={statusBadgeConfig} />
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {canDelete && (
                <>
                  <div className="h-4 w-px bg-border" />
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={onRequestBulkDelete}
                    className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-colors min-h-11"
                  >
                    {t("students.list.remove")}
                  </Button>
                </>
              )}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
