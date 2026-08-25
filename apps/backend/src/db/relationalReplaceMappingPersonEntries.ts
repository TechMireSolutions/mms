import type { RelationalCollectionMapping } from './relationalReplaceMappingTypes.js';

/** Person-module collections: contacts, students, teachers, sessions, users + setup prefs. */
export const RELATIONAL_REPLACE_MAPPING_PERSON: Record<string, RelationalCollectionMapping> = {
  users: {
    priority: 900,
    importPath: './repositories/tenantUserRepository.js',
    fnName: 'replaceTenantUsersForWorkspace',
    snapshotFnName: 'listAllTenantUsersByWorkspace',
  },
  contacts: {
    priority: 10,
    importPath: './repositories/contactRepository.js',
    fnName: 'replaceContactsForWorkspace',
    snapshotFnName: 'listContactsByWorkspace',
  },
  students: {
    priority: 15,
    importPath: './repositories/studentRepository.js',
    fnName: 'replaceStudentsForWorkspace',
    snapshotFnName: 'listStudentsByWorkspace',
  },
  teachers: {
    importPath: './repositories/teacherRepository.js',
    fnName: 'replaceTeachersForWorkspace',
    snapshotFnName: 'listTeachersByWorkspace',
  },
  sessions: {
    importPath: './repositories/sessionRepository.js',
    fnName: 'replaceSessionsForWorkspace',
    snapshotFnName: 'listSessionsByWorkspace',
  },
  contact_lookups: {
    priority: 25,
    importPath: './repositories/contactLookupsRepository.js',
    fnName: 'replaceContactLookupsForWorkspace',
    snapshotFnName: 'listAllContactLookupsByWorkspace',
  },
  student_lookups: {
    priority: 28,
    importPath: './repositories/studentLookupsRepository.js',
    fnName: 'replaceStudentLookupsForWorkspace',
    snapshotFnName: 'listAllStudentLookupsByWorkspace',
  },
  contact_field_configs: {
    priority: 26,
    importPath: './repositories/contactFieldConfigRepository.js',
    fnName: 'replaceContactFieldConfigsForWorkspace',
    snapshotFnName: 'listAllContactFieldConfigsByWorkspace',
  },
  contact_module_preferences: {
    priority: 27,
    importPath: './repositories/contactModulePreferencesRepository.js',
    fnName: 'replaceContactModulePreferencesForWorkspace',
    snapshotFnName: 'listAllContactModulePreferencesByWorkspace',
  },
  contact_user_column_prefs: {
    priority: 905,
    importPath: './repositories/contactUserColumnPrefsRepository.js',
    fnName: 'replaceContactUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllContactUserColumnPrefsByWorkspace',
  },
  student_field_configs: {
    priority: 29,
    importPath: './repositories/studentFieldConfigRepository.js',
    fnName: 'replaceStudentFieldConfigsForWorkspace',
    snapshotFnName: 'listAllStudentFieldConfigsByWorkspace',
  },
  student_module_preferences: {
    priority: 30,
    importPath: './repositories/studentModulePreferencesRepository.js',
    fnName: 'replaceStudentModulePreferencesForWorkspace',
    snapshotFnName: 'listAllStudentModulePreferencesByWorkspace',
  },
  student_user_column_prefs: {
    priority: 906,
    importPath: './repositories/studentUserColumnPrefsRepository.js',
    fnName: 'replaceStudentUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllStudentUserColumnPrefsByWorkspace',
  },
  teacher_lookups: {
    priority: 32,
    importPath: './repositories/teacherLookupsRepository.js',
    fnName: 'replaceTeacherLookupsForWorkspace',
    snapshotFnName: 'listAllTeacherLookupsByWorkspace',
  },
  teacher_field_configs: {
    priority: 33,
    importPath: './repositories/teacherFieldConfigRepository.js',
    fnName: 'replaceTeacherFieldConfigsForWorkspace',
    snapshotFnName: 'listAllTeacherFieldConfigsByWorkspace',
  },
  teacher_module_preferences: {
    priority: 34,
    importPath: './repositories/teacherModulePreferencesRepository.js',
    fnName: 'replaceTeacherModulePreferencesForWorkspace',
    snapshotFnName: 'listAllTeacherModulePreferencesByWorkspace',
  },
  teacher_user_column_prefs: {
    priority: 907,
    importPath: './repositories/teacherUserColumnPrefsRepository.js',
    fnName: 'replaceTeacherUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllTeacherUserColumnPrefsByWorkspace',
  },
  session_lookups: {
    priority: 35,
    importPath: './repositories/sessionLookupsRepository.js',
    fnName: 'replaceSessionLookupsForWorkspace',
    snapshotFnName: 'listAllSessionLookupsByWorkspace',
  },
  session_field_configs: {
    priority: 35,
    importPath: './repositories/sessionFieldConfigRepository.js',
    fnName: 'replaceSessionFieldConfigsForWorkspace',
    snapshotFnName: 'listAllSessionFieldConfigsByWorkspace',
  },
  session_module_preferences: {
    priority: 35,
    importPath: './repositories/sessionModulePreferencesRepository.js',
    fnName: 'replaceSessionModulePreferencesForWorkspace',
    snapshotFnName: 'listAllSessionModulePreferencesByWorkspace',
  },
  session_user_column_prefs: {
    priority: 908,
    importPath: './repositories/sessionUserColumnPrefsRepository.js',
    fnName: 'replaceSessionUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllSessionUserColumnPrefsByWorkspace',
  },
  user_field_configs: {
    priority: 47,
    importPath: './repositories/userFieldConfigRepository.js',
    fnName: 'replaceUserFieldConfigsForWorkspace',
    snapshotFnName: 'listAllUserFieldConfigsByWorkspace',
  },
  user_module_preferences: {
    priority: 48,
    importPath: './repositories/userModulePreferencesRepository.js',
    fnName: 'replaceUserModulePreferencesForWorkspace',
    snapshotFnName: 'listAllUserModulePreferencesByWorkspace',
  },
  user_user_column_prefs: {
    priority: 911,
    importPath: './repositories/userUserColumnPrefsRepository.js',
    fnName: 'replaceUserUserColumnPrefsForWorkspace',
    snapshotFnName: 'listAllUserUserColumnPrefsByWorkspace',
  },
};
