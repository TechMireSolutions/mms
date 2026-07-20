import React, { useMemo, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Edit2, MessageCircle, Phone, MessageSquare,
  Calendar, User, Clock, BookOpen, GraduationCap, Sparkles
} from "lucide-react";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import {
  DEFAULT_STUDENT_ENABLED_TABS,
  type FieldDefinition,
  formatDate,
  formatDateTime,
  getInitials,
} from "@mms/shared";
import { useSessionsCollection } from '@/tenant/features/sessions/hooks/useSessions';
import { useContactsByIds } from '@/tenant/features/contacts/hooks/useContacts';
import { calcAge, type Student } from '@/lib/data/studentsData';
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AVATAR_GRADIENT_ROTATION } from "@/lib/semanticTone";
import { useStudentConfig } from "@/hooks/useStandardModuleConfig";
import { useMessageComposerState } from "@/hooks/useMessageComposerState";

interface StudentDetailProps {
  student: Student;
  onClose: () => void;
  onEdit: (student: Student) => void;
}

const MessageComposer = lazy(() => import("@/components/ui/MessageComposer"));

/**
 * Detailed slide-over panel displaying student records, guardian profiles, and enrolled courses.
 */
export default function StudentDetail({ student, onClose, onEdit }: StudentDetailProps): React.JSX.Element {
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

  // Determine avatar initials and color
  const initials = getInitials(student.name);
  const colorIdx = student.id.charCodeAt(student.id.length - 1) % AVATAR_GRADIENT_ROTATION.length;
  const avatarGradient = AVATAR_GRADIENT_ROTATION[colorIdx];

  const primaryPhone = studentContact?.phones?.[0]?.number || student.phone;

  const fatherPhone = fatherContact?.phones?.[0]?.number;
  const motherPhone = motherContact?.phones?.[0]?.number;
  const guardianPhone = guardianContact?.phones?.[0]?.number;

  return (
    <>
      <DetailDrawerShell
        onClose={onClose}
        title="Student Profile"
        subtitle={`GR: ${student.grNumber || "N/A"}`}
        icon={GraduationCap}
        ariaLabel="Student Details Drawer"
        headerActions={
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onEdit(student)}
            className="h-8 w-8 p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Edit Student"
            aria-label="Edit Student"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        }
        footer={
          <>
            <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
              <Clock className="w-3 h-3" />
              <span>Last Active 2026-05-30</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              <span className="text-[9px] font-bold text-success uppercase">Synced</span>
            </div>
          </>
        }
      >
        {/* Hero card */}
        <div className="relative overflow-hidden group/hero flex items-center gap-4 p-4 rounded-2xl bg-muted/35 border border-border/50 shadow-sm transition-all duration-200">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-sm`}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-foreground truncate leading-tight">{student.name}</h3>
            <div className="flex flex-wrap gap-1.5 mt-2 items-center">
              <StatusBadge status={student.status} />
              {student.grNumber && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-primary uppercase tracking-wider">
                  GR: {student.grNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick communication */}
        <div className="grid grid-cols-3 gap-2">
          {primaryPhone && (
            <Button
              variant="ghost"
              asChild
              className="flex flex-col items-center justify-center gap-1.5 h-auto p-3 rounded-xl border border-border bg-card/45 backdrop-blur-sm hover:bg-info/10 hover:border-info/30 transition-all text-info text-center shadow-none"
            >
              <a href={`tel:${primaryPhone.replace(/[^\d+]/g, "")}`}>
                <Phone className="w-4 h-4 mx-auto" />
                <span className="text-[10px] font-bold">Call</span>
              </a>
            </Button>
          )}
          {primaryPhone && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => openComposer("whatsapp", [{
                id: student.id,
                name: student.name,
                phone: primaryPhone,
              }])}
              className="flex flex-col items-center justify-center gap-1.5 h-auto p-3 rounded-xl border border-border bg-card/45 backdrop-blur-sm hover:bg-success/10 hover:border-success/30 transition-all text-success text-center cursor-pointer shadow-none"
            >
              <MessageCircle className="w-4 h-4 mx-auto" />
              <span className="text-[10px] font-bold">WhatsApp</span>
            </Button>
          )}
          {primaryPhone && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => openComposer("sms", [{
                id: student.id,
                name: student.name,
                phone: primaryPhone,
              }])}
              className="flex flex-col items-center justify-center gap-1.5 h-auto p-3 rounded-xl border border-border bg-card/45 backdrop-blur-sm hover:bg-amber-500/10 hover:border-amber-500/30 transition-all text-amber-600 dark:text-amber-500 text-center cursor-pointer shadow-none"
            >
              <MessageSquare className="w-4 h-4 mx-auto" />
              <span className="text-[10px] font-bold">SMS</span>
            </Button>
          )}
        </div>

        {/* Ordered Attributes & Connections list */}
        {sortedEnabledFields.some((field) => field.key === "fatherLink" ? (fatherContact || student.fatherName) : field.key === "motherLink" ? (motherContact || student.motherName) : field.key === "guardianLink" ? (guardianContact || student.guardianName) : true) && (
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ps-1">Student Details</h4>
            <div className="space-y-2.5">
              {sortedEnabledFields.map((field) => {
                if (field.key === "gender") {
                  return (
                    <div key="gender" className="relative overflow-hidden group/row flex items-center gap-3 p-3 bg-card/45 backdrop-blur-xs rounded-2xl border border-border/80 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="absolute start-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/row:bg-primary" />
                      <div className="p-2 rounded-lg bg-muted text-muted-foreground ms-1">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0 text-start">
                        <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-tight mb-0.5">Gender</span>
                        <span className="text-xs font-semibold text-foreground capitalize">{student.gender || "Not specified"}</span>
                      </div>
                    </div>
                  );
                }

                if (field.key === "dob") {
                  return (
                    <div key="dob" className="relative overflow-hidden group/row flex items-center gap-3 p-3 bg-card/45 backdrop-blur-xs rounded-2xl border border-border/80 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="absolute start-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/row:bg-primary" />
                      <div className="p-2 rounded-lg bg-muted text-muted-foreground ms-1">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0 text-start">
                        <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-tight mb-0.5">DOB & Age</span>
                        <span className="text-xs font-semibold text-foreground">
                          {student.dob ? formatDate(student.dob, true) : "—"} {age ? `(${age} yrs)` : ""}
                        </span>
                      </div>
                    </div>
                  );
                }

                if (field.key === "registeredDate") {
                  return (
                    <div key="registeredDate" className="relative overflow-hidden group/row flex items-center gap-3 p-3 bg-card/45 backdrop-blur-xs rounded-2xl border border-border/80 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="absolute start-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/row:bg-primary" />
                      <div className="p-2 rounded-lg bg-muted text-muted-foreground ms-1">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0 text-start">
                        <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-tight mb-0.5">Registered Date</span>
                        <span className="text-xs font-semibold text-foreground">
                          {student.registeredDate ? formatDateTime(student.registeredDate, true) : "—"}
                        </span>
                      </div>
                    </div>
                  );
                }

                if (field.key === "fatherLink") {
                  if (!fatherContact && !student.fatherName) return null;
                  return (
                    <Card key="fatherLink" accentColor="indigo" className="p-3">
                      <div className="flex items-center gap-3 min-w-0 text-start ms-1">
                        <div className="w-8 h-8 rounded-lg bg-info/10 text-info flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          FA
                        </div>
                        <div className="min-w-0">
                          <span className="text-[8px] font-black uppercase tracking-widest text-info mb-0.5 block">Father</span>
                          <h5 className="text-xs font-bold text-foreground truncate">{student.fatherName || fatherContact?.name}</h5>
                          {fatherPhone && <p className="text-[10px] text-muted-foreground mt-0.5">{fatherPhone}</p>}
                        </div>
                      </div>
                      {fatherPhone && (
                        <a
                          href={`tel:${fatherPhone.replace(/[^\d+]/g, "")}`}
                          className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors me-1"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </Card>
                  );
                }

                if (field.key === "motherLink") {
                  if (!motherContact && !student.motherName) return null;
                  return (
                    <Card key="motherLink" accentColor="indigo" className="p-3">
                      <div className="flex items-center gap-3 min-w-0 text-start ms-1">
                        <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          MO
                        </div>
                        <div className="min-w-0">
                          <span className="text-[8px] font-black uppercase tracking-widest text-secondary mb-0.5 block">Mother</span>
                          <h5 className="text-xs font-bold text-foreground truncate">{student.motherName || motherContact?.name}</h5>
                          {motherPhone && <p className="text-[10px] text-muted-foreground mt-0.5">{motherPhone}</p>}
                        </div>
                      </div>
                      {motherPhone && (
                        <a
                          href={`tel:${motherPhone.replace(/[^\d+]/g, "")}`}
                          className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors me-1"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </Card>
                  );
                }

                if (field.key === "guardianLink") {
                  if (!guardianContact && !student.guardianName) return null;
                  return (
                    <Card key="guardianLink" accentColor="indigo" className="p-3">
                      <div className="flex items-center gap-3 min-w-0 text-start ms-1">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          GU
                        </div>
                        <div className="min-w-0">
                          <span className="text-[8px] font-black uppercase tracking-widest text-primary mb-0.5 block">Guardian</span>
                          <h5 className="text-xs font-bold text-foreground truncate">{student.guardianName || guardianContact?.name}</h5>
                          {guardianPhone && <p className="text-[10px] text-muted-foreground mt-0.5">{guardianPhone}</p>}
                        </div>
                      </div>
                      {guardianPhone && (
                        <a
                          href={`tel:${guardianPhone.replace(/[^\d+]/g, "")}`}
                          className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors me-1"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </Card>
                  );
                }

                if (!["gender", "dob", "registeredDate", "fatherLink", "motherLink", "guardianLink"].includes(field.key)) {
                  const fieldValue = (student as unknown as Record<string, unknown>)[field.key];
                  if (fieldValue === undefined || fieldValue === null || fieldValue === "" || fieldValue === false) return null;

                  let displayVal = "";
                  if (typeof fieldValue === "boolean") {
                    displayVal = fieldValue ? "Yes" : "No";
                  } else {
                    displayVal = String(fieldValue);
                  }

                  return (
                    <div key={field.key} className="relative overflow-hidden group/row flex items-center gap-3 p-3 bg-card/45 backdrop-blur-xs rounded-2xl border border-border/80 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="absolute start-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/row:bg-primary" />
                      <div className="p-2 rounded-lg bg-muted text-muted-foreground ms-1">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0 text-start">
                        <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-tight mb-0.5">{field.label}</span>
                        <span className="text-xs font-semibold text-foreground">{displayVal}</span>
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>
        )}

        {/* Sessions details */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ps-1">Enrolled Sessions ({enrolledSessionDetails.length})</h4>
          {enrolledSessionDetails.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-border bg-muted/10 text-center">
              <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-xs font-bold text-muted-foreground">Not Enrolled</p>
              <p className="text-[10px] text-muted-foreground mt-1">This student is not registered in any active session.</p>
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
                      Fee: {session.currency} {session.baseFee}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-foreground ms-1">{session.name}</h5>
                  {session.classes && session.classes.length > 0 ? (
                    <div className="text-[10px] text-muted-foreground space-y-1 bg-muted/40 p-2 rounded-lg ms-1">
                      <p className="font-semibold uppercase tracking-wider text-[8px] text-muted-foreground/80">Class Assignments</p>
                      {session.classes.map((sessionClass: { id: string; name?: string; teacherName?: string; room?: string; schedule?: string }) => (
                        <div key={sessionClass.id} className="flex justify-between gap-1.5">
                          <span className="font-medium text-foreground">{sessionClass.name} (by {sessionClass.teacherName})</span>
                          <span>Room: {sessionClass.room || "—"}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground italic ms-1">No classes configured for this session</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Attendance Performance Grid */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ps-1">Engagement & Analytics</h4>
          <div className="grid grid-cols-2 gap-3">
            <Card accentColor="primary" className="p-3.5 text-center">
              <span className="block text-[8px] font-black uppercase tracking-wider text-muted-foreground mb-1">Attendance Rate</span>
              <p className="text-lg font-black text-success">94.8%</p>
              <span className="text-[9px] text-muted-foreground">Last 30 days</span>
            </Card>
            <Card accentColor="primary" className="p-3.5 text-center">
              <span className="block text-[8px] font-black uppercase tracking-wider text-muted-foreground mb-1">Conduct Rating</span>
              <p className="text-lg font-black text-primary">Excellent</p>
              <span className="text-[9px] text-muted-foreground">Term Review</span>
            </Card>
          </div>
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
