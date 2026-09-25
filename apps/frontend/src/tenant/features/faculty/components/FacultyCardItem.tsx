import type React from "react";
import { DirectoryCard } from "@/components/ui/DirectoryCard";
import { getGenderAccentBarClass } from "@/lib/directoryCardAccent";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveTeacherPrimaryChannels } from "@/lib/faculty/facultyPrimaryChannels";
import { TeacherArchivedBanner } from "@/tenant/features/faculty/components/FacultyArchivedBanner";
import { TeacherCardActions } from "@/tenant/features/faculty/components/FacultyCardActions";
import { TeacherCardHeader } from "@/tenant/features/faculty/components/FacultyCardHeader";
import { TeacherCardMetadata } from "@/tenant/features/faculty/components/FacultyCardMetadata";
import { resolveTeacherCardFaceVisibility } from "@/tenant/features/faculty/components/facultyCardFaceVisibility";
import { teacherRowIdentity } from "@/tenant/features/faculty/components/facultyFieldDisplay";
import type { useFacultyEntityDescriptor } from "@/tenant/features/faculty/hooks/useFacultyEntityDescriptor";
import type { TeacherListContentProps } from "@/tenant/features/faculty/components/facultyListContentShared";
import type { Teacher } from "@mms/shared";

export interface TeacherCardItemProps {
  teacher: Teacher;
  selectedSet: Set<string>;
  selectedIds: string[];
  showDeleted: boolean;
  canWrite: boolean;
  canDelete: boolean;
  isColumnVisible: (key: string) => boolean;
  columnRegistry: TeacherListContentProps["columnRegistry"];
  customFieldsById: TeacherListContentProps["customFieldsById"];
  statusConfig: TeacherListContentProps["statusConfig"];
  descriptor: ReturnType<typeof useFacultyEntityDescriptor>;
  reducedMotion: boolean;
  onSelectOne: (id: string) => void;
  onView: (teacher: Teacher) => void;
  onEdit: (teacher: Teacher) => void;
  onRequestDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onSms?: (teachers: Teacher[]) => void;
  onWhatsApp?: (teachers: Teacher[]) => void;
  onEmail?: (teachers: Teacher[]) => void;
}

export function TeacherCardItem({
  teacher,
  selectedSet,
  selectedIds,
  showDeleted,
  canWrite,
  canDelete,
  isColumnVisible,
  columnRegistry,
  customFieldsById,
  statusConfig,
  descriptor,
  reducedMotion,
  onSelectOne,
  onView,
  onEdit,
  onRequestDelete,
  onRestore,
  onSms,
  onWhatsApp,
  onEmail,
}: TeacherCardItemProps): React.JSX.Element {
  const { t } = useTranslation();
  const teacherIdStr = String(teacher.id);
  const isSelected = selectedSet.has(teacherIdStr);
  const { displayName } = teacherRowIdentity(teacher, selectedSet, t);
  const { phone, email } = resolveTeacherPrimaryChannels(teacher);
  const faceVisible = resolveTeacherCardFaceVisibility(columnRegistry, isColumnVisible);

  return (
    <DirectoryCard
      entity={teacher}
      selectedIds={selectedIds}
      canSelect={canDelete}
      onToggleSelected={() => onSelectOne(teacherIdStr)}
      onView={onView}
      onEdit={onEdit}
      reducedMotion={reducedMotion}
      accentClassName={
        isColumnVisible("gender")
          ? getGenderAccentBarClass(isSelected, teacher.gender)
          : undefined
      }
      header={{
        displayName,
      }}
      headerSlot={
        <TeacherCardHeader
          teacher={teacher}
          teacherId={teacherIdStr}
          isSelected={isSelected}
          displayName={displayName}
          isColumnVisible={faceVisible}
          onSelectOne={() => onSelectOne(teacherIdStr)}
          onView={onView}
          reducedMotion={reducedMotion}
        />
      }
      infoPills={{
        phone,
        phoneDisplay: phone,
        email,
        showPhone: faceVisible("phone"),
        showEmail: faceVisible("email"),
        showArchived: showDeleted,
        onWhatsApp: onWhatsApp ? () => onWhatsApp([teacher]) : undefined,
        onSms: onSms ? () => onSms([teacher]) : undefined,
        onEmail: onEmail ? () => onEmail([teacher]) : undefined,
      }}
      metadataSlot={
        <TeacherCardMetadata
          teacher={teacher}
          isColumnVisible={isColumnVisible}
          columnRegistry={columnRegistry}
          customFieldsById={customFieldsById}
          statusConfig={statusConfig}
          descriptor={descriptor}
        />
      }
      banner={<TeacherArchivedBanner teacher={teacher} />}
      footer={
        <TeacherCardActions
          teacher={teacher}
          teacherId={teacherIdStr}
          displayName={displayName}
          showDeleted={showDeleted}
          canWrite={canWrite}
          canDelete={canDelete}
          onView={onView}
          onEdit={onEdit}
          onRequestDelete={onRequestDelete}
          onRestore={onRestore}
          onSms={onSms}
          onWhatsApp={onWhatsApp}
          onEmail={onEmail}
        />
      }
    />
  );
}

export type FacultyCardItemProps = TeacherCardItemProps;
export const FacultyCardItem = TeacherCardItem;
