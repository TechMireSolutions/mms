import type { Exam, ExamResult } from '@mms/shared';
export type { Exam, ExamResult };

export interface ExamClass {
  id: string;
  name: string;
  teacher: string;
  students: string[];
}

export interface ExamStudent {
  id: string;
  name: string;
  classId: string;
  rollNo: string;
}

export const EXAMS: Exam[] = [];
export const EXAM_RESULTS: ExamResult[] = [];
export const CLASSES: ExamClass[] = [];
export const STUDENTS: ExamStudent[] = [];
