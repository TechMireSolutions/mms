import { useState, useEffect, useMemo } from "react";
import {
  Award,
  Briefcase,
  FileText,
  KeyRound,
  Network,
  User,
  type LucideIcon,
} from "lucide-react";
import type {
  Contact,
  Faculty,
  FacultyDesignationDefinition,
  FacultyHierarchyPreset,
  FieldDefinition,
  Teacher,
} from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { focusTeacherValidationField } from "@/tenant/features/faculty/components/facultyFormValidation";
import type { TeacherStatusOption } from "@/tenant/features/faculty/components/FacultyFormSections";
import type {
  FacultyUserAccountDraft,
  LinkedUserInfo,
} from "@/tenant/features/faculty/components/FacultyUserAccountSection";

export type FacultyFormTabKey =
  | "contact"
  | "employment"
  | "designation"
  | "hierarchy"
  | "account"
  | "notes";

export const FACULTY_FIELD_TAB_MAP: Record<string, FacultyFormTabKey> = {
  contactId: "contact",
  employeeId: "employment",
  status: "employment",
  department: "employment",
  specialization: "employment",
  qualification: "employment",
  joinDate: "employment",
  designation: "designation",
  customDesignation: "designation",
  designationId: "designation",
  designationStartsOn: "designation",
  reportingFacultyId: "hierarchy",
  hierarchyRank: "hierarchy",
  notes: "notes",
  "user.role": "account",
  "user.email": "account",
  "user.password": "account",
  "user.create": "account",
  userPassword: "account",
  userEmail: "account",
  userRole: "account",
  userId: "account",
};

export interface FormTabItem {
  key: FacultyFormTabKey;
  icon: LucideIcon;
  label: string;
  badge?: number;
  tone?: "destructive";
}

export interface TeacherFormTabContentProps {
  formInstanceId: string;
  activeTab?: string;
  teacher?: Teacher;
  teacherDraft: Partial<Teacher>;
  errors: Record<string, string>;
  fields: Record<string, FieldDefinition[]>;
  defaultSpecialization: string;
  linkedTeacherContactIds: Array<string | number>;
  specializationOptions: string[];
  designationOptions?: FacultyDesignationDefinition[];
  autoGenerateId: boolean;
  idPrefix: string;
  nextEmployeeId?: string;
  onRegenerateEmployeeId?: () => void;
  isFetchingNextEmployeeId?: boolean;
  statusOptions: TeacherStatusOption[];
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
  getFieldError: (fieldId: string) => string | undefined;
  onDraftChange: (patch: Partial<Teacher>) => void;
  linkedContact?: Contact | null;
  linkedUser?: LinkedUserInfo | null;
  userAccountDraft?: FacultyUserAccountDraft;
  onUserAccountDraftChange?: (draft: FacultyUserAccountDraft) => void;
  supervisorCandidates?: Faculty[];
  hierarchyRankPresets?: readonly FacultyHierarchyPreset[];
}

export type FacultyFormTabContentProps = TeacherFormTabContentProps;

export function useFacultyFormTabs(input: {
  isFieldEnabled: (fieldId: string) => boolean;
  errors: Record<string, string>;
  t: TranslationFunction;
  formInstanceId: string;
}) {
  const { isFieldEnabled, errors, t, formInstanceId } = input;
  const [activeTab, setActiveTab] = useState<FacultyFormTabKey>("contact");

  const tabErrors = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [fieldId, errorMsg] of Object.entries(errors)) {
      if (!errorMsg) continue;
      const tabKey = FACULTY_FIELD_TAB_MAP[fieldId] || "employment";
      counts[tabKey] = (counts[tabKey] || 0) + 1;
    }
    return counts;
  }, [errors]);

  const visibleTabs = useMemo(() => {
    const list: FormTabItem[] = [
      { key: "contact", icon: User, label: t("faculty.form.tab.contact") },
      { key: "employment", icon: Briefcase, label: t("faculty.form.tab.employment") },
    ];

    if (isFieldEnabled("designation")) {
      list.push({ key: "designation", icon: Award, label: t("faculty.form.tab.designation") });
    }
    if (isFieldEnabled("reportingFacultyId") || isFieldEnabled("hierarchyRank")) {
      list.push({ key: "hierarchy", icon: Network, label: t("faculty.form.tab.hierarchy") });
    }
    list.push({ key: "account", icon: KeyRound, label: t("faculty.form.tab.account") });
    if (isFieldEnabled("notes")) {
      list.push({ key: "notes", icon: FileText, label: t("faculty.form.tab.notes") });
    }

    return list.map((item) => {
      const errCount = tabErrors[item.key];
      const hasErrors = Boolean(errCount && errCount > 0);
      return {
        ...item,
        badge: hasErrors ? errCount : undefined,
        tone: hasErrors ? ("destructive" as const) : undefined,
      };
    });
  }, [isFieldEnabled, t, tabErrors]);

  useEffect(() => {
    if (!visibleTabs.some((tabItem) => tabItem.key === activeTab)) {
      setActiveTab("contact");
    }
  }, [visibleTabs, activeTab]);

  useEffect(() => {
    const errorKeys = Object.keys(errors).filter((key) => Boolean(errors[key]));
    if (errorKeys.length === 0) return;
    const firstInvalidTab = visibleTabs.find((vt) => Boolean(tabErrors[vt.key] && tabErrors[vt.key] > 0));
    if (firstInvalidTab && firstInvalidTab.key !== activeTab) {
      setActiveTab(firstInvalidTab.key);
    }
  }, [errors, tabErrors, activeTab, visibleTabs]);

  useEffect(() => {
    const errorKeys = Object.keys(errors).filter((key) => Boolean(errors[key]));
    if (errorKeys.length === 0) return;
    const fieldForActiveTab = errorKeys.find(
      (key) => (FACULTY_FIELD_TAB_MAP[key] || "employment") === activeTab,
    );
    if (!fieldForActiveTab) return;
    const timer = setTimeout(() => {
      focusTeacherValidationField(formInstanceId, fieldForActiveTab);
    }, 60);
    return () => clearTimeout(timer);
  }, [activeTab, errors, formInstanceId]);

  return { activeTab, setActiveTab, visibleTabs };
}
