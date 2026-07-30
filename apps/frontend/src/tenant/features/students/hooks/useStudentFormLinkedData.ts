import { useCallback, useMemo, type MutableRefObject } from "react";
import { useContactById } from "@/tenant/hooks/collections/contacts";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import { formatDate, todayISO, type Student } from "@mms/shared";
import { useStudentLinkedContactIds, useStudentNextGrNumber } from "@/tenant/features/students/hooks/useStudents";
import {
  getParentExcludeIds,
  buildStudentContactExcludeIds,
} from "@/tenant/features/students/hooks/studentFormValidation";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

interface UseStudentFormLinkedDataOptions {
  student?: Partial<Student> | null;
  studentDraft: Partial<Student>;
  settings: {
    grNumberTemplate?: string;
    grNumberDigits?: number;
    grNumberRestartAnnually?: boolean;
  };
  grManuallyEdited: MutableRefObject<boolean>;
  updateDraft: (patch: Partial<Student>) => void;
  t: TranslationFunction;
}

export function useStudentFormLinkedData({
  student,
  studentDraft,
  settings,
  grManuallyEdited,
  updateDraft,
  t,
}: UseStudentFormLinkedDataOptions) {
  const { data: linkedContact } = useContactById(
    studentDraft.contactId ? String(studentDraft.contactId) : undefined,
    !!studentDraft.contactId,
  );

  const linkedGenderRaw = linkedContact?.gender?.trim() || "";
  const linkedGenderLabel = linkedGenderRaw ? formatContactGenderLabel(linkedGenderRaw, t) : "";
  const linkedDob = linkedContact?.dob?.trim() ? formatDate(linkedContact.dob.trim()) : "";

  const { data: linkedStudentContactIds = [] } = useStudentLinkedContactIds(
    student?.id ? String(student.id) : undefined,
  );

  const { data: nextGrNumber } = useStudentNextGrNumber({
    registeredDate: (studentDraft.registeredDate || todayISO()).split("T")[0],
    template: settings.grNumberTemplate,
    digits: settings.grNumberDigits,
    restartAnnually: settings.grNumberRestartAnnually,
    enabled: !student?.id,
  });

  const handleGrNumberChange = useCallback((value: string) => {
    grManuallyEdited.current = true;
    updateDraft({ grNumber: value });
  }, [grManuallyEdited, updateDraft]);

  const fatherExcludeIds = useMemo(() => getParentExcludeIds(studentDraft, "father"), [studentDraft]);
  const motherExcludeIds = useMemo(() => getParentExcludeIds(studentDraft, "mother"), [studentDraft]);
  const guardianExcludeIds = useMemo(() => getParentExcludeIds(studentDraft, "guardian"), [studentDraft]);

  const excludeIds = useMemo(
    () => buildStudentContactExcludeIds(studentDraft, linkedStudentContactIds),
    [studentDraft, linkedStudentContactIds],
  );

  const isGrAutoAssigned = !student?.id && !!studentDraft.grNumber && studentDraft.grNumber === nextGrNumber && !grManuallyEdited.current;

  return {
    linkedContact,
    linkedGenderLabel,
    linkedDob,
    nextGrNumber,
    handleGrNumberChange,
    fatherExcludeIds,
    motherExcludeIds,
    guardianExcludeIds,
    excludeIds,
    isGrAutoAssigned,
  };
}
