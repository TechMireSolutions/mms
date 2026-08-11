import { type Student } from '@mms/shared';
import { students } from '../schema.js';
import { createGenericRepository } from './genericRepository.js';

const repo = createGenericRepository<Student, typeof students>(students, {
  conflictTarget: [students.workspaceSubdomain, students.id],
  syncDeletedAtColumn: true,
  syncContactIdColumn: true,
  syncStatusColumn: true,
  syncGrNumberColumn: true,
  updateStrategy: 'overwrite',
});

export const studentRowToRecord = repo.rowToRecord;
export const listStudentsByWorkspace = repo.listByWorkspace;
export const findStudentById = repo.findById;
export const findStudentsByIds = repo.findByIds;
export const saveStudent = repo.save;
export const bulkSaveStudents = repo.bulkSave;
export const replaceStudentsForWorkspace = repo.replaceForWorkspace;
export const countStudentsByWorkspace = repo.countByWorkspace;
