import React, { useMemo, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Edit2, MessageCircle, Phone, MessageSquare, Mail, FileText,
  Calendar, User, Clock, BookOpen, GraduationCap
} from "lucide-react";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import {
  DEFAULT_STUDENT_ENABLED_TABS,
  type FieldDefinition,
  type Student,
  calcAge,
  formatDate,
  formatDateTime,
  formatMoney,
  getPrimaryPhone,
  getPrimaryEmail,
  toMessagingRecipient,
  toTitleCase,
} from "@mms/shared";
import { useSessionsCollection } from '@/tenant/features/sessions/hooks/useSessions';
import { useContactsByIds } from '@/tenant/features/contacts/hooks/useContacts';
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";
import { useTranslation } from "@/hooks/useTranslation";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { GrBadge } from "@/tenant/features/students/components/GrBadge";

function cleanTelUri(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

interface GuardianContactCardProps {
  label: string;
  badgeCode: string;
  badgeBg: string;
  badgeText: string;
  name: string;
  phone?: string;
  onWhatsApp?: () => void;
  onSms?: () => void;
}

function GuardianContactCard({ label, badgeCode, badgeBg, badgeText, name, phone, onWhatsApp, onSms }: GuardianContactCardProps) {
  const { t } = useTranslation();
  return (
    <Card accentColor="indigo" className="p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 text-start ms-1">
          <div className={`w-8 h-8 rounded-lg ${badgeBg} ${badgeText} flex items-center justify-center text-[10px] font-bold flex-shrink-0`}>
            {badgeCode}
          </div>
          <div className="min-w-0">
            <span className={`text-[8px] font-black uppercase tracking-widest ${badgeText} mb-0.5 block`}>{label}</span>
            <h5 className="text-xs font-bold text-foreground truncate">{name}</h5>
            {phone && <p className="text-[10px] text-muted-foreground mt-0.5">{phone}</p>}
          </div>
        </div>
        {phone && (
          <div className="flex items-center gap-1 me-1">
            {onWhatsApp && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onWhatsApp}
                className="h-7 w-7 p-1 rounded-lg border border-border hover:bg-success/10 hover:border-success/30 text-success transition-colors"
                title={t("students.list.actionWhatsApp")}
                aria-label={t("students.list.actionWhatsApp")}
              >
                <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
              </Button>
            )}
            {onSms && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onSms}
                className="h-7 w-7 p-1 rounded-lg border border-border hover:bg-info/10 hover:border-info/30 text-info transition-colors"
                title={t("students.list.actionSms")}
                aria-label={t("students.list.actionSms")}
              >
                <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
              </Button>
            )}
            <a
              href={cleanTelUri(phone)}
              className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label={t("students.detail.callPhone", { phone })}
              title={t("students.detail.callPhone", { phone })}
            >
              <Phone className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        )}
      </div>
    </Card>
  );
}

interface StudentDetailAttributeRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}

function StudentDetailAttributeRow({ icon: Icon, label, value }: StudentDetailAttributeRowProps) {
  return (
    <div className="relative overflow-hidden group/row flex items-center gap-3 p-3 bg-card/45 backdrop-blur-xs rounded-2xl border border-border/80 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="absolute start-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/row:bg-primary" />
      <div className="p-2 rounded-lg bg-muted text-muted-foreground ms-1">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0 text-start">
        <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-tight mb-0.5">{label}</span>
        <span className="text-xs font-semibold text-foreground">{value}</span>
      </div>
    </div>
  );
}

interface StudentDetailProps {
  student: Student;
  onClose: () => void;
  onEdit?: (student: Student) => void;
}

const MessageComposer = lazy(() => import("@/components/ui/MessageComposer"));

/**
 * Detailed slide-over panel displaying student records, guardian profiles, and enrolled courses.
 */
