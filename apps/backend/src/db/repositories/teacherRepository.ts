import { type Teacher } from '@mms/shared';
import { teachers } from '../schema.js';
import { createGenericRepository } from './genericRepository.js';

const repo = createGenericRepository<Teacher, typeof teachers>(teachers, {
  conflictTarget: [teachers.workspaceSubdomain, teachers.id],
  syncDeletedAtColumn: true,
  syncContactIdColumn: true,
  updateStrategy: 'overwrite',
});

export const teacherRowToRecord = repo.rowToRecord;
export const listTeachersByWorkspace = repo.listByWorkspace;
export const findTeacherById = repo.findById;
export const findTeachersByIds = repo.findByIds;
export const saveTeacher = repo.save;
export const bulkSaveTeachers = repo.bulkSave;
export const replaceTeachersForWorkspace = repo.replaceForWorkspace;
