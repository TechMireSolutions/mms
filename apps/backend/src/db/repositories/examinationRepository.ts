export {
  examRowToRecord,
  listExamsByWorkspace,
  findExamById,
  findExamsByIds,
  saveExam,
  bulkSaveExams,
  replaceExamsForWorkspace,
} from './examinationExamsRepository.js';
export {
  listExamResultsByWorkspace,
  findExamResultById,
  findExamResultsByIds,
  saveExamResult,
  bulkSaveExamResults,
  replaceExamResultsForWorkspace,
  deleteExaminationsByWorkspace,
} from './examinationResultsRepository.js';
