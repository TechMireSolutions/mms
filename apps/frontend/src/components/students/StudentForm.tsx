import React, { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Plus, User, Mail, Phone, Sparkles, Lock, Camera, Upload } from "lucide-react";
import { CONTACTS } from '@/lib/data/contactsData';
import { toTitleCase, cn } from "../../lib/utils";
import { uploadUserImage } from "@/lib/imageUpload";
import { saveCollection, getObject } from "../../lib/db";
import { useLiveCollection } from "../../hooks/useLiveCollection";
import type { Contact } from "../../lib/contactFields";
import type { Student } from '@/lib/data/studentsData';
import {
  type StudentsSettings,
  DEFAULT_STUDENTS_SETTINGS,
  getSortedStudentFields
} from "@mms/shared";
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import { DatePicker } from "../ui/DatePicker";
import FormModal from "../ui/FormModal";
import useTranslation from "@/hooks/useTranslation";
import { genderAvatarGradient, genderBadgeClass, genderSelectClass } from "@/lib/semanticTone";

const INPUT = "w-full px-3.5 py-2.5 rounded-lg border border-border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";
const LABEL = "text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5 block";

const generateGrNumber = (studentsList: Student[], regDate: string): string => {
  const settings = getObject<StudentsSettings>("students_settings", DEFAULT_STUDENTS_SETTINGS);
  const template = settings.grNumberTemplate || "{seq}-{year}";
  const digits = settings.grNumberDigits || 4;
  const restartAnnually = settings.grNumberRestartAnnually !== false;

  const year = regDate ? new Date(regDate).getFullYear() : new Date().getFullYear();

  let nextSeq = 1;
  if (restartAnnually) {
    const yearlyStudents = studentsList.filter((s) => {
      const sDate = s.registeredDate || "";
      if (sDate.startsWith(String(year))) return true;
      if (s.grNumber && s.grNumber.includes(String(year))) return true;
      return false;
    });
    nextSeq = yearlyStudents.length + 1;
  } else {
    nextSeq = studentsList.length + 1;
  }

  const seqStr = String(nextSeq).padStart(digits, "0");
  return template.replace("{seq}", seqStr).replace("{year}", String(year));
};

interface ContactPickerProps {
  label: string;
  value: string | number | null;
  onChange: (id: string | number | null) => void;
  contacts?: Contact[];
  excludeIds?: (string | number | null)[];
  onCreateContact?: (query: string) => void;
  onAvatarChange?: (avatarUrl: string) => void;
}

