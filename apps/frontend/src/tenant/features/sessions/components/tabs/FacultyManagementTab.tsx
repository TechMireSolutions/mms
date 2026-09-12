/**
 * @file FacultyManagementTab.tsx
 * @description Model 6 Session Faculty Management tab (dynamic roles, teacher selector, active/inactive status).
 */
import React, { useState, useMemo } from 'react';
import { UserCheck, Plus, Trash2, Edit2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormModal } from '@/components/ui/FormModal';
import { FormSelect } from '@/components/ui/FormSelect';
import { FORM_LABEL } from '@/components/ui/formStyles';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTranslation } from '@/hooks/useTranslation';
import { useTeachersContractList, useTeachersByIds } from '@/tenant/hooks/collections/teachers';
import { TEACHERS_MODULE_MANIFEST, type Teacher } from '@mms/shared';
import type { Session, SessionFaculty } from '@/lib/data/sessionsData';

const COMMON_FACULTY_ROLES = [
  'Head Instructor',
  'Lead Instructor',
  'Assistant Instructor',
  'Department Head',
  'Academic Coordinator',
  'Tajweed Supervisor',
  'Examiner',
  'Administrator',
];

function formatTeacherDisplayName(teacher?: Partial<Teacher> | null): string {
  if (!teacher) return '';
  const name = (teacher.name || [teacher.firstName, teacher.lastName].filter(Boolean).join(' ')).trim();
  if (name) {
    return teacher.employeeId ? `${name} (${teacher.employeeId})` : name;
  }
  if (teacher.employeeId) {
    return `Teacher (${teacher.employeeId})`;
  }
  return teacher.id ? `Teacher #${String(teacher.id).slice(0, 8)}` : '';
}

interface FacultyManagementTabProps {
  session: Session;
  onUpdate: (updatedSession: Session) => void | Promise<void>;
  canMutate: boolean;
}

export function FacultyManagementTab({ session, onUpdate, canMutate }: FacultyManagementTabProps): React.JSX.Element {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<SessionFaculty | null>(null);
  const [teacherId, setTeacherId] = useState('');
  const [role, setRole] = useState('Lead Instructor');
  const [customRole, setCustomRole] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [saving, setSaving] = useState(false);

  const { data: teachersData } = useTeachersContractList(
    { page: 1, limit: TEACHERS_MODULE_MANIFEST.maxPageSize, status: 'active' },
    modalOpen,
  );

  const teachersList = (teachersData?.body?.teachers ?? []) as Teacher[];

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
    setTeacherId(allTeachers[0]?.id ? String(allTeachers[0].id) : '');
    setRole('Lead Instructor');
    setCustomRole('');
    setStatus('active');
    setModalOpen(true);
  };

  const handleOpenEdit = (item: SessionFaculty) => {
    setEditingFaculty(item);
    setTeacherId(item.facultyId || '');
    if (COMMON_FACULTY_ROLES.includes(item.role)) {
      setRole(item.role);
      setCustomRole('');
    } else {
      setRole('Custom');
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
        ? (formatTeacherDisplayName(selectedTeacher) || editingFaculty?.facultyName || 'Faculty Member')
        : editingFaculty?.facultyName || 'Faculty Member';

      const finalRole = role === 'Custom' ? customRole.trim() || 'Instructor' : role;

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
          id: crypto.randomUUID(),
          sessionId: session.id,
          facultyId: teacherId || 'unassigned',
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


  const facultyItems = session.faculty || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t('sessions.faculty.title' as any) || 'Session Faculty Management'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t('sessions.faculty.subtitle' as any) || 'Assign teachers and faculty roles to manage this academic session'}
          </p>
        </div>
        {canMutate && (
          <Button size="sm" onClick={handleOpenAdd} className="gap-1.5">
            <Plus className="h-4 w-4" />
            {t('sessions.faculty.add' as any) || 'Add Faculty'}
          </Button>
        )}
      </div>

      {facultyItems.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title={t('sessions.faculty.emptyTitle' as any) || 'No Faculty Assigned'}
          description={t('sessions.faculty.emptyDescription' as any) || 'Add faculty members and instructors to coordinate this academic session.'}
          action={
            canMutate ? (
              <Button size="sm" onClick={handleOpenAdd} className="gap-1.5">
                <Plus className="h-4 w-4" />
                {t('sessions.faculty.add' as any) || 'Add Faculty'}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {facultyItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-3 shadow-xs transition-colors hover:border-border"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-medium">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.facultyName || 'Faculty Member'}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground/80">
                      {item.role}
                    </span>
                    <span className="flex items-center gap-1">
                      {item.status === 'active' ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="capitalize">{item.status}</span>
                    </span>
                  </div>
                </div>
              </div>

              {canMutate && (
                <div className="flex items-center gap-1 shrink-0 ms-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleOpenEdit(item)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingFaculty ? 'Edit Session Faculty' : 'Add Session Faculty'}
        icon={UserCheck}
        cancelLabel={t('common.cancel')}
        saveLabel={t('common.save')}
        onSave={handleSave}
        saving={saving}
      >
        <div className="space-y-4">
          <div>
            <label className={FORM_LABEL} htmlFor="faculty-teacher">
              {t('sessions.faculty.selectTeacher' as any) || 'Faculty Member / Teacher'}
            </label>
            <FormSelect
              id="faculty-teacher"
              name="teacherId"
              value={teacherId}
              onChange={(val) => setTeacherId(val)}
              options={
                allTeachers.length > 0
                  ? allTeachers.map((teacher) => ({
                      value: String(teacher.id),
                      label: formatTeacherDisplayName(teacher),
                    }))
                  : [{ value: '', label: 'No active teachers found' }]
              }
              className="w-full"
            />
          </div>

          <div>
            <label className={FORM_LABEL} htmlFor="faculty-role">
              {t('sessions.faculty.role' as any) || 'Session Faculty Role'}
            </label>
            <FormSelect
              id="faculty-role"
              name="role"
              value={role}
              onChange={(val) => setRole(val)}
              options={[
                ...COMMON_FACULTY_ROLES.map((r) => ({ value: r, label: r })),
                { value: 'Custom', label: 'Custom Role...' },
              ]}
              className="w-full"
            />
          </div>

          {role === 'Custom' && (
            <div>
              <label className={FORM_LABEL} htmlFor="faculty-custom-role">
                {t('sessions.faculty.customRoleName' as any) || 'Custom Role Name'}
              </label>
              <Input
                id="faculty-custom-role"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="e.g. Vice Principal, Spiritual Advisor"
              />
            </div>
          )}

          <div>
            <label className={FORM_LABEL} htmlFor="faculty-status">
              {t('sessions.faculty.status' as any) || 'Status'}
            </label>
            <FormSelect
              id="faculty-status"
              name="status"
              value={status}
              onChange={(val) => setStatus(val as 'active' | 'inactive')}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              className="w-full"
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
