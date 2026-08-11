import {
  hasWhatsApp,
  toMessagingRecipient,
  type ModuleColumnRegistryEntry,
  type Student,
} from "@mms/shared";
import { Button } from "@/components/ui/button";
import { CopyBtn } from "@/components/ui/CopyBtn";
import { EntityMessagingIconActions } from "@/components/ui/EntityMessagingIconActions";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { GrBadge } from "@/tenant/features/students/components/GrBadge";
import { renderStudentWorkColumnValue } from "@/tenant/features/students/components/studentWorkColumnCell";
import type {
  StudentListMessagingRecipient,
  StudentListTableProps,
} from "@/tenant/features/students/components/StudentListContentTypes";

export type RenderStudentListDesktopTableCellOptions = {
  studentRow: Student;
  col: ModuleColumnRegistryEntry;
  studentIdStr: string;
  displayName: string;
  sessionNames: string[];
  emptyDash: string;
  statusBadgeConfig: StudentListTableProps["statusBadgeConfig"];
  isColumnVisible: StudentListTableProps["isColumnVisible"];
  onViewStudent: StudentListTableProps["onViewStudent"];
  viewingDeleted: boolean;
  canWriteMessaging: boolean;
  onOpenComposer: (
    mode: "whatsapp" | "sms" | "email",
    recipients: StudentListMessagingRecipient[],
  ) => void;
  t: TranslationFunction;
};

/** Cell content for one Students Work desktop table column. */
export function renderStudentListDesktopTableCell({
  studentRow,
  col,
  studentIdStr,
  displayName,
  sessionNames,
  emptyDash,
  statusBadgeConfig,
  isColumnVisible,
  onViewStudent,
  viewingDeleted,
  canWriteMessaging,
  onOpenComposer,
  t,
}: RenderStudentListDesktopTableCellOptions): React.ReactNode {
  switch (col.key) {
    case "name": {
      const genderLabel =
        isColumnVisible("gender") && studentRow.gender
          ? formatContactGenderLabel(studentRow.gender, t)
          : "";
      const phoneLine = isColumnVisible("phone")
        ? studentRow.phone || t("students.list.noPhone")
        : "";
      const subtitleParts = [genderLabel, phoneLine].filter(Boolean);
      return (
        <div className="flex items-center gap-3">
          <UserAvatar
            id={studentIdStr}
            name={displayName}
            className="w-8 h-8 rounded-full text-xs font-bold"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onViewStudent(studentRow)}
                className="min-h-11 h-auto max-w-full p-0 text-sm font-semibold text-foreground hover:text-primary transition-colors text-start justify-start hover:bg-transparent"
                title={displayName}
              >
                <span className="block truncate">{displayName}</span>
              </Button>
              {isColumnVisible("grNumber") ? <GrBadge grNumber={studentRow.grNumber} /> : null}
            </div>
            {subtitleParts.length > 0 ? (
              <p className="text-xs text-muted-foreground">{subtitleParts.join(" · ")}</p>
            ) : null}
            {viewingDeleted && studentRow.deletionReason ? (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {t("students.deletionReasonLabel")}: {studentRow.deletionReason}
              </p>
            ) : null}
          </div>
        </div>
      );
    }
    case "grNumber":
      return studentRow.grNumber ? (
        <GrBadge grNumber={studentRow.grNumber} />
      ) : (
        <span className="text-sm text-muted-foreground">{emptyDash}</span>
      );
    case "gender":
      return (
        <p className="text-sm text-foreground">
          {studentRow.gender ? formatContactGenderLabel(studentRow.gender, t) : emptyDash}
        </p>
      );
    case "phone": {
      const phone = studentRow.phone?.trim() || null;
      const hasWa = hasWhatsApp(studentRow);
      return (
        <div className="flex flex-col items-start gap-1 group/phone">
          {phone ? (
            <>
              <span className="max-w-full truncate text-sm font-mono text-foreground font-medium tracking-wide" title={phone}>
                {phone}
              </span>
              <div
                className="flex items-center gap-1"
                onClick={(event) => event.stopPropagation()}
              >
                {canWriteMessaging && hasWa ? (
                  <EntityMessagingIconActions
                    primaryPhone={phone}
                    showCall={false}
                    labels={{ whatsapp: t("students.list.actionWhatsApp") }}
                    onWhatsApp={() =>
                      onOpenComposer("whatsapp", [toMessagingRecipient(studentRow)])
                    }
                    className="gap-1"
                  />
                ) : null}
                <CopyBtn text={phone} />
              </div>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">{emptyDash}</span>
          )}
        </div>
      );
    }
    case "email": {
      const email = studentRow.email?.trim() || null;
      return (
        <div className="flex min-w-0 flex-col items-start gap-1 group/email">
          <span className="max-w-full truncate text-sm text-muted-foreground" title={email || undefined}>
            {email || emptyDash}
          </span>
          {email ? (
            <div className="flex items-center gap-1">
              <CopyBtn text={email} />
            </div>
          ) : null}
        </div>
      );
    }
    case "dob":
    case "parents":
    case "sessions":
    case "status":
    case "registeredDate":
    case "notes":
    default:
      return renderStudentWorkColumnValue(studentRow, col.key, {
        t,
        statusBadgeConfig,
        sessionNames,
        emptyFallback: <span className="text-sm text-muted-foreground">{emptyDash}</span>,
      });
  }
}
