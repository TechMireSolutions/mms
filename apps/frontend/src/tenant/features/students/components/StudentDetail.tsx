import React, { useState, useMemo, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  X, Edit2, MessageCircle, Phone, MessageSquare,
  Calendar, User, Clock, BookOpen, GraduationCap, Sparkles
} from "lucide-react";
import { formatDate } from "@/lib/db";
import {
  DEFAULT_STUDENT_ENABLED_TABS,
  type FieldDefinition,
} from "@mms/shared";
import { useSessionsCollection } from '@/tenant/features/sessions/hooks/useSessions';
import { useContactsByIds } from '@/tenant/features/contacts/hooks/useContacts';
import { calcAge, type Student } from '@/lib/data/studentsData';
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AVATAR_GRADIENT_ROTATION } from "@/lib/semanticTone";
import { useStudentConfig } from "@/tenant/features/students/hooks/useStudentConfig";

interface StudentDetailProps {
  student: Student;
  onClose: () => void;
  onEdit: (student: Student) => void;
}

const MessageComposer = lazy(() => import("@/components/ui/MessageComposer"));

const DETAIL_TABS = [
  { id: "overview", label: "Overview", icon: User },
  { id: "academics", label: "Academic Profile", icon: BookOpen },
];

/**
 * Detailed slide-over panel displaying student records, guardian profiles, and enrolled courses.
 */
