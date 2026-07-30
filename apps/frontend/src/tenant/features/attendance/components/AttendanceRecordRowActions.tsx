import type React from "react";
import { Check, MessageCircle, MessageSquare, Pencil, RotateCcw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import type { AttendanceRecord } from "@/lib/data/attendanceData";

interface AttendanceRecordRowActionsProps {
  attendanceRecord: AttendanceRecord;
  editingRecord: AttendanceRecord | null;
  canWriteAttendance: boolean;
  canDeleteAttendance: boolean;
  showDeleted: boolean;
  onMessage?: (channel: "sms" | "whatsapp" | "email", records: AttendanceRecord[]) => void;
  onRestoreRecord: (id: string) => Promise<void>;
  setEditingRecord: React.Dispatch<React.SetStateAction<AttendanceRecord | null>>;
  setPendingDeleteId: React.Dispatch<React.SetStateAction<string | null>>;
  saveEditingRecord: () => Promise<void>;
  t: TranslationFunction;
}

export function AttendanceRecordRowActions({
  attendanceRecord,
  editingRecord,
  canWriteAttendance,
  canDeleteAttendance,
  showDeleted,
  onMessage,
  onRestoreRecord,
  setEditingRecord,
  setPendingDeleteId,
  saveEditingRecord,
  t,
}: AttendanceRecordRowActionsProps): React.JSX.Element {
  const isEditing = editingRecord?.id === attendanceRecord.id;

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {onMessage && !showDeleted && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onMessage("whatsapp", [attendanceRecord])}
            aria-label={t("attendance.message.whatsapp")}
            title={t("attendance.message.whatsapp")}
            className="text-muted-foreground hover:text-success"
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onMessage("sms", [attendanceRecord])}
            aria-label={t("attendance.message.sms")}
            title={t("attendance.message.sms")}
            className="text-muted-foreground hover:text-info"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </Button>
        </>
      )}
      {canWriteAttendance && !showDeleted && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              if (isEditing) {
                void saveEditingRecord();
              } else {
                setEditingRecord(attendanceRecord);
              }
            }}
            aria-label={isEditing ? t("common.save") : t("common.edit")}
            className="text-muted-foreground hover:text-primary"
          >
            {isEditing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
          </Button>
          {isEditing && (
            <Button type="button" variant="ghost" size="icon" onClick={() => setEditingRecord(null)} aria-label={t("common.cancel")}>
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </>
      )}
      {canDeleteAttendance && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => showDeleted
            ? void onRestoreRecord(attendanceRecord.id)
            : setPendingDeleteId(attendanceRecord.id)}
          aria-label={showDeleted ? t("attendance.restoreRecord") : t("attendance.deleteRecord")}
          className="text-muted-foreground hover:text-destructive"
        >
          {showDeleted ? <RotateCcw className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
        </Button>
      )}
    </div>
  );
}
