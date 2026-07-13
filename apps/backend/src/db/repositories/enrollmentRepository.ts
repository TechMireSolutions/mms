import { type Enrollment } from '@mms/shared';
import { enrollments } from '../schema.js';
import { createGenericRepository } from './genericRepository.js';

const repo = createGenericRepository<Enrollment, typeof enrollments>(enrollments);

export const listEnrollmentsByWorkspace = repo.listByWorkspace;
export const findEnrollmentById = repo.findById;
export const findEnrollmentsByIds = repo.findByIds;
export const saveEnrollment = repo.save;
export const bulkSaveEnrollments = repo.bulkSave;
export const deleteEnrollment = repo.deleteById;
export const replaceEnrollmentsForWorkspace = repo.replaceForWorkspace;
export const deleteEnrollmentsByWorkspace = repo.deleteByWorkspace;