export default function StudentDetail({ student, onClose, onEdit }: StudentDetailProps): React.JSX.Element {
  const { t } = useTranslation();
  const { messagingTarget, openComposer, closeComposer } = useMessageComposerState();
  const sessions = useSessionsCollection();
  const linkedIds = useMemo(
    () => [student.contactId, student.fatherContactId, student.motherContactId, student.guardianContactId],
    [student.contactId, student.fatherContactId, student.motherContactId, student.guardianContactId],
  );
  const contacts = useContactsByIds(linkedIds);
  const contactList = contacts.data ?? [];

  const { settings } = useStudentConfig();
  const fields = useMemo(() => settings.fields || {}, [settings.fields]);

  const tabOrderMap = useMemo(() => {
    const tabs = settings.formTabs || [];
    return Object.fromEntries(tabs.map((tab, tabIndex) => [tab.key, tabIndex]));
  }, [settings.formTabs]);

  const enabledTabIds = useMemo(() => new Set(settings.enabledTabs || DEFAULT_STUDENT_ENABLED_TABS), [settings.enabledTabs]);

  const sortedEnabledFields = useMemo(() => {
    const list: Array<{
      key: string;
      label: string;
      type: string;
      tab: string;
      enabled: boolean;
      order: number;
    }> = [];

    Object.entries(fields).forEach(([tabId, tabFields]) => {
      if (tabId !== "basic" && !enabledTabIds.has(tabId)) return;
      (tabFields as FieldDefinition[]).forEach((fieldDefinition) => {
        if (fieldDefinition.enabled) {
          list.push({
            key: fieldDefinition.key,
            label: fieldDefinition.label,
            type: fieldDefinition.type,
            tab: tabId,
            enabled: fieldDefinition.enabled,
            order: fieldDefinition.order,
          });
        }
      });
    });

    return list.sort((a, b) => {
      const aTabIdx = tabOrderMap[a.tab] ?? 9999;
      const bTabIdx = tabOrderMap[b.tab] ?? 9999;
      if (aTabIdx !== bTabIdx) {
        return aTabIdx - bTabIdx;
      }
      return (a.order ?? 999) - (b.order ?? 999);
    });
  }, [fields, enabledTabIds, tabOrderMap]);

  const studentContact = contactList.find((contact) => String(contact.id) === String(student.contactId));
  const fatherContact = contactList.find((contact) => String(contact.id) === String(student.fatherContactId));
  const motherContact = contactList.find((contact) => String(contact.id) === String(student.motherContactId));
  const guardianContact = contactList.find((contact) => String(contact.id) === String(student.guardianContactId));

  const age = calcAge(student.dob);
  const enrolledSessionDetails = sessions.filter((session) => student.enrolledSessions?.includes(session.id));

  const primaryPhone = (studentContact ? getPrimaryPhone(studentContact) : null) || student.phone;
  const primaryEmail = (studentContact ? getPrimaryEmail(studentContact) : null) || student.email;

  const fatherPhone = fatherContact ? (getPrimaryPhone(fatherContact) || undefined) : undefined;
  const motherPhone = motherContact ? (getPrimaryPhone(motherContact) || undefined) : undefined;
  const guardianPhone = guardianContact ? (getPrimaryPhone(guardianContact) || undefined) : undefined;

  return (
    <>
      <DetailDrawerShell
        onClose={onClose}
        title={t("students.detail.title")}
        subtitle={t("students.detail.grSubtitle", { gr: student.grNumber || t("common.notSpecified") })}
        icon={GraduationCap}
        ariaLabel={t("students.detail.ariaLabel")}
        headerActions={
          onEdit ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onEdit(student)}
              className="h-8 w-8 p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title={t("students.detail.editTitle")}
              aria-label={t("students.detail.editTitle")}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          ) : undefined
        }
        footer={
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="text-[9px] font-bold text-success uppercase">{t("students.detail.synced")}</span>
          </div>
        }
      >
        {/* Hero card */}
        <div className="relative overflow-hidden group/hero flex items-center gap-4 p-4 rounded-2xl bg-muted/35 border border-border/50 shadow-sm transition-all duration-200">
          <UserAvatar id={String(student.id)} name={student.name || ""} className="w-14 h-14 rounded-2xl text-xl font-bold flex-shrink-0 shadow-sm" />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-foreground truncate leading-tight">{student.name}</h3>
            <div className="flex flex-wrap gap-1.5 mt-2 items-center">
              <StatusBadge status={student.status || "active"} />
              <GrBadge grNumber={student.grNumber} />
            </div>
          </div>
        </div>

        {/* Quick communication */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {primaryPhone && (
            <Button
              variant="ghost"
              asChild
              className="flex flex-col items-center justify-center gap-1.5 h-auto p-3 rounded-xl border border-border bg-card/45 backdrop-blur-sm hover:bg-info/10 hover:border-info/30 transition-all text-info text-center shadow-none"
            >
              <a href={cleanTelUri(primaryPhone)}>
                <Phone className="w-4 h-4 mx-auto" />
                <span className="text-[10px] font-bold">{t("students.detail.call")}</span>
              </a>
            </Button>
          )}
          {primaryPhone && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => openComposer("whatsapp", [toMessagingRecipient({ ...student, phone: primaryPhone })])}
              className="flex flex-col items-center justify-center gap-1.5 h-auto p-3 rounded-xl border border-border bg-card/45 backdrop-blur-sm hover:bg-success/10 hover:border-success/30 transition-all text-success text-center cursor-pointer shadow-none"
            >
              <MessageCircle className="w-4 h-4 mx-auto" />
              <span className="text-[10px] font-bold">{t("students.list.actionWhatsApp")}</span>
            </Button>
          )}
          {primaryPhone && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => openComposer("sms", [toMessagingRecipient({ ...student, phone: primaryPhone })])}
              className="flex flex-col items-center justify-center gap-1.5 h-auto p-3 rounded-xl border border-border bg-card/45 backdrop-blur-sm hover:bg-warning/10 hover:border-warning/30 transition-all text-warning text-center cursor-pointer shadow-none"
            >
              <MessageSquare className="w-4 h-4 mx-auto" />
              <span className="text-[10px] font-bold">{t("students.list.actionSms")}</span>
            </Button>
          )}
          {primaryEmail && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => openComposer("email", [toMessagingRecipient({ ...student, name: student.name || "", email: primaryEmail })])}
              className="flex flex-col items-center justify-center gap-1.5 h-auto p-3 rounded-xl border border-border bg-card/45 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/30 transition-all text-primary text-center cursor-pointer shadow-none"
            >
              <Mail className="w-4 h-4 mx-auto" />
              <span className="text-[10px] font-bold">{t("students.list.actionEmail")}</span>
            </Button>
          )}
        </div>

        {/* Ordered Attributes & Connections list */}
        {sortedEnabledFields.some((field) => field.key === "fatherLink" ? (fatherContact || student.fatherName) : field.key === "motherLink" ? (motherContact || student.motherName) : field.key === "guardianLink" ? (guardianContact || student.guardianName) : true) && (
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ps-1">{t("students.detail.sectionDetails")}</h4>
            <div className="space-y-2.5">
              {sortedEnabledFields.map((field) => {
                if (field.key === "gender") {
                  return (
                    <StudentDetailAttributeRow
                      key="gender"
                      icon={User}
                      label={t("students.gender")}
                      value={student.gender ? toTitleCase(student.gender) : t("common.notSpecified")}
                    />
                  );
                }

                if (field.key === "dob") {
                  return (
                    <StudentDetailAttributeRow
                      key="dob"
                      icon={Calendar}
                      label={t("students.columns.dob")}
                      value={`${student.dob ? formatDate(student.dob, true) : "—"} ${age ? t("students.list.ageYears", { age }) : ""}`}
                    />
                  );
                }

                if (field.key === "registeredDate") {
                  return (
                    <StudentDetailAttributeRow
                      key="registeredDate"
                      icon={Clock}
                      label={t("students.form.registeredDate")}
                      value={student.registeredDate ? formatDateTime(student.registeredDate, true) : "—"}
                    />
                  );
                }

                if (field.key === "fatherLink") {
                  if (!fatherContact && !student.fatherName) return null;
                  const fatherName = student.fatherName || fatherContact?.name || "";
                  const fatherId = fatherContact?.id || student.fatherContactId || "father";
                  return (
                    <GuardianContactCard
                      key="fatherLink"
                      label={t("students.detail.father")}
                      badgeCode="FA"
                      badgeBg="bg-info/10"
                      badgeText="text-info"
                      name={fatherName}
                      phone={fatherPhone}
                      onWhatsApp={fatherPhone ? () => openComposer("whatsapp", [toMessagingRecipient({ id: fatherId, name: fatherName, phone: fatherPhone })]) : undefined}
                      onSms={fatherPhone ? () => openComposer("sms", [toMessagingRecipient({ id: fatherId, name: fatherName, phone: fatherPhone })]) : undefined}
                    />
                  );
                }

                if (field.key === "motherLink") {
                  if (!motherContact && !student.motherName) return null;
                  const motherName = student.motherName || motherContact?.name || "";
                  const motherId = motherContact?.id || student.motherContactId || "mother";
                  return (
                    <GuardianContactCard
                      key="motherLink"
                      label={t("students.detail.mother")}
                      badgeCode="MO"
                      badgeBg="bg-secondary/10"
                      badgeText="text-secondary"
                      name={motherName}
                      phone={motherPhone}
                      onWhatsApp={motherPhone ? () => openComposer("whatsapp", [toMessagingRecipient({ id: motherId, name: motherName, phone: motherPhone })]) : undefined}
                      onSms={motherPhone ? () => openComposer("sms", [toMessagingRecipient({ id: motherId, name: motherName, phone: motherPhone })]) : undefined}
                    />
                  );
                }

                if (field.key === "guardianLink") {
                  if (!guardianContact && !student.guardianName) return null;
                  const guardianName = student.guardianName || guardianContact?.name || "";
                  const guardianId = guardianContact?.id || student.guardianContactId || "guardian";
                  return (
                    <GuardianContactCard
                      key="guardianLink"
                      label={t("students.detail.guardian")}
                      badgeCode="GU"
                      badgeBg="bg-primary/10"
                      badgeText="text-primary"
                      name={guardianName}
                      phone={guardianPhone}
                      onWhatsApp={guardianPhone ? () => openComposer("whatsapp", [toMessagingRecipient({ id: guardianId, name: guardianName, phone: guardianPhone })]) : undefined}
                      onSms={guardianPhone ? () => openComposer("sms", [toMessagingRecipient({ id: guardianId, name: guardianName, phone: guardianPhone })]) : undefined}
                    />
                  );
                }

                return null;
              })}
            </div>
          </div>
        )}

        {/* Internal Notes */}
        {student.notes && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ps-1">{t("students.form.notesSection")}</h4>
            <div className="p-3.5 rounded-2xl border border-border/60 bg-card/45 backdrop-blur-xs text-xs text-foreground space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase">{t("students.form.notesSection")}</span>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">{student.notes}</p>
            </div>
          </div>
        )}

        {/* Sessions details */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ps-1">{t("students.detail.enrolledSessions", { count: enrolledSessionDetails.length })}</h4>
          {enrolledSessionDetails.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-border bg-muted/10 text-center">
              <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-xs font-bold text-muted-foreground">{t("students.detail.notEnrolled")}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{t("students.detail.notEnrolledDesc")}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {enrolledSessionDetails.map((session) => (
                <Card
                  key={session.id}
                  accentColor="primary"
                  className="p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between ms-1">
                    <span className="bg-primary/5 text-primary border border-primary/10 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase">
                      {session.type}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {t("students.detail.sessionFee", { amount: formatMoney(session.baseFee ?? 0, session.currency) })}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-foreground ms-1">{session.name}</h5>
                  {session.classes && session.classes.length > 0 ? (
                    <div className="text-[10px] text-muted-foreground space-y-1 bg-muted/40 p-2 rounded-lg ms-1">
                      <p className="font-semibold uppercase tracking-wider text-[8px] text-muted-foreground/80">{t("students.detail.classAssignments")}</p>
                      {session.classes.map((sessionClass: { id: string; name?: string; teacherName?: string; room?: string; schedule?: string }) => (
                        <div key={sessionClass.id} className="flex justify-between gap-1.5">
                          <span className="font-medium text-foreground">{t("students.detail.classByTeacher", { name: sessionClass.name ?? "", teacher: sessionClass.teacherName ?? "" })}</span>
                          <span>{t("students.detail.classRoom", { room: sessionClass.room || "—" })}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground italic ms-1">{t("students.detail.noClassesConfigured")}</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>


      </DetailDrawerShell>

      {messagingTarget && (
        <Suspense fallback={null}>
          <MessageComposer
            channel={messagingTarget.channel}
            recipients={messagingTarget.recipients}
            onClose={closeComposer}
          />
        </Suspense>
      )}
    </>
  );
}
