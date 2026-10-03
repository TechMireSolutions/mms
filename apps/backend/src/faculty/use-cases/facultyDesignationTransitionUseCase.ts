import type { FacultyDesignationTransitionWrite } from '@mms/shared';
import { transitionFacultyDesignation } from '../../db/repositories/facultyDesignationTransitionRepository.js';

export function transitionDesignation(
  tenant: string,
  facultyId: string,
  input: FacultyDesignationTransitionWrite,
  transition = transitionFacultyDesignation,
) {
  return transition(tenant, facultyId, input);
}
