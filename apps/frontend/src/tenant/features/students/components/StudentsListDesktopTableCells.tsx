import {
  toMessagingRecipient,
  type ModuleColumnRegistryEntry,
  type Student,
} from "@mms/shared";
import { Button } from "@/components/ui/button";
import { ContactPhoneAction, ContactEmailAction } from "@/components/ui/ContactAction";
import { PersonIdentityMeta } from "@/components/ui/PersonIdentityMeta";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { GrBadge } from "@/tenant/features/students/components/GrBadge";
import { renderStudentWorkColumnValue } from "@/tenant/features/students/components/studentWorkColumnCell";
import type {
  StudentsListContentMessagingRecipient,
  StudentsListContentTableProps,
} from "@/tenant/features/students/components/studentsListTypes";

export interface RenderStudentsListDesktopTableCellOptions {
  studentRow: Student;
  col: ModuleColumnRegistryEntry;
  studentIdStr: string;
  displayName: string;
  emptyDash: string;
  statusBadgeConfig: StudentsListContentTableProps["statusBadgeConfig"];
  isColumnVisible: StudentsListContentTableProps["isColumnVisible"];
  onViewStudent: StudentsListContentTableProps["onViewStudent"];
  viewingDeleted: boolean;
  canWriteMessaging: boolean;
  onOpenComposer: (
    mode: "whatsapp" | "sms" | "email",
    recipients: StudentsListContentMessagingRecipient[],
  ) => void;
  t: TranslationFunction;
}

/** Cell content for one Students Work desktop table column. */
export function renderStudentsListDesktopTableCell({
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
}: RenderStudentsListDesktopTableCellOptions): React.ReactNode {
  switch (col.key) {
    case "name": {
      const studentName = studentRow.name?.trim() || displayName || emptyDash;
      const fatherName = studentRow.fatherName?.trim();
      const motherName = studentRow.motherName?.trim();
      const guardianName = studentRow.guardianName?.trim();

      const fatherLabel = t("students.detail.father");
      const motherLabel = t("students.detail.mother");
      const guardianLabel = t("students.idCard.guardian");

      return (
        <div className="flex items-start gap-3 min-w-0 py-0.5">
          <UserAvatar
            id={studentIdStr}
            name={studentName}
            avatar={typeof studentRow.avatar === "string" ? studentRow.avatar : undefined}
            gender={studentRow.gender}
            size="md"
            className="shrink-0 mt-0.5"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center min-w-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onViewStudent(studentRow)}
                className="h-auto p-0 text-sm font-semibold text-foreground hover:text-primary transition-colors text-start justify-start hover:bg-transparent"
                title={studentName}
              >
                <span className="block truncate font-bold">{studentName}</span>
              </Button>
            </div>
            {fatherName ? (
              <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5" title={fatherName}>
                <span className="text-muted-foreground/70">{fatherLabel}:</span> {fatherName}
              </p>
            ) : null}
            {motherName ? (
              <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5" title={motherName}>
                <span className="text-muted-foreground/70">{motherLabel}:</span> {motherName}
              </p>
            ) : null}
            {!fatherName && !motherName && guardianName ? (
              <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5" title={guardianName}>
                <span className="text-muted-foreground/70">{guardianLabel}:</span> {guardianName}
              </p>
            ) : null}
            {viewingDeleted && studentRow.deletionReason ? (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2" title={studentRow.deletionReason}>
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
        <PersonIdentityMeta gender={studentRow.gender} size="sm" pill />
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
