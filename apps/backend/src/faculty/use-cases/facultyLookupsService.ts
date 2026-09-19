import {
  TEACHER_LOOKUP_KINDS,
  defaultTeacherLookupItems,
  emptyTeacherLookupsMap,
  type TeacherLookupKind,
  type TeacherLookupsMap,
} from '@mms/shared';
import { createModuleStringListLookupsService } from '../../lib/createModuleStringListLookupsService.js';
import {
  listTeacherLookupsByKind,
  listTeacherLookupsByWorkspace,
  replaceTeacherLookupsForKind,
} from '../../db/repositories/facultyLookupsRepository.js';

const stringListLookups = createModuleStringListLookupsService<
  TeacherLookupKind,
  TeacherLookupsMap
>({
  kinds: TEACHER_LOOKUP_KINDS,
  emptyMap: emptyTeacherLookupsMap,
  defaultItems: defaultTeacherLookupItems,
  listByWorkspace: listTeacherLookupsByWorkspace,
  listByKind: listTeacherLookupsByKind,
  replaceForKind: replaceTeacherLookupsForKind,
  broadcastKey: 'teachers',
});

export const loadFacultyLookupsMap = stringListLookups.loadMap;
export const loadTeacherLookupsMap = loadFacultyLookupsMap;

export const replaceFacultyLookupKind = stringListLookups.replaceKind;
export const replaceTeacherLookupKind = replaceFacultyLookupKind;
