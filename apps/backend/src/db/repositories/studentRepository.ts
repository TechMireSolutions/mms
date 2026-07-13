import { type Student } from '@mms/shared';
import { students } from '../schema.js';
import { createGenericRepository } from './genericRepository.js';

const repo = createGenericRepository<Student, typeof students>(students);

export const listStudentsByWorkspace = repo.listByWorkspace;
export const findStudentById = repo.findById;
export const findStudentsByIds = repo.findByIds;
export const saveStudent = repo.save;
export const bulkSaveStudents = repo.bulkSave;
export const deleteStudent = repo.deleteById;
export const replaceStudentsForWorkspace = repo.replaceForWorkspace;
export const deleteStudentsByWorkspace = repo.deleteByWorkspace;