function ContactPicker({
  label,
  value,
  onChange,
  contacts = [],
  excludeIds = [],
  onCreateContact,
  onAvatarChange,
}: ContactPickerProps): JSX.Element {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const normalizedExcludeIds = useMemo(() => excludeIds.map(String), [excludeIds]);

  const matches = contacts.filter((c) => {
    const cPhone = (c.phone as string | undefined) || c.phones?.[0]?.number || "";
    return (
      !normalizedExcludeIds.includes(String(c.id)) &&
      (c.name.toLowerCase().includes(query.toLowerCase()) || cPhone.includes(query))
    );
  }).slice(0, 6);

  const selected = contacts.find((c) => String(c.id) === String(value));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadUserImage(file, "avatar");
      onAvatarChange?.(url);
    } catch {
      // ignore
    }
    e.target.value = "";
  };

  if (selected) {
    const genderBadgeColor = genderBadgeClass(selected.gender ?? "");
    
    const initials = selected.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
    const avatarGradient = genderAvatarGradient(selected.gender ?? "");
    
    const selectedPhone = (selected.phone as string | undefined) || selected.phones?.[0]?.number;
    const selectedEmail = (selected.email as string | undefined) || selected.emails?.[0]?.address;

    return (
      <div className="relative">
        <span className={LABEL}>{label}</span>
        <div className="group relative flex items-center gap-3.5 p-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/[0.01] to-primary/[0.04] dark:from-primary/[0.02] dark:to-primary/[0.06] shadow-sm hover:shadow-md transition-all duration-200">
          <div 
            onClick={() => onAvatarChange && fileInputRef.current?.click()}
            className={cn(
              "w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-muted border border-border flex items-center justify-center shadow-sm relative",
              onAvatarChange && "cursor-pointer group/avatar"
            )}
          >
            {selected.avatar ? (
              <img src={selected.avatar} alt={selected.name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-bold text-sm`}>
                {initials}
              </div>
            )}
            {onAvatarChange && (
              <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity duration-150">
                <Camera className="w-4 h-4 text-white" />
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange} 
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <p className="text-[13px] font-bold text-foreground truncate">{selected.name}</p>
              {selected.gender && (
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full capitalize ${genderBadgeColor}`}>
                  {selected.gender}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              {selectedPhone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-muted-foreground/60" />
                  {selectedPhone}
                </span>
              )}
              {selectedEmail && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-muted-foreground/60" />
                  {selectedEmail}
                </span>
              )}
            </div>
          </div>
          <button 
            type="button"
            onClick={() => onChange(null)} 
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors focus:outline-none focus:ring-2 focus:ring-destructive/20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <span className={LABEL}>{label}</span>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/75 pointer-events-none" />
        <input
          className={INPUT + " pl-9.5 pr-8.5"}
          placeholder={`Search ${label.toLowerCase()}…`}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-md hover:bg-muted"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <AnimatePresence>
          {open && (matches.length > 0 || onCreateContact) && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.99 }}
              transition={{ duration: 0.15 }}
              className="absolute z-20 left-0 right-0 top-full mt-1.5 bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-border/60"
            >
              {matches.length === 0 && (
                <div className="px-4.5 py-4 text-xs text-muted-foreground flex flex-col items-center justify-center gap-1.5 text-center bg-muted/5">
                  <User className="w-5 h-5 text-muted-foreground/45" />
                  <p className="font-semibold text-foreground/80">No contacts found</p>
                  <p className="text-[10px] text-muted-foreground">Try adjusting your search terms or create a new contact below.</p>
                </div>
              )}
              {matches.map((c) => {
                const cInitials = c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                const cGradient = genderAvatarGradient(c.gender ?? "");
                
                const cPhone = (c.phone as string | undefined) || c.phones?.[0]?.number;
                const cCity = c.city as string | undefined;
                const cTag = c.tag as string | undefined;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={() => { onChange(c.id); setQuery(""); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-muted transition-colors text-left focus:outline-none"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cGradient} flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white shadow-sm`}>
                      {cInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate mt-0.5">
                        {cPhone || "No phone"}
                        {cCity && <span>· {cCity}</span>}
                        {cTag && <span className="bg-primary/5 text-primary text-[9px] px-1.5 py-0.2 rounded border border-primary/10 capitalize font-medium">{cTag}</span>}
                      </p>
                    </div>
                  </button>
                );
              })}
              {onCreateContact && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onCreateContact(query);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 hover:bg-primary/5 hover:text-primary text-primary font-semibold text-xs text-left transition-colors border-t border-border"
                >
                  <Plus className="w-4 h-4 text-primary" />
                  {query ? `Create contact "${query}"` : "Create New Contact"}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface StudentFormData {
  contactId: string | number | null;
  name: string;
  gender: string;
  dob: string;
  fatherContactId: string | number | null;
  motherContactId: string | number | null;
  fatherName: string;
  motherName: string;
  status: "active" | "inactive" | "suspended";
  phone: string;
  email: string;
  grNumber: string;
  registeredDate: string;
  [key: string]: unknown;
}

const EMPTY: StudentFormData = {
  contactId: null,
  name: "",
  gender: "",
  dob: "",
  fatherContactId: null,
  motherContactId: null,
  fatherName: "",
  motherName: "",
  status: "active",
  phone: "",
  email: "",
  grNumber: "",
  registeredDate: new Date().toISOString().split("T")[0],
};

export interface StudentFormProps {
  student?: Partial<Student> | null;
  students: Student[];
  onClose: () => void;
  onSave: (data: Student) => void;
}

export default function StudentForm({ student, students, onClose, onSave }: StudentFormProps): JSX.Element {
  const { t } = useTranslation();
  const contacts = useLiveCollection<Contact>("contacts", CONTACTS);
  const [data, setData] = useState<StudentFormData>(() => ({ ...EMPTY, ...student }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Read contact config — prefs drive defaults; isTabFieldEnabled gates field visibility
  const { prefs, isTabFieldEnabled, genders, uiStrings } = useContactConfig();

  const settings = useMemo(() => getObject<StudentsSettings>("students_settings", DEFAULT_STUDENTS_SETTINGS), []);
  const fields = settings.fields || DEFAULT_STUDENTS_SETTINGS.fields || {};
  const customFields = settings.customFields || [];
  const fieldOrder = settings.fieldOrder || DEFAULT_STUDENTS_SETTINGS.fieldOrder || [];
  const orderedFields = useMemo(() => {
    return getSortedStudentFields(fieldOrder, fields, customFields);
  }, [fieldOrder, fields, customFields]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<"student" | "father" | "mother" | null>(null);
  const [createName, setCreateName] = useState("");
  const newContactFileRef = useRef<HTMLInputElement>(null);
  const [newContact, setNewContact] = useState<{
    name: string;
    gender: string;
    dob: string;
    phone: string;
    email: string;
    city: string;
    avatar?: string | null;
  }>({
    name: "",
    gender: "",
    dob: "",
    phone: "",
    email: "",
    city: prefs.defaultCity || "",
    avatar: null,
  });

  const handleContactSelect = (id: string | number | null): void => {
    const c = contacts.find((x) => String(x.id) === String(id));
    if (c) {
      const cPhone = (c.phone as string | undefined) || c.phones?.[0]?.number || "";
      const cEmail = (c.email as string | undefined) || c.emails?.[0]?.address || "";

      setData((d) => {
        let autoGr = d.grNumber;
        if (!student && !autoGr) {
          autoGr = generateGrNumber(students, d.registeredDate || new Date().toISOString().split("T")[0]);
        }
        return {
          ...d,
          contactId: id,
          name: c.name,
          gender: c.gender || d.gender,
          dob: c.dob || d.dob,
          phone: cPhone,
          email: cEmail,
          grNumber: autoGr,
        };
      });
    } else {
      setData((d) => ({
        ...d,
        contactId: null,
        name: "",
        gender: "",
        dob: "",
        phone: "",
        email: "",
        grNumber: "",
      }));
    }
  };

  const handleStudentAvatarChange = (avatarUrl: string) => {
    if (!data.contactId) return;
    const updatedContacts = contacts.map((c) =>
      String(c.id) === String(data.contactId) ? { ...c, avatar: avatarUrl } : c
    );
    saveCollection("contacts", updatedContacts);
  };

  const handleNewContactAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadUserImage(file, "avatar");
      setNewContact((c) => ({ ...c, avatar: url }));
    } catch {
      // ignore
    }
    e.target.value = "";
  };

  const handleRegisteredDateChange = (newDate: string) => {
    setData((d) => {
      const nextGr = !student ? generateGrNumber(students, newDate) : d.grNumber;
      return {
        ...d,
        registeredDate: newDate,
        grNumber: nextGr,
      };
    });
  };

  const handleFatherSelect = (id: string | number | null): void => {
    const c = contacts.find((x) => String(x.id) === String(id));
    setData((d) => ({ ...d, fatherContactId: id, fatherName: c ? c.name : "" }));
  };

  const handleMotherSelect = (id: string | number | null): void => {
    const c = contacts.find((x) => String(x.id) === String(id));
    setData((d) => ({ ...d, motherContactId: id, motherName: c ? c.name : "" }));
  };

  const fatherContacts = useMemo(() => {
    return contacts.filter((c) => c.gender?.toLowerCase() === "male");
  }, [contacts]);

  const motherContacts = useMemo(() => {
    return contacts.filter((c) => c.gender?.toLowerCase() === "female");
  }, [contacts]);

  const alreadyRegisteredContactIds = useMemo(() => {
    if (!students) return [];
    return students
      .filter((s) => !student || s.id !== student.id)
      .map((s) => s.contactId)
      .filter(Boolean);
  }, [students, student]);

  const studentExcludeIds = useMemo(() => {
    const parentIds = [data.fatherContactId, data.motherContactId].filter(Boolean);
    return [...parentIds, ...alreadyRegisteredContactIds];
  }, [data.fatherContactId, data.motherContactId, alreadyRegisteredContactIds]);

  const handleStartCreate = (type: "student" | "father" | "mother", initialName: string): void => {
    setCreateType(type);
    setCreateName(initialName);
    setNewContact({
      name: initialName || "",
      gender: type === "father" ? "male" : type === "mother" ? "female" : "",
      dob: "",
      phone: "",
      email: "",
      city: prefs.defaultCity || "",
      avatar: null,
    });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!newContact.name.trim()) return;

    const newId = Date.now();
    const contactObj: Contact = {
      id: newId,
      name: newContact.name.trim(),
      firstName: newContact.name.trim().split(" ")[0] || "",
      lastName: newContact.name.trim().split(" ").slice(1).join(" ") || undefined,
      gender: newContact.gender,
      dob: newContact.dob || "",
      phone: newContact.phone || "",
      email: newContact.email || "",
      city: newContact.city || "",
      avatar: newContact.avatar || null,
      phones: newContact.phone ? [{ label: uiStrings.mobileLabel, number: newContact.phone }] : [],
      emails: newContact.email ? [{ label: uiStrings.personalLabel, address: newContact.email }] : [],
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };

    const updatedContacts = [...contacts, contactObj];
    saveCollection("contacts", updatedContacts);

    if (createType === "student") {
      setData((d) => ({
        ...d,
        contactId: newId,
        name: contactObj.name,
        gender: contactObj.gender || d.gender,
        dob: contactObj.dob || d.dob,
        phone: (contactObj.phone as string) || "",
        email: (contactObj.email as string) || "",
      }));
    } else if (createType === "father") {
      setData((d) => ({
        ...d,
        fatherContactId: newId,
        fatherName: contactObj.name,
      }));
    } else if (createType === "mother") {
      setData((d) => ({
        ...d,
        motherContactId: newId,
        motherName: contactObj.name,
      }));
    }

    setShowCreateModal(false);
  };

  const handleSave = async (): Promise<void> => {
    setError("");

    const settings = getObject<StudentsSettings>("students_settings", DEFAULT_STUDENTS_SETTINGS);
    const fields = settings.fields || DEFAULT_STUDENTS_SETTINGS.fields || {};
    const customFields = settings.customFields || [];

    // Validate required default fields
    if (fields.gender?.required && !data.gender) {
      setError("Gender is required.");
      return;
    }
    if (fields.dob?.required && !data.dob) {
      setError("Date of Birth is required.");
      return;
    }
    if (fields.fatherLink?.required && !data.fatherContactId) {
      setError("Father's profile is required.");
      return;
    }
    if (fields.motherLink?.required && !data.motherContactId) {
      setError("Mother's profile is required.");
      return;
    }
    if (fields.registeredDate?.required && !data.registeredDate) {
      setError("Registration Date is required.");
      return;
    }

    if (settings.requireGuardian && !data.fatherContactId && !data.motherContactId) {
      setError("Please link at least one guardian contact (Father or Mother) as required by module settings.");
      return;
    }

    // Validate required custom fields
    for (const field of customFields) {
      if (field.required) {
        const val = data[field.id];
        if (val === undefined || val === null || val === "" || val === false) {
          setError(`"${field.label}" is required.`);
          return;
        }
      }
    }

    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));

    // Check uniqueness
    if (students) {
      for (const s of students) {
        if (student && s.id === student.id) continue;

        if (data.contactId && s.contactId && String(data.contactId) === String(s.contactId)) {
          setError("This contact is already registered as a student.");
          setSaving(false);
          return;
        }

        if (data.email && s.email && data.email.trim().toLowerCase() === s.email.trim().toLowerCase()) {
          setError("A student with this Email address already exists.");
          setSaving(false);
          return;
        }

        if (data.name && data.dob && s.name && s.dob) {
          if (
            data.name.trim().toLowerCase() === s.name.trim().toLowerCase() &&
            data.dob === s.dob
          ) {
            setError("A student with this Name & Date of Birth already exists.");
            setSaving(false);
            return;
          }
        }
      }
    }

    const tcFields = ["name", "fatherName", "motherName"] as const;
    const saved = { ...data };
    tcFields.forEach((f) => {
      if (typeof saved[f] === "string") {
        saved[f] = toTitleCase(saved[f]) as string;
      }
    });

    onSave({
      ...saved,
      id: student?.id || `st${Date.now()}`,
      registeredDate: saved.registeredDate,
      enrolledSessions: student?.enrolledSessions || []
    } as unknown as Student);
    setSaving(false);
  };

  return (
    <>
      <FormModal
        open
        onClose={onClose}
        title={student ? "Edit Student Details" : "Register New Student"}
        subtitle="Select a contact to register as a student and link parents"
        icon={Sparkles}
        size="xl"
        tall
        cancelLabel={t("common.cancel")}
        saveLabel={saving ? "Saving…" : student ? "Update Student" : "Register Student"}
        onSave={handleSave}
        saving={saving}
        saveDisabled={!data.contactId}
        error={error || undefined}
      >
          <div className="space-y-6">
            {/* Card 1: Student Record Link */}
            <div className="p-4.5 rounded-xl border border-border bg-card/50 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">Student Profile</h3>
                  <p className="text-[10px] text-muted-foreground">Select the contact record for this student</p>
                </div>
              </div>
              <ContactPicker 
                label="Student Name" 
                value={data.contactId} 
                onChange={handleContactSelect} 
                contacts={contacts} 
                excludeIds={studentExcludeIds} 
                onCreateContact={(query) => handleStartCreate("student", query)}
                onAvatarChange={handleStudentAvatarChange}
              />
            </div>

              {/* Card 2: Registration Details */}
              <div className="p-4.5 rounded-xl border border-border bg-card/50 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
                  <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Registration & Status</h3>
                    <p className="text-[10px] text-muted-foreground">General Register number and status configuration</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>GR Number *</label>
                    <input
                      required
                      className={INPUT}
                      value={data.grNumber}
                      onChange={(e) => setData((d) => ({ ...d, grNumber: e.target.value }))}
                      placeholder="e.g. 0001-2026"
                    />
                    <p className="text-[9px] text-muted-foreground mt-1">Generated automatically; editable if custom numbering required.</p>
                  </div>

                  <div>
                    <label className={LABEL}>Academic Status</label>
                    <select
                      className={INPUT + " cursor-pointer"}
                      value={data.status}
                      onChange={(e) => setData((d) => ({ ...d, status: e.target.value as "active" | "inactive" | "suspended" }))}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card 3: Form Fields & Preferences in Sorted Order */}
              {data.contactId && orderedFields.some(f => f.isCustom ? true : (fields[f.id]?.enabled !== false)) && (
                <div className="p-4.5 rounded-xl border border-border bg-card/50 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-foreground">Student Attributes</h3>
                      <p className="text-[10px] text-muted-foreground">Configured and sorted attributes for this student profile</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {orderedFields.map((field) => {
                      const isEnabled = field.isCustom ? true : (fields[field.id]?.enabled !== false);
                      if (!isEnabled) return null;

                      if (field.id === "gender") {
                        return (
                          <div key="gender">
                            <label className={LABEL}>Gender {field.required ? "*" : ""}</label>
                            <select
                              className={INPUT}
                              value={data.gender}
                              onChange={(e) => setData((d) => ({ ...d, gender: e.target.value }))}
                            >
                              <option value="">Select Gender</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        );
                      }

                      if (field.id === "dob") {
                        return (
                          <div key="dob">
                            <label className={LABEL}>Date of Birth {field.required ? "*" : ""}</label>
                            <DatePicker
                              value={data.dob}
                              onChange={(val) => setData((d) => ({ ...d, dob: val }))}
                              required={field.required}
                            />
                          </div>
                        );
                      }

                      if (field.id === "fatherLink") {
                        return (
                          <div key="fatherLink" className="sm:col-span-2">
                            <ContactPicker 
                              label={`Father's Name${field.required ? " *" : ""}`} 
                              value={data.fatherContactId} 
                              onChange={handleFatherSelect} 
                              contacts={fatherContacts} 
                              excludeIds={[data.contactId, data.motherContactId].filter(Boolean)} 
                              onCreateContact={(query) => handleStartCreate("father", query)}
                            />
                          </div>
                        );
                      }

                      if (field.id === "motherLink") {
                        return (
                          <div key="motherLink" className="sm:col-span-2">
                            <ContactPicker 
                              label={`Mother's Name${field.required ? " *" : ""}`} 
                              value={data.motherContactId} 
                              onChange={handleMotherSelect} 
                              contacts={motherContacts} 
                              excludeIds={[data.contactId, data.fatherContactId].filter(Boolean)} 
                              onCreateContact={(query) => handleStartCreate("mother", query)}
                            />
                          </div>
                        );
                      }

                      if (field.id === "registeredDate") {
                        return (
                          <div key="registeredDate">
                            <label className={LABEL}>Registration Date {field.required ? "*" : ""}</label>
                            <DatePicker
                              required={field.required}
                              value={data.registeredDate}
                              onChange={handleRegisteredDateChange}
                            />
                          </div>
                        );
                      }

                      // Custom Field
                      if (field.isCustom) {
                        const value = data[field.id] ?? "";
                        return (
                          <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                            <label className={LABEL}>
                              {field.label} {field.required ? "*" : ""}
                            </label>
                            {field.type === "textarea" ? (
                              <textarea
                                className={INPUT + " min-h-[80px] py-2"}
                                value={value as string}
                                onChange={(e) => setData((d) => ({ ...d, [field.id]: e.target.value }))}
                                placeholder={`Enter ${field.label.toLowerCase()}…`}
                                required={field.required}
                              />
                            ) : field.type === "select" ? (
                              <select
                                className={INPUT + " cursor-pointer"}
                                value={value as string}
                                onChange={(e) => setData((d) => ({ ...d, [field.id]: e.target.value }))}
                                required={field.required}
                              >
                                <option value="">Select option…</option>
                                {field.options?.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : field.type === "boolean" ? (
                              <label className="flex items-center gap-2.5 py-2 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={!!value}
                                  onChange={(e) => setData((d) => ({ ...d, [field.id]: e.target.checked }))}
                                  className="w-4 h-4 rounded border border-border accent-primary cursor-pointer"
                                />
                                <span className="text-xs font-medium text-foreground">{field.label}</span>
                              </label>
                            ) : field.type === "number" ? (
                              <input
                                type="number"
                                className={INPUT}
                                value={value as number}
                                onChange={(e) => setData((d) => ({ ...d, [field.id]: e.target.value }))}
                                placeholder={`Enter number…`}
                                required={field.required}
                              />
                            ) : field.type === "date" ? (
                              <DatePicker
                                value={value as string}
                                onChange={(val) => setData((d) => ({ ...d, [field.id]: val }))}
                                required={field.required}
                              />
                            ) : (
                              <input
                                type="text"
                                className={INPUT}
                                value={value as string}
                                onChange={(e) => setData((d) => ({ ...d, [field.id]: e.target.value }))}
                                placeholder={`Enter ${field.label.toLowerCase()}…`}
                                required={field.required}
                              />
                            )}
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                </div>
              )}

          </div>
      </FormModal>

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg flex flex-col z-10 p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Create Contact
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      Adding a new contact for {createType === "student" ? "Student" : createType === "father" ? "Father" : "Mother"}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="flex items-center gap-4 border-b border-border/60 pb-4">
                  <div className="relative group/new-avatar cursor-pointer" onClick={() => newContactFileRef.current?.click()}>
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted border border-border flex items-center justify-center shadow-sm">
                      {newContact.avatar ? (
                        <img src={newContact.avatar} alt="new avatar" className="w-full h-full object-cover" />
                      ) : (
                        <Upload className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/45 rounded-xl opacity-0 group-hover/new-avatar:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera className="w-4 h-4 text-white" />
                    </div>
                    <input
                      type="file"
                      ref={newContactFileRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleNewContactAvatarChange}
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Profile Photo</h4>
                    <p className="text-[10px] text-muted-foreground">Upload and optimize photo</p>
                  </div>
                </div>

                <div>
                  <label className={LABEL}>Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <input
                      required
                      className={INPUT + " pl-9.5"}
                      value={newContact.name}
                      onChange={(e) => setNewContact((c) => ({ ...c, name: e.target.value }))}
                      placeholder="Full name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Gender — uses genders list from ContactConfigContext */}
                  <div>
                    <label className={LABEL}>Gender *</label>
                    {createType === "student" ? (
                      <div className="flex flex-wrap gap-2">
                        {genders.map((g) => {
                          const isSelected = newContact.gender === g;
                          const colorClass = genderSelectClass(g, isSelected);
                          return (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setNewContact((c) => ({ ...c, gender: g }))}
                              className={`flex-1 py-2 px-3 rounded-lg border text-[11px] font-bold capitalize transition-all duration-150 ${colorClass}`}
                            >
                              {g}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/40 text-muted-foreground text-xs font-semibold select-none h-[38px]">
                        <Lock className="w-3.5 h-3.5 text-muted-foreground/60" />
                        <span className="capitalize flex items-center gap-1.5">
                          {createType === "father" ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-info" />
                              Male (Locked for Father)
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                              Female (Locked for Mother)
                            </>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={LABEL}>Date of Birth</label>
                    <DatePicker
                      value={newContact.dob}
                      onChange={(val) => setNewContact((c) => ({ ...c, dob: val }))}
                    />
                  </div>
                </div>

                {/* Phone — only shown if contacts phones tab / phone field is enabled */}
                {isTabFieldEnabled("phones", "number") && (
                  <div>
                    <label className={LABEL}>Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                      <input
                        className={INPUT + " pl-9.5"}
                        value={newContact.phone}
                        onChange={(e) => setNewContact((c) => ({ ...c, phone: e.target.value }))}
                        placeholder={`${prefs.defaultCountry === "United States" ? "+1" : "+92"} XXX XXXXXXX`}
                      />
                    </div>
                  </div>
                )}

                {/* Email — only shown if contacts emails tab / address field is enabled */}
                {isTabFieldEnabled("emails", "address") && (
                  <div>
                    <label className={LABEL}>Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                      <input
                        type="email"
                        className={INPUT + " pl-9.5"}
                        value={newContact.email}
                        onChange={(e) => setNewContact((c) => ({ ...c, email: e.target.value }))}
                        placeholder="contact@email.com"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border mt-5">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/10"
                  >
                    Create Contact
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
