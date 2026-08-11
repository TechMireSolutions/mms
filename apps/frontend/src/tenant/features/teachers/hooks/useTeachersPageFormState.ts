import { useState } from "react";
import type { Teacher } from "@mms/shared";

/** Create/edit Teacher form overlay state (Students-shaped page form state). */
export function useTeachersPageFormState() {
  const [showForm, setShowForm] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);

  const openCreate = () => {
    setEditTeacher(null);
    setShowForm(true);
  };

  const openEdit = (teacherToEdit: Teacher) => {
    setEditTeacher(teacherToEdit);
    setShowForm(true);
  };

  const close = () => {
    setShowForm(false);
    setEditTeacher(null);
  };

  return {
    showForm,
    editTeacher,
    setEditTeacher,
    setShowForm,
    openCreate,
    openEdit,
    close,
  };
}
