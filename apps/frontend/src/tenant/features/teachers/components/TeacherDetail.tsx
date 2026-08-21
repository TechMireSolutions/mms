import React, { useMemo } from "react";
import {
  Briefcase,
  Calendar,
  GraduationCap,
  Hash,
  IdCard,
  Mail,
  Phone,
  School,
  User,
  type LucideIcon,
} from "lucide-react";
import {
  TEACHERS_TAB_REGISTRY,
  teacherFieldLabelKey,
  type Contact,
  type Teacher,
  type TeachersSettings,
} from "@mms/shared";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import { DetailDrawerRestoreOrEditAction } from "@/components/ui/DetailDrawerArchiveChrome";
import { DetailSectionTitle } from "@/components/ui/DetailSectionTitle";
import { DrawerUpdatedStamp } from "@/components/ui/DrawerUpdatedStamp";
import { ContactPhoneAction, ContactEmailAction } from "@/components/ui/ContactAction";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import type { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { useTeacherConfig } from "@/hooks/useStandardModuleConfig";
import {
  resolveRegistryLabel,
  resolveAllContactPhones,
  resolveAllContactEmails,
} from "@/lib/contacts/contactI18n";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18nFormat";
import { getGenderIcon, getGenderIconClass } from "@/lib/genderUi";
import { teacherMessagingLabels } from "@/lib/teachers/teacherMessagingLabels";
import { TeacherArchivedBanner } from "@/tenant/features/teachers/components/TeacherArchivedBanner";
import { TeacherDetailAttributeRow } from "@/tenant/features/teachers/components/TeacherDetailAttributeRow";
import { TeacherDetailHero } from "@/tenant/features/teachers/components/TeacherDetailHero";
import { TeacherDetailNotesSection } from "@/tenant/features/teachers/components/TeacherDetailNotesSection";
import { TeacherDetailQuickActions } from "@/tenant/features/teachers/components/TeacherDetailQuickActions";
import { TeacherDetailSessionsSection } from "@/tenant/features/teachers/components/TeacherDetailSessionsSection";
import type { TeacherDetailFieldRow } from "@/tenant/features/teachers/components/teacherDetailFields";
import {
  resolveTeacherDisplayName,
  resolveTeacherFieldDisplayText,
} from "@/tenant/features/teachers/components/teacherFieldDisplay";
import { useTeacherDetailModel } from "@/tenant/features/teachers/components/useTeacherDetailModel";

interface TeacherDetailProps {
  teacher: Teacher;
  onClose: () => void;
  onEdit?: (teacher: Teacher) => void;
  canDelete?: boolean;
  onRestore?: (teacherId: string) => void | Promise<void>;
  onPrintIdCard?: (teacher: Teacher) => void;
  /** Page-owned composer — do not create a second MessageComposer in the drawer. */
  openComposer: ReturnType<typeof useMessageComposerState>["openComposer"];
  canWriteMessaging: boolean;
}

const SYSTEM_FIELD_ICONS: Record<string, LucideIcon> = {
  contactId: User,
  employeeId: Hash,
  specialization: Briefcase,
  qualification: GraduationCap,
  joinDate: Calendar,
  status: Briefcase,
};

/** Resolve a tab key to its translated section title (Students grouped-fields parity). */
function resolveTeacherTabLabel(
  settings: TeachersSettings,
  tabId: string,
  t: TranslationFunction,
): string {
  const tabs = settings.formTabs && settings.formTabs.length > 0
    ? settings.formTabs
    : TEACHERS_TAB_REGISTRY;
  const tab = tabs.find((candidate) => candidate.key === tabId);
  if (!tab) return tabId;
  return resolveRegistryLabel({ label: tab.label, labelKey: tab.labelKey }, t);
}

export const TeacherDetail = React.memo(function TeacherDetail({
  teacher,
  onClose,
  onEdit,
  canDelete = false,
  onRestore,
  onPrintIdCard,
  openComposer,
  canWriteMessaging,
}: TeacherDetailProps): React.JSX.Element {
  const { t } = useTranslation();
  const { settings, isFieldEnabled } = useTeacherConfig();
  const {
    statusConfig,
    detailFields,
    linkedContact,
    primaryPhone,
    primaryEmail,
    hasWhatsAppContact,
    hasVisibleDetailFields,
    assignedClasses,
    sessionsLoading,
    sessionsError,
  } = useTeacherDetailModel(teacher);

  const isArchived = Boolean(teacher.deletedAt);
  const emptyDash = t("teachers.table.emptyDash");

  const displayName = resolveTeacherDisplayName(teacher, t, linkedContact);

  const headerActionsNode = useMemo(
    () => (
      <div className="flex items-center gap-1.5">
        {!isArchived && onPrintIdCard && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPrintIdCard(teacher)}
            className="min-h-11 px-3 gap-1.5 font-medium text-xs border-border/60 hover:bg-muted/80"
            title={t("teachers.detail.printIdCard")}
            aria-label={t("teachers.detail.printIdCard")}
          >
            <IdCard className="w-3.5 h-3.5" aria-hidden />
            <span className="hidden sm:inline">{t("teachers.detail.printIdCard")}</span>
          </Button>
        )}
        <DetailDrawerRestoreOrEditAction
          isArchived={isArchived}
          canRestore={canDelete}
          canEdit={Boolean(onEdit)}
          restoreLabel={t("teachers.restore")}
          editLabel={t("teachers.detail.editTitle")}
          onRestore={onRestore ? () => onRestore(String(teacher.id)) : undefined}
          onEdit={onEdit ? () => onEdit(teacher) : undefined}
        />
      </div>
    ),
    [isArchived, onPrintIdCard, canDelete, onEdit, t, onRestore, teacher],
  );

  const headerExtraNode = useMemo(
    () => <TeacherArchivedBanner teacher={teacher} />,
    [teacher],
  );

  const footerNode = useMemo(
    () => (
      <DrawerUpdatedStamp
        updatedAt={teacher.updatedAt}
        createdAt={teacher.createdAt}
        label={t("teachers.detail.updatedLabel")}
      />
    ),
    [teacher.updatedAt, teacher.createdAt, t],
  );

  const fieldsSections = useMemo(() => {
    if (!hasVisibleDetailFields) return null;

    const rowForField = (field: TeacherDetailFieldRow): React.ReactNode => {
      const label = resolveRegistryLabel(field, t);
      const icon = field.isCustom
        ? School
        : (SYSTEM_FIELD_ICONS[field.key] ?? School);
      const displayValue = resolveTeacherFieldDisplayText(teacher, field.key, {
        t,
        displayName,
        customFieldLabel: field.label,
        customFieldType: field.type,
        isCustom: field.isCustom,
      });
      return (
        <TeacherDetailAttributeRow
          key={field.key}
          variant="inset"
          icon={icon}
          label={label}
          value={displayValue || emptyDash}
        />
      );
    };

    const contactRows: React.ReactNode[] = [];
    contactRows.push(
      <TeacherDetailAttributeRow
        key="gender"
        variant="inset"
        icon={getGenderIcon(teacher.gender)}
        iconClassName={getGenderIconClass(teacher.gender)}
        label={t(teacherFieldLabelKey("gender"))}
        value={teacher.gender ? formatContactGenderLabel(teacher.gender, t) : emptyDash}
      />,
    );
    const messagingLabels = teacherMessagingLabels(t);
    const allPhones = resolveAllContactPhones(teacher as unknown as Contact);
    const allEmails = resolveAllContactEmails(teacher as unknown as Contact);

    if (allPhones.length > 0) {
      allPhones.forEach((p, idx) => {
        contactRows.push(
          <TeacherDetailAttributeRow
            key={`phone-${p.phone}-${idx}`}
            variant="inset"
            icon={Phone}
            label={p.label || t(teacherFieldLabelKey("phone"))}
            value={
              <ContactPhoneAction
                phone={p.phone}
                phoneDisplay={p.phoneDisplay}
                countryCode={p.countryCode}
                name={displayName}
                variant="inline"
                labels={{
                  call: messagingLabels.call,
                  sms: messagingLabels.sms,
                  whatsapp: messagingLabels.whatsapp,
                  copy: t("contacts.table.copy"),
                  copied: t("contacts.table.copied"),
                }}
              />
            }
          />,
        );
      });
    }

    if (allEmails.length > 0) {
      allEmails.forEach((e, idx) => {
        contactRows.push(
          <TeacherDetailAttributeRow
            key={`email-${e.email}-${idx}`}
            variant="inset"
            icon={Mail}
            label={e.label || t(teacherFieldLabelKey("email"))}
            value={
              <ContactEmailAction
                email={e.email}
                name={displayName}
                variant="inline"
                labels={{
                  mail: messagingLabels.email,
                  copy: t("contacts.table.copy"),
                  copied: t("contacts.table.copied"),
                }}
              />
            }
          />,
        );
      });
    }

    const byTab = new Map<string, TeacherDetailFieldRow[]>();
    const order: string[] = [];
    for (const field of detailFields) {
      if (field.key === "status" || field.key === "notes") continue;
      let list = byTab.get(field.tab);
      if (!list) {
        list = [];
        byTab.set(field.tab, list);
        order.push(field.tab);
      }
      list.push(field);
    }

    // Contact-owned rows (gender/phone/email) attach to the basic profile tab.
    const basicTabId = "basic";
    if (contactRows.length > 0 && !order.includes(basicTabId)) order.unshift(basicTabId);

    return order.map((tabId) => {
      const rows: React.ReactNode[] = (byTab.get(tabId) ?? []).map(rowForField);
      if (tabId === basicTabId) rows.push(...contactRows);
      if (rows.length === 0) return null;
      return (
        <div key={tabId} className="space-y-2">
          <DetailSectionTitle>
            {resolveTeacherTabLabel(settings, tabId, t)}
          </DetailSectionTitle>
          <Card className="divide-y divide-border/50 p-0">{rows}</Card>
        </div>
      );
    });
  }, [detailFields, displayName, emptyDash, hasVisibleDetailFields, primaryEmail, primaryPhone, settings, t, teacher]);

  return (
    <DetailDrawerShell
      onClose={onClose}
      title={t("teachers.detail.title")}
      subtitle={
        isArchived
          ? t("teachers.detail.archivedSubtitle")
          : t("teachers.detail.employeeSubtitle", {
              id: teacher.employeeId || t("common.notSpecified"),
            })
      }
      icon={School}
      ariaLabel={t("teachers.detail.ariaLabel", {
        name: displayName,
      })}
      headerActions={headerActionsNode}
      headerExtra={headerExtraNode}
      footer={footerNode}
    >
      <TeacherDetailHero
        teacher={teacher}
        displayName={displayName}
        avatar={linkedContact?.avatar ?? teacher.avatar}
        statusConfig={statusConfig}
        showStatus={isFieldEnabled("status")}
      />

      {!isArchived && canWriteMessaging && (
        <TeacherDetailQuickActions
          teacher={teacher}
          displayName={displayName}
          primaryPhone={primaryPhone}
          primaryEmail={primaryEmail}
          hasWhatsAppContact={hasWhatsAppContact}
          canWriteMessaging={canWriteMessaging}
          onOpenComposer={openComposer}
        />
      )}

      {fieldsSections}

      <TeacherDetailSessionsSection
        assignedClasses={assignedClasses}
        loading={sessionsLoading}
        error={sessionsError}
      />

      {teacher.notes && isFieldEnabled("notes") && (
        <TeacherDetailNotesSection notes={teacher.notes} />
      )}
    </DetailDrawerShell>
  );
});

export default TeacherDetail;
