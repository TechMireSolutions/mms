import type React from "react";
import { useState } from "react";
import { Users } from "lucide-react";
import ContactEditModal from "@/components/contactLink/ContactEditModal";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";
import {
  CONTACTS_MODULE_MANIFEST,
  getPrimaryPhone,
  resolveStudentGuardianLinks,
  type Contact,
  type Student,
} from "@mms/shared";
import { GuardianContactCard } from "@/tenant/features/students/components/GuardianContactCard";
import { useContactsByIds } from "@/tenant/hooks/collections/contacts";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";

interface StudentGuardianSectionProps {
  formInstanceId: string;
  studentDraft: Partial<Student>;
  linkedContact?: Contact | null;
  isFieldEnabled: (fieldId: string) => boolean;
}

export function StudentGuardianSection({
  formInstanceId,
  studentDraft,
  linkedContact,
  isFieldEnabled,
}: StudentGuardianSectionProps): React.JSX.Element {
  const { t } = useTranslation();
  const { canWrite: canWriteContacts } = useModulePermissions(CONTACTS_MODULE_MANIFEST);
  const [editContactOpen, setEditContactOpen] = useState(false);

  const guardians = resolveStudentGuardianLinks(studentDraft, linkedContact ?? null);
  const relatedIds = [
    guardians.fatherContactId,
    guardians.motherContactId,
    guardians.guardianContactId,
  ].filter(Boolean) as string[];
  const { data: relatedContacts = [] } = useContactsByIds(relatedIds);
  const byId = new Map(relatedContacts.map((contact) => [String(contact.id), contact]));

  const showFather = isFieldEnabled("fatherLink");
  const showMother = isFieldEnabled("motherLink");
  const showGuardian = isFieldEnabled("guardianLink");

  const rows: Array<{
    key: string;
    visible: boolean;
    label: string;
    badgeCode: string;
    badgeBg: string;
    badgeText: string;
    contactId?: string;
    fallbackName?: string;
  }> = [
    {
      key: "father",
      visible: showFather,
      label: t("students.form.fatherLink"),
      badgeCode: "FA",
      badgeBg: "bg-info/15",
      badgeText: "text-info",
      contactId: guardians.fatherContactId,
      fallbackName: guardians.fatherName,
    },
    {
      key: "mother",
      visible: showMother,
      label: t("students.form.motherLink"),
      badgeCode: "MO",
      badgeBg: "bg-primary/15",
      badgeText: "text-primary",
      contactId: guardians.motherContactId,
      fallbackName: guardians.motherName,
    },
    {
      key: "guardian",
      visible: showGuardian,
      label: t("students.form.guardianLink"),
      badgeCode: "GU",
      badgeBg: "bg-warning/15",
      badgeText: "text-warning",
      contactId: guardians.guardianContactId,
      fallbackName: guardians.guardianName,
    },
  ];

  const visibleRows = rows.filter((row) => row.visible);
  const hasAnyLink = visibleRows.some((row) => row.contactId || row.fallbackName);
  const canOpenContactEditor = Boolean(linkedContact?.id) && canWriteContacts;

  return (
    <div className="space-y-6" id={`sf-${formInstanceId}-guardians`} tabIndex={-1}>
      <SectionCard
        title={t("students.form.guardiansSection")}
        subtitle={t("students.form.guardiansSectionDesc")}
        icon={Users}
        accentColor="info"
      >
        {!studentDraft.contactId ? (
          <EmptyState
            compact
            icon={Users}
            title={t("students.form.guardiansNeedContact")}
          />
        ) : !hasAnyLink ? (
          <div className="space-y-3">
            <EmptyState
              compact
              icon={Users}
              title={t("students.form.guardiansFromContactsEmpty")}
              action={
                canOpenContactEditor ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    onClick={() => setEditContactOpen(true)}
                  >
                    {t("students.form.guardiansEditContactCta")}
                  </Button>
                ) : undefined
              }
            />
            {!canOpenContactEditor ? (
              <p className="text-xs text-muted-foreground text-center">{t("students.form.guardiansEditOnContact")}</p>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleRows.map((row) => {
              const contact = row.contactId ? byId.get(String(row.contactId)) : undefined;
              const name = contact?.name || row.fallbackName;
              if (!name) return null;
              const phone = contact ? getPrimaryPhone(contact) || undefined : undefined;
              return (
                <GuardianContactCard
                  key={row.key}
                  label={row.label}
                  badgeCode={row.badgeCode}
                  badgeBg={row.badgeBg}
                  badgeText={row.badgeText}
                  name={name}
                  phone={phone || undefined}
                />
              );
            })}
          </div>
        )}
        {studentDraft.contactId && hasAnyLink ? (
          <div className="mt-3">
            {canOpenContactEditor ? (
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 px-0 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setEditContactOpen(true)}
              >
                {t("students.form.guardiansEditContactCta")}
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">{t("students.form.guardiansEditOnContact")}</p>
            )}
          </div>
        ) : null}
      </SectionCard>

      <ContactEditModal
        open={editContactOpen}
        contact={linkedContact}
        onClose={() => setEditContactOpen(false)}
      />
    </div>
  );
}
