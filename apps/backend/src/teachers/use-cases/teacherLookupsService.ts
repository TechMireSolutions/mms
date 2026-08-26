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
} from '../../db/repositories/teacherLookupsRepository.js';

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

export const loadTeacherLookupsMap = stringListLookups.loadMap;
export const replaceTeacherLookupKind = stringListLookups.replaceKind;
