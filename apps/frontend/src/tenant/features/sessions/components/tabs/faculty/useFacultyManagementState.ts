import { useState, useMemo } from "react";
import { useTeachersContractList, useTeachersByIds } from "@/tenant/hooks/collections/faculty";
import { TEACHERS_MODULE_MANIFEST, formatTeacherDisplayName, type Teacher } from "@mms/shared";
import type { Session, SessionFaculty } from "@/lib/data/sessionsData";
import { COMMON_FACULTY_ROLES } from "./facultyManagementShared";

export function useFacultyManagementState(
  session: Session,
  onUpdate: (updatedSession: Session) => void | Promise<void>,
) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<SessionFaculty | null>(null);
  const [teacherId, setTeacherId] = useState("");
  const [role, setRole] = useState("Lead Instructor");
  const [customRole, setCustomRole] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [saving, setSaving] = useState(false);

  const { data: teachersData } = useTeachersContractList(
    { page: 1, limit: TEACHERS_MODULE_MANIFEST.maxPageSize, status: "active" },
    modalOpen,
  );

  const teachersList = ((teachersData?.body?.faculty ?? teachersData?.body?.teachers ?? []) as Teacher[]);

  const selectedTeacherId = teacherId ? [teacherId] : [];
  const { data: selectedTeachersData } = useTeachersByIds(selectedTeacherId);
  const selectedTeachers = (selectedTeachersData ?? []) as Teacher[];

  const allTeachers = useMemo(() => {
    const map = new Map<string, Teacher>();
    for (const t of teachersList) {
      if (t?.id) map.set(String(t.id), t);
    }
    for (const t of selectedTeachers) {
      if (t?.id && !map.has(String(t.id))) {
        map.set(String(t.id), t);
      }
    }
    return Array.from(map.values());
  }, [teachersList, selectedTeachers]);

  const handleOpenAdd = () => {
    setEditingFaculty(null);
    setTeacherId(allTeachers[0]?.id ? String(allTeachers[0].id) : "");
    setRole("Lead Instructor");
    setCustomRole("");
    setStatus("active");
    setModalOpen(true);
  };

  const handleOpenEdit = (item: SessionFaculty) => {
    setEditingFaculty(item);
    setTeacherId(item.facultyId || "");
    if (COMMON_FACULTY_ROLES.includes(item.role)) {
      setRole(item.role);
      setCustomRole("");
    } else {
      setRole("Custom");
      setCustomRole(item.role);
    }
    setStatus(item.status);
    setModalOpen(true);
  };

  const handleDelete = async (facultyId: string) => {
    const updatedFaculty = (session.faculty || []).filter((f) => f.id !== facultyId);
    await onUpdate({ ...session, faculty: updatedFaculty });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const selectedTeacher = allTeachers.find((t) => String(t.id) === String(teacherId));
      const resolvedTeacherName = selectedTeacher
        ? formatTeacherDisplayName(selectedTeacher) || editingFaculty?.facultyName || "Faculty Member"
        : editingFaculty?.facultyName || "Faculty Member";

      const finalRole = role === "Custom" ? customRole.trim() || "Instructor" : role;
      const facultyList = [...(session.faculty || [])];

      if (editingFaculty) {
        const index = facultyList.findIndex((f) => f.id === editingFaculty.id);
        if (index >= 0) {
          facultyList[index] = {
            ...editingFaculty,
            facultyId: teacherId || editingFaculty.facultyId,
            facultyName: resolvedTeacherName,
            role: finalRole,
            status,
          };
        }
      } else {
        const newFaculty: SessionFaculty = {
          id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11),
          sessionId: session.id,
          facultyId: teacherId || "unassigned",
          facultyName: resolvedTeacherName,
          role: finalRole,
          status,
        };
        facultyList.push(newFaculty);
      }

      await onUpdate({ ...session, faculty: facultyList });
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return {
    modalOpen,
    setModalOpen,
    editingFaculty,
    teacherId,
    setTeacherId,
    role,
    setRole,
    customRole,
    setCustomRole,
    status,
    setStatus,
    saving,
    allTeachers,
    handleOpenAdd,
    handleOpenEdit,
    handleDelete,
    handleSave,
  };
}
