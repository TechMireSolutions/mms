export interface Exam {
  id: string;
  name: string;
  subject: string;
  totalMarks: number;
  passingMarks: number;
  date: string;
  duration: number;
  classIds: string[];
  status: "completed" | "scheduled" | "cancelled" | "upcoming" | "ongoing";
  description: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  marksObtained: number;
}

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
