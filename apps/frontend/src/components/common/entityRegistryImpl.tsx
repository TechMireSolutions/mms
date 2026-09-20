import type {
  FieldValueType,
  BadgeTone,
  FieldBadgeConfig,
  FieldDefinition,
  EntityDrawerSection,
  TableColumnDescriptor,
  EntityDescriptor,
  CreateEntityDescriptorOptions,
} from "@/types/entityRegistry";
import { createEntityDescriptor } from "./entityDescriptorFactory";
import {
  contactsEntityDescriptor,
  studentsEntityDescriptor,
  facultyEntityDescriptor,
  teachersEntityDescriptor,
  sessionsEntityDescriptor,
  financeEntityDescriptor,
  attendanceEntityDescriptor,
  enrollmentsEntityDescriptor,
  hasanatEntityDescriptor,
  obligationsEntityDescriptor,
  platformWorkspacesEntityDescriptor,
  platformUsersEntityDescriptor,
  platformSettingsEntityDescriptor,
  questionBankEntityDescriptor,
} from "./descriptors";

export type {
  FieldValueType,
  BadgeTone,
  FieldBadgeConfig,
  FieldDefinition,
  EntityDrawerSection,
  TableColumnDescriptor,
  EntityDescriptor,
  CreateEntityDescriptorOptions,
};

export { createEntityDescriptor };

export {
  contactsEntityDescriptor,
  studentsEntityDescriptor,
  facultyEntityDescriptor,
  teachersEntityDescriptor,
  sessionsEntityDescriptor,
  financeEntityDescriptor,
  attendanceEntityDescriptor,
  enrollmentsEntityDescriptor,
  hasanatEntityDescriptor,
  obligationsEntityDescriptor,
  platformWorkspacesEntityDescriptor,
  platformUsersEntityDescriptor,
  platformSettingsEntityDescriptor,
  questionBankEntityDescriptor,
};

export const ENTITY_REGISTRY: Record<string, EntityDescriptor<unknown>> = {
  contacts: contactsEntityDescriptor as unknown as EntityDescriptor<unknown>,
  students: studentsEntityDescriptor as unknown as EntityDescriptor<unknown>,
  teachers: teachersEntityDescriptor as unknown as EntityDescriptor<unknown>,
  faculty: facultyEntityDescriptor as unknown as EntityDescriptor<unknown>,
  sessions: sessionsEntityDescriptor as unknown as EntityDescriptor<unknown>,
  finance: financeEntityDescriptor as unknown as EntityDescriptor<unknown>,
  attendance: attendanceEntityDescriptor as unknown as EntityDescriptor<unknown>,
  enrollments: enrollmentsEntityDescriptor as unknown as EntityDescriptor<unknown>,
  hasanat: hasanatEntityDescriptor as unknown as EntityDescriptor<unknown>,
  obligations: obligationsEntityDescriptor as unknown as EntityDescriptor<unknown>,
  platformWorkspaces: platformWorkspacesEntityDescriptor as unknown as EntityDescriptor<unknown>,
  platformUsers: platformUsersEntityDescriptor as unknown as EntityDescriptor<unknown>,
  platformSettings: platformSettingsEntityDescriptor as unknown as EntityDescriptor<unknown>,
  questionBank: questionBankEntityDescriptor as unknown as EntityDescriptor<unknown>,
};

/**
 * Global accessor for entity descriptors by domain entity key.
 */
export function getEntityDescriptor<T = unknown>(
  entityType: string,
): EntityDescriptor<T> | undefined {
  return ENTITY_REGISTRY[entityType] as EntityDescriptor<T> | undefined;
}
