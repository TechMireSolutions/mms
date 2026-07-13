import { type Teacher } from '@mms/shared';
import { teachers } from '../schema.js';
import { createGenericRepository } from './genericRepository.js';

const repo = createGenericRepository<Teacher, typeof teachers>(teachers);

export const listTeachersByWorkspace = repo.listByWorkspace;
export const findTeacherById = repo.findById;
export const findTeachersByIds = repo.findByIds;
export const saveTeacher = repo.save;
export const bulkSaveTeachers = repo.bulkSave;
export const deleteTeacher = repo.deleteById;
export const replaceTeachersForWorkspace = repo.replaceForWorkspace;
export const deleteTeachersByWorkspace = repo.deleteByWorkspace;
