import { type Exam, type ExamResult } from '@mms/shared';
import { exams, examResults } from '../schema.js';
import { createGenericRepository } from './genericRepository.js';

const examsRepo = createGenericRepository<Exam, typeof exams>(exams, { updateStrategy: 'overwrite' });
const resultsRepo = createGenericRepository<ExamResult, typeof examResults>(examResults, { updateStrategy: 'overwrite' });

export const listExamsByWorkspace = examsRepo.listByWorkspace;
export const findExamById = examsRepo.findById;
export const saveExam = examsRepo.save;
export const replaceExamsForWorkspace = examsRepo.replaceForWorkspace;

export const listExamResultsByWorkspace = resultsRepo.listByWorkspace;
export const findExamResultById = resultsRepo.findById;
export const saveExamResult = resultsRepo.save;
export const replaceExamResultsForWorkspace = resultsRepo.replaceForWorkspace;

export async function deleteExaminationsByWorkspace(workspaceSubdomain: string): Promise<void> {
  await examsRepo.deleteByWorkspace(workspaceSubdomain);
  await resultsRepo.deleteByWorkspace(workspaceSubdomain);
}
