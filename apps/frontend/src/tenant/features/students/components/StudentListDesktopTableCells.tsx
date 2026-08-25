import {
  toMessagingRecipient,
  type ModuleColumnRegistryEntry,
  type Student,
} from "@mms/shared";
import { Button } from "@/components/ui/button";
import { ContactPhoneAction, ContactEmailAction } from "@/components/ui/ContactAction";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { GrBadge } from "@/tenant/features/students/components/GrBadge";
import { renderStudentWorkColumnValue } from "@/tenant/features/students/components/studentWorkColumnCell";
import type {
  StudentListMessagingRecipient,
  StudentListTableProps,
} from "@/tenant/features/students/components/StudentListContentTypes";

type RenderStudentListDesktopTableCellOptions = {
  studentRow: Student;
  col: ModuleColumnRegistryEntry;
  studentIdStr: string;
  displayName: string;
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
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar
            id={studentIdStr}
            name={displayName}
            avatar={studentRow.avatar as string | undefined}
            size="md"
            className="shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
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
              <p className="text-xs text-muted-foreground truncate">{subtitleParts.join(" · ")}</p>
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
      return studentRow.gender ? (
        <p className="text-sm text-foreground">{formatContactGenderLabel(studentRow.gender, t)}</p>
      ) : (
        <span className="text-sm text-muted-foreground/40">{emptyDash}</span>
      );
    case "phone": {
      const phone = studentRow.phone?.trim() || null;
      return (
        <ContactPhoneAction
          phone={phone}
          name={displayName}
          disabled={viewingDeleted}
          emptyFallback={<span className="text-sm text-muted-foreground">{emptyDash}</span>}
          labels={{
            call: t("students.detail.call"),
            sms: t("students.list.actionSms"),
            whatsapp: t("students.list.actionWhatsApp"),
            copy: t("contacts.table.copy"),
            copied: t("contacts.table.copied"),
          }}
          onWhatsApp={
            canWriteMessaging && phone
              ? () => onOpenComposer("whatsapp", [toMessagingRecipient(studentRow)])
              : undefined
          }
          onSms={
            canWriteMessaging && phone
              ? () => onOpenComposer("sms", [toMessagingRecipient(studentRow)])
              : undefined
          }
        />
      );
    }
    case "email": {
      const email = studentRow.email?.trim() || null;
      return (
        <ContactEmailAction
          email={email}
          name={displayName}
          disabled={viewingDeleted}
          emptyFallback={<span className="text-sm text-muted-foreground">{emptyDash}</span>}
          labels={{
            mail: t("students.list.actionEmail"),
            copy: t("contacts.table.copy"),
            copied: t("contacts.table.copied"),
          }}
          onEmail={
            canWriteMessaging && email
              ? () => onOpenComposer("email", [toMessagingRecipient(studentRow)])
              : undefined
          }
        />
      );
    }
    case "dob":
    case "parents":
    case "status":
    case "registeredDate":
    case "notes":
    default:
      return renderStudentWorkColumnValue(studentRow, col.key, {
        t,
        statusBadgeConfig,
        emptyFallback: <span className="text-sm text-muted-foreground/40">{emptyDash}</span>,
      });
  }
}