export default function StudentDetail({ student, onClose, onEdit }: StudentDetailProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [messagingTarget, setMessagingTarget] = useState<{
    channel: "whatsapp" | "sms" | "email";
    phone: string;
  } | null>(null);
  const sessions = useSessionsCollection();
  const linkedIds = useMemo(
    () => [student.contactId, student.fatherContactId, student.motherContactId, student.guardianContactId],
    [student.contactId, student.fatherContactId, student.motherContactId, student.guardianContactId],
  );
  const contacts = useContactsByIds(linkedIds);
  const contactList = contacts.data ?? [];

  const { settings } = useStudentConfig();
  const fields = settings.fields || {};

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
  const initials = student.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  const colorIdx = student.id.charCodeAt(student.id.length - 1) % AVATAR_GRADIENT_ROTATION.length;
  const avatarGradient = AVATAR_GRADIENT_ROTATION[colorIdx];

  const primaryPhone = studentContact?.phone || studentContact?.phones?.[0]?.number || student.phone;

  const fatherPhone = fatherContact?.phone || fatherContact?.phones?.[0]?.number;
  const motherPhone = motherContact?.phone || motherContact?.phones?.[0]?.number;
  const guardianPhone = guardianContact?.phone || guardianContact?.phones?.[0]?.number;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Drawer */}
      <motion.aside
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="relative w-full max-w-sm h-full bg-card/90 border-l border-border/80 shadow-2xl flex flex-col z-10 backdrop-blur-xl"
        aria-label="Student Details Drawer"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 bg-card/75 backdrop-blur-md z-10 px-5 pt-4 border-b border-border/40 space-y-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-[13px] font-bold text-foreground leading-tight">Student Profile</h2>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">GR: {student.grNumber || "N/A"}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onEdit(student)}
                className="h-8 w-8 p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Edit Student"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                aria-label="Close details"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1">
            {DETAIL_TABS.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <Button
                  key={t.id}
                  type="button"
                  variant="ghost"
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-2 border-b-2 transition-all rounded-none h-auto ${
                    isActive
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">{t.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {activeTab === "overview" && (
                <>
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
                      <a
                        href={`tel:${primaryPhone.replace(/[^\d+]/g, "")}`}
                        className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-border bg-card/45 backdrop-blur-sm hover:bg-info/10 hover:border-info/30 transition-all text-info text-center"
                      >
                        <Phone className="w-4 h-4 mx-auto" />
                        <span className="text-[10px] font-bold">Call</span>
                      </a>
                    )}
                    {primaryPhone && (
                      <button
                        type="button"
                        onClick={() => setMessagingTarget({ channel: "whatsapp", phone: primaryPhone })}
                        className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-border bg-card/45 backdrop-blur-sm hover:bg-success/10 hover:border-success/30 transition-all text-success text-center cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4 mx-auto" />
                        <span className="text-[10px] font-bold">WhatsApp</span>
                      </button>
                    )}
                    {primaryPhone && (
                      <button
                        type="button"
                        onClick={() => setMessagingTarget({ channel: "sms", phone: primaryPhone })}
                        className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-border bg-card/45 backdrop-blur-sm hover:bg-amber/10 hover:border-amber/30 transition-all text-amber-600 dark:text-amber-500 text-center cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 mx-auto" />
                        <span className="text-[10px] font-bold">SMS</span>
                      </button>
                    )}
                  </div>

                  {/* Ordered Attributes & Connections list */}
                  {sortedEnabledFields.some((field) => field.key === "fatherLink" ? (fatherContact || student.fatherName) : field.key === "motherLink" ? (motherContact || student.motherName) : field.key === "guardianLink" ? (guardianContact || student.guardianName) : true) && (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Student Details</h4>
                      <div className="space-y-2.5">
                        {sortedEnabledFields.map((field) => {
                          if (field.key === "gender") {
                            return (
                              <div key="gender" className="relative overflow-hidden group/row flex items-center gap-3 p-3 bg-card/45 backdrop-blur-xs rounded-2xl border border-border/80 shadow-sm hover:shadow-md transition-all duration-200">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/row:bg-primary" />
                                <div className="p-2 rounded-lg bg-muted text-muted-foreground ml-1">
                                  <User className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                  <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-tight mb-0.5">Gender</span>
                                  <span className="text-xs font-semibold text-foreground capitalize">{student.gender || "Not specified"}</span>
                                </div>
                              </div>
                            );
                          }

                          if (field.key === "dob") {
                            return (
                              <div key="dob" className="relative overflow-hidden group/row flex items-center gap-3 p-3 bg-card/45 backdrop-blur-xs rounded-2xl border border-border/80 shadow-sm hover:shadow-md transition-all duration-200">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/row:bg-primary" />
                                <div className="p-2 rounded-lg bg-muted text-muted-foreground ml-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
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
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/row:bg-primary" />
                                <div className="p-2 rounded-lg bg-muted text-muted-foreground ml-1">
                                  <Clock className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                  <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-tight mb-0.5">Registered Date</span>
                                  <span className="text-xs font-semibold text-foreground">
                                    {student.registeredDate ? formatDate(student.registeredDate, true) : "—"}
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          if (field.key === "fatherLink") {
                            if (!fatherContact && !student.fatherName) return null;
                            return (
                              <div key="fatherLink" className="relative overflow-hidden group/row flex items-center justify-between gap-3 p-3 rounded-2xl border border-border/80 bg-card/45 backdrop-blur-xs shadow-sm hover:shadow-md transition-all duration-200">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/45 transition-colors group-hover/row:bg-indigo-500" />
                                <div className="flex items-center gap-3 min-w-0 text-left ml-1">
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
                                    className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors mr-1"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            );
                          }

                          if (field.key === "motherLink") {
                            if (!motherContact && !student.motherName) return null;
                            return (
                              <div key="motherLink" className="relative overflow-hidden group/row flex items-center justify-between gap-3 p-3 rounded-2xl border border-border/80 bg-card/45 backdrop-blur-xs shadow-sm hover:shadow-md transition-all duration-200">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/45 transition-colors group-hover/row:bg-indigo-500" />
                                <div className="flex items-center gap-3 min-w-0 text-left ml-1">
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
                                    className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors mr-1"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            );
                          }

                          if (field.key === "guardianLink") {
                            if (!guardianContact && !student.guardianName) return null;
                            return (
                              <div key="guardianLink" className="relative overflow-hidden group/row flex items-center justify-between gap-3 p-3 rounded-2xl border border-border/80 bg-card/45 backdrop-blur-xs shadow-sm hover:shadow-md transition-all duration-200">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/45 transition-colors group-hover/row:bg-indigo-500" />
                                <div className="flex items-center gap-3 min-w-0 text-left ml-1">
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
                                    className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors mr-1"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
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
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/row:bg-primary" />
                                <div className="p-2 rounded-lg bg-muted text-muted-foreground ml-1">
                                  <Sparkles className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
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
                </>
              )}

              {activeTab === "academics" && (
                <>
                  {/* Sessions details */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Enrolled Sessions ({enrolledSessionDetails.length})</h4>
                    {enrolledSessionDetails.length === 0 ? (
                      <div className="p-6 rounded-2xl border border-dashed border-border bg-muted/10 text-center">
                        <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                        <p className="text-xs font-bold text-muted-foreground">Not Enrolled</p>
                        <p className="text-[10px] text-muted-foreground mt-1">This student is not registered in any active session.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {enrolledSessionDetails.map((session) => (
                           <div
                             key={session.id}
                             className="relative overflow-hidden group/session p-3.5 rounded-2xl border border-border/80 bg-card/45 backdrop-blur-xs shadow-sm space-y-2 hover:border-primary/20 hover:shadow-md transition-all duration-300"
                           >
                             <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/session:bg-primary" />
                             <div className="flex items-center justify-between ml-1">
                               <span className="bg-primary/5 text-primary border border-primary/10 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase">
                                 {session.type}
                               </span>
                               <span className="text-[10px] font-bold text-muted-foreground">
                                 Fee: {session.currency} {session.baseFee}
                               </span>
                             </div>
                             <h5 className="text-xs font-bold text-foreground ml-1">{session.name}</h5>
                             {session.classes && session.classes.length > 0 ? (
                               <div className="text-[10px] text-muted-foreground space-y-1 bg-muted/40 p-2 rounded-lg ml-1">
                                 <p className="font-semibold uppercase tracking-wider text-[8px] text-muted-foreground/80">Class Assignments</p>
                                 {session.classes.map((sessionClass: { id: string; name?: string; teacherName?: string; room?: string; schedule?: string }) => (
                                   <div key={sessionClass.id} className="flex justify-between gap-1.5">
                                     <span className="font-medium text-foreground">{sessionClass.name} (by {sessionClass.teacherName})</span>
                                     <span>Room: {sessionClass.room || "—"}</span>
                                   </div>
                                 ))}
                               </div>
                             ) : (
                               <p className="text-[10px] text-muted-foreground italic ml-1">No classes configured for this session</p>
                             )}
                           </div>
                         ))}
                      </div>
                    )}
                  </div>

                  {/* Attendance Performance Grid */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Engagement & Analytics</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative overflow-hidden group/metric p-3.5 rounded-2xl border border-border/80 bg-card/45 backdrop-blur-xs shadow-sm text-center hover:shadow-md transition-all duration-300">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/metric:bg-primary" />
                        <span className="block text-[8px] font-black uppercase tracking-wider text-muted-foreground mb-1">Attendance Rate</span>
                        <p className="text-lg font-black text-success">94.8%</p>
                        <span className="text-[9px] text-muted-foreground">Last 30 days</span>
                      </div>
                      <div className="relative overflow-hidden group/metric p-3.5 rounded-2xl border border-border/80 bg-card/45 backdrop-blur-xs shadow-sm text-center hover:shadow-md transition-all duration-300">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/metric:bg-primary" />
                        <span className="block text-[8px] font-black uppercase tracking-wider text-muted-foreground mb-1">Conduct Rating</span>
                        <p className="text-lg font-black text-primary">Excellent</p>
                        <span className="text-[9px] text-muted-foreground">Term Review</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border bg-muted/10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
            <Clock className="w-3 h-3" />
            <span>Last Active 2026-05-30</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="text-[9px] font-bold text-success uppercase">Synced</span>
          </div>
        </div>
      </motion.aside>

      {messagingTarget && (
        <Suspense fallback={null}>
          <MessageComposer
            channel={messagingTarget.channel}
            recipients={[{
              id: student.id,
              name: student.name,
              phone: messagingTarget.phone,
            }]}
            onClose={() => setMessagingTarget(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
