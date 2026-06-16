import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Edit2, MessageCircle, Phone, Mail,
  Calendar, User, Clock, BookOpen, GraduationCap, Users, Sparkles
} from "lucide-react";
import { formatDate, getObject } from "../../lib/db";
import { useLiveCollection } from "../../hooks/useLiveCollection";
import {
  type StudentsSettings,
  DEFAULT_STUDENTS_SETTINGS,
  type StudentCustomField,
  getSortedStudentFields
} from "@mms/shared";
import { SESSIONS_DATA } from '@/lib/data/sessionsData';
import { CONTACTS } from '@/lib/data/contactsData';
import { calcAge, type Student } from '@/lib/data/studentsData';
import type { Contact } from "../../lib/contactFields";
import StatusBadge from "../ui/StatusBadge";

interface StudentDetailProps {
  student: Student;
  onClose: () => void;
  onEdit: (student: Student) => void;
}

const DETAIL_TABS = [
  { id: "overview", label: "Overview", icon: User },
  { id: "academics", label: "Academic Profile", icon: BookOpen },
];

/**
 * Detailed slide-over panel displaying student records, guardian profiles, and enrolled courses.
 */
export default function StudentDetail({ student, onClose, onEdit }: StudentDetailProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const sessions = useLiveCollection("sessions", SESSIONS_DATA);
  const contacts = useLiveCollection<Contact>("contacts", CONTACTS);

  const settings = useMemo(() => getObject<StudentsSettings>("students_settings", DEFAULT_STUDENTS_SETTINGS), []);
  const fields = settings.fields || DEFAULT_STUDENTS_SETTINGS.fields || {};
  const customFields = settings.customFields || [];
  const fieldOrder = settings.fieldOrder || DEFAULT_STUDENTS_SETTINGS.fieldOrder || [];
  const orderedFields = useMemo(() => {
    return getSortedStudentFields(fieldOrder, fields, customFields);
  }, [fieldOrder, fields, customFields]);

  const studentContact = contacts.find(c => String(c.id) === String(student.contactId));
  const fatherContact = contacts.find(c => String(c.id) === String(student.fatherContactId));
  const motherContact = contacts.find(c => String(c.id) === String(student.motherContactId));

  const age = calcAge(student.dob);
  const enrolledSessionDetails = sessions.filter(s => student.enrolledSessions?.includes(s.id));

  // Determine avatar initials and color
  const initials = student.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  const AVATAR_COLORS = [
    "from-blue-500 to-indigo-600",
    "from-rose-400 to-pink-600",
    "from-purple-500 to-violet-600",
    "from-emerald-400 to-teal-600",
  ];
  const colorIdx = student.id.charCodeAt(student.id.length - 1) % AVATAR_COLORS.length;
  const avatarGradient = AVATAR_COLORS[colorIdx];

  const primaryPhone = studentContact?.phone || studentContact?.phones?.[0]?.number || student.phone;
  const primaryEmail = studentContact?.email || studentContact?.emails?.[0]?.address || student.email;

  const fatherPhone = fatherContact?.phone || fatherContact?.phones?.[0]?.number;
  const motherPhone = motherContact?.phone || motherContact?.phones?.[0]?.number;

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
        className="relative w-full max-w-sm h-full bg-card border-l border-border shadow-2xl flex flex-col z-10"
        aria-label="Student Details Drawer"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm z-10 px-5 pt-4 border-b border-border space-y-4 flex-shrink-0">
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
              <button
                onClick={() => onEdit(student)}
                className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Edit Student"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                aria-label="Close details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1">
            {DETAIL_TABS.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-2 border-b-2 transition-all ${
                    isActive
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">{t.label}</span>
                </button>
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
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50 shadow-sm">
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
                  <div className="grid grid-cols-2 gap-2">
                    {primaryPhone && (
                      <a
                        href={`tel:${primaryPhone.replace(/[^\d+]/g, "")}`}
                        className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-border bg-card hover:bg-blue-50/50 hover:border-blue-200 transition-all text-blue-600 text-center"
                      >
                        <Phone className="w-4 h-4 mx-auto" />
                        <span className="text-[10px] font-bold">Call Student</span>
                      </a>
                    )}
                    {primaryPhone && (
                      <a
                        href={`https://wa.me/${primaryPhone.replace(/[^\d]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-border bg-card hover:bg-emerald-50/50 hover:border-emerald-200 transition-all text-[#075E54] text-center"
                      >
                        <MessageCircle className="w-4 h-4 mx-auto" />
                        <span className="text-[10px] font-bold">WhatsApp</span>
                      </a>
                    )}
                  </div>

                  {/* Ordered Attributes & Connections list */}
                  {orderedFields.some(f => fields[f.id]?.enabled !== false && (f.id === "fatherLink" ? (fatherContact || student.fatherName) : f.id === "motherLink" ? (motherContact || student.motherName) : true)) && (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Student Details</h4>
                      <div className="space-y-2.5">
                        {orderedFields.map((field) => {
                          const isEnabled = fields[field.id]?.enabled !== false;
                          if (!isEnabled) return null;

                          if (field.id === "gender") {
                            return (
                              <div key="gender" className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                                <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                                  <User className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-tight mb-0.5">Gender</span>
                                  <span className="text-xs font-semibold text-foreground capitalize">{student.gender || "Not specified"}</span>
                                </div>
                              </div>
                            );
                          }

                          if (field.id === "dob") {
                            return (
                              <div key="dob" className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                                <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                                  <Calendar className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-tight mb-0.5">DOB & Age</span>
                                  <span className="text-xs font-semibold text-foreground">
                                    {student.dob ? formatDate(student.dob, true) : "—"} {age ? `(${age} yrs)` : ""}
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          if (field.id === "registeredDate") {
                            return (
                              <div key="registeredDate" className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                                <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                                  <Clock className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-tight mb-0.5">Registered Date</span>
                                  <span className="text-xs font-semibold text-foreground">
                                    {student.registeredDate ? formatDate(student.registeredDate, true) : "—"}
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          if (field.id === "fatherLink") {
                            if (!fatherContact && !student.fatherName) return null;
                            return (
                              <div key="fatherLink" className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-border bg-card shadow-sm">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                    FA
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-blue-600 mb-0.5 block">Father</span>
                                    <h5 className="text-xs font-bold text-foreground truncate">{student.fatherName || fatherContact?.name}</h5>
                                    {fatherPhone && <p className="text-[10px] text-muted-foreground mt-0.5">{fatherPhone}</p>}
                                  </div>
                                </div>
                                {fatherPhone && (
                                  <a
                                    href={`tel:${fatherPhone.replace(/[^\d+]/g, "")}`}
                                    className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            );
                          }

                          if (field.id === "motherLink") {
                            if (!motherContact && !student.motherName) return null;
                            return (
                              <div key="motherLink" className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-border bg-card shadow-sm">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                    MO
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-pink-600 mb-0.5 block">Mother</span>
                                    <h5 className="text-xs font-bold text-foreground truncate">{student.motherName || motherContact?.name}</h5>
                                    {motherPhone && <p className="text-[10px] text-muted-foreground mt-0.5">{motherPhone}</p>}
                                  </div>
                                </div>
                                {motherPhone && (
                                  <a
                                    href={`tel:${motherPhone.replace(/[^\d+]/g, "")}`}
                                    className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            );
                          }

                          if (!["gender", "dob", "registeredDate", "fatherLink", "motherLink"].includes(field.id)) {
                            const val = (student as unknown as Record<string, unknown>)[field.id];
                            if (val === undefined || val === null || val === "" || val === false) return null;

                            let displayVal = "";
                            if (typeof val === "boolean") {
                              displayVal = val ? "Yes" : "No";
                            } else {
                              displayVal = String(val);
                            }

                            return (
                              <div key={field.id} className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                                <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                                  <Sparkles className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
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
                            className="p-3.5 rounded-2xl border border-border bg-card shadow-sm space-y-2 hover:border-primary/20 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <span className="bg-primary/5 text-primary border border-primary/10 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase">
                                {session.type}
                              </span>
                              <span className="text-[10px] font-bold text-muted-foreground">
                                Fee: {session.currency} {session.baseFee}
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-foreground">{session.name}</h5>
                            {session.classes && session.classes.length > 0 ? (
                              <div className="text-[10px] text-muted-foreground space-y-1 bg-muted/40 p-2 rounded-lg">
                                <p className="font-semibold uppercase tracking-wider text-[8px] text-muted-foreground/80">Class Assignments</p>
                                {session.classes.map((cls: { id: string; name?: string; teacherName?: string; room?: string; schedule?: string }) => (
                                  <div key={cls.id} className="flex justify-between gap-1.5">
                                    <span className="font-medium text-foreground">{cls.name} (by {cls.teacherName})</span>
                                    <span>Room: {cls.room || "—"}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-muted-foreground italic">No classes configured for this session</p>
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
                      <div className="p-3.5 rounded-2xl border border-border bg-card shadow-sm text-center">
                        <span className="block text-[8px] font-black uppercase tracking-wider text-muted-foreground mb-1">Attendance Rate</span>
                        <p className="text-lg font-black text-emerald-600">94.8%</p>
                        <span className="text-[9px] text-muted-foreground">Last 30 days</span>
                      </div>
                      <div className="p-3.5 rounded-2xl border border-border bg-card shadow-sm text-center">
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
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-bold text-emerald-600 uppercase">Synced</span>
          </div>
        </div>
      </motion.aside>
    </div>
  );
}
