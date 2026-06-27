import {
  DEFAULT_STUDENTS_SETTINGS,
  DEFAULT_TEACHERS_SETTINGS,
  type StudentsSettings,
  type TeachersSettings,
} from './settingsTypes.js';

/** Per-user Work directory column layout (globle1 §3.4). */
export interface ModuleColumnPref {
  key: string;
  enabled: boolean;
  order: number;
}

export interface ModuleColumnRegistryEntry extends ModuleColumnPref {
  label: string;
  fixed?: boolean;
}

export type UserModuleColumnPrefsMap = Record<string, ModuleColumnPref[]>;

export function applyModuleColumnOverlay(
  registry: ModuleColumnRegistryEntry[],
  prefs: ModuleColumnPref[] | null,
): ModuleColumnRegistryEntry[] {
  if (!prefs?.length) return registry;
  const map = new Map(prefs.map((p) => [p.key, p]));
  return registry.map((col) => {
    const pref = map.get(col.key);
    if (!pref) return col;
    return {
      ...col,
      enabled: col.fixed ? col.enabled : pref.enabled,
      order: pref.order,
    };
  });
}

export interface StudentWorkColumnLabels {
  name: string;
  dob: string;
  parents: string;
  sessions: string;
  status: string;
}

/** Builds tenant-default Work column registry for Students (before per-user overlay). */
export function buildStudentWorkColumnRegistry(
  settings: StudentsSettings,
  labels: StudentWorkColumnLabels,
): ModuleColumnRegistryEntry[] {
  const fields = settings.fields ?? DEFAULT_STUDENTS_SETTINGS.fields ?? {};
  const customFields = settings.customFields ?? [];
  const cols: ModuleColumnRegistryEntry[] = [
    { key: 'name', label: labels.name, enabled: true, order: 0, fixed: true },
  ];
  let order = 1;

  if (fields.dob?.enabled !== false) {
    cols.push({ key: 'dob', label: labels.dob, enabled: true, order: order++ });
  }

  const parentsEnabled =
    fields.fatherLink?.enabled !== false ||
    fields.motherLink?.enabled !== false ||
    fields.guardianLink?.enabled !== false;
  if (parentsEnabled) {
    cols.push({ key: 'parents', label: labels.parents, enabled: true, order: order++ });
  }

  cols.push({ key: 'sessions', label: labels.sessions, enabled: true, order: order++ });
  cols.push({ key: 'status', label: labels.status, enabled: true, order: order++ });

  for (const field of customFields) {
    cols.push({
      key: `custom:${field.id}`,
      label: field.label,
      enabled: true,
      order: order++,
    });
  }

  return cols;
}

export function isModuleColumnVisible(
  registry: ModuleColumnRegistryEntry[],
  key: string,
): boolean {
  const col = registry.find((c) => c.key === key);
  return col?.enabled ?? false;
}

export interface TeacherWorkColumnLabels {
  name: string;
  specialization: string;
  qualification: string;
  joinDate: string;
  status: string;
}

/** Builds tenant-default Work column registry for Teachers (before per-user overlay). */
export function buildTeacherWorkColumnRegistry(
  settings: TeachersSettings,
  labels: TeacherWorkColumnLabels,
): ModuleColumnRegistryEntry[] {
  const fields = settings.fields ?? DEFAULT_TEACHERS_SETTINGS.fields ?? {};
  const customFields = settings.customFields ?? [];
  const cols: ModuleColumnRegistryEntry[] = [
    { key: 'name', label: labels.name, enabled: true, order: 0, fixed: true },
  ];
  let order = 1;

  if (fields.specialization?.enabled !== false) {
    cols.push({ key: 'specialization', label: labels.specialization, enabled: true, order: order++ });
  }
  if (fields.qualification?.enabled !== false) {
    cols.push({ key: 'qualification', label: labels.qualification, enabled: true, order: order++ });
  }
  if (fields.joinDate?.enabled !== false) {
    cols.push({ key: 'joinDate', label: labels.joinDate, enabled: true, order: order++ });
  }
  cols.push({ key: 'status', label: labels.status, enabled: true, order: order++ });

  for (const field of customFields) {
    cols.push({
      key: `custom:${field.id}`,
      label: field.label ?? field.id,
      enabled: true,
      order: order++,
    });
  }

  return cols;
}

export interface FinanceInvoiceWorkColumnLabels {
  invoice: string;
  student: string;
  sessionClass: string;
  baseFee: string;
  discount: string;
  final: string;
  status: string;
  dueDate: string;
}

/** Builds tenant-default Work column registry for Finance invoices (before per-user overlay). */
export function buildFinanceInvoiceWorkColumnRegistry(
  labels: FinanceInvoiceWorkColumnLabels,
): ModuleColumnRegistryEntry[] {
  return [
    { key: 'invoice', label: labels.invoice, enabled: true, order: 0, fixed: true },
    { key: 'student', label: labels.student, enabled: true, order: 1 },
    { key: 'sessionClass', label: labels.sessionClass, enabled: true, order: 2 },
    { key: 'baseFee', label: labels.baseFee, enabled: true, order: 3 },
    { key: 'discount', label: labels.discount, enabled: true, order: 4 },
    { key: 'final', label: labels.final, enabled: true, order: 5 },
    { key: 'status', label: labels.status, enabled: true, order: 6 },
    { key: 'dueDate', label: labels.dueDate, enabled: true, order: 7 },
  ];
}

export interface FinancePaymentWorkColumnLabels {
  date: string;
  student: string;
  invoice: string;
  amount: string;
  method: string;
  receivedBy: string;
  note: string;
}

/** Builds tenant-default Work column registry for Finance payments (before per-user overlay). */
export function buildFinancePaymentWorkColumnRegistry(
  labels: FinancePaymentWorkColumnLabels,
): ModuleColumnRegistryEntry[] {
  return [
    { key: 'date', label: labels.date, enabled: true, order: 0, fixed: true },
    { key: 'student', label: labels.student, enabled: true, order: 1 },
    { key: 'invoice', label: labels.invoice, enabled: true, order: 2 },
    { key: 'amount', label: labels.amount, enabled: true, order: 3 },
    { key: 'method', label: labels.method, enabled: true, order: 4 },
    { key: 'receivedBy', label: labels.receivedBy, enabled: true, order: 5 },
    { key: 'note', label: labels.note, enabled: true, order: 6 },
  ];
}

export interface AttendanceWorkColumnLabels {
  date: string;
  class: string;
  student: string;
  status: string;
  timeIn: string;
  timeOut: string;
  notes: string;
}

/** Builds tenant-default Work column registry for Attendance records (before per-user overlay). */
export function buildAttendanceWorkColumnRegistry(
  labels: AttendanceWorkColumnLabels,
): ModuleColumnRegistryEntry[] {
  return [
    { key: 'date', label: labels.date, enabled: true, order: 0, fixed: true },
    { key: 'class', label: labels.class, enabled: true, order: 1 },
    { key: 'student', label: labels.student, enabled: true, order: 2 },
    { key: 'status', label: labels.status, enabled: true, order: 3 },
    { key: 'timeIn', label: labels.timeIn, enabled: true, order: 4 },
    { key: 'timeOut', label: labels.timeOut, enabled: true, order: 5 },
    { key: 'notes', label: labels.notes, enabled: true, order: 6 },
  ];
}

export interface SessionWorkColumnLabels {
  name: string;
  type: string;
  duration: string;
  fee: string;
  enrolled: string;
  status: string;
}

/** Builds tenant-default Work column registry for Sessions list view (before per-user overlay). */
export function buildSessionWorkColumnRegistry(
  labels: SessionWorkColumnLabels,
): ModuleColumnRegistryEntry[] {
  return [
    { key: 'name', label: labels.name, enabled: true, order: 0, fixed: true },
    { key: 'type', label: labels.type, enabled: true, order: 1 },
    { key: 'duration', label: labels.duration, enabled: true, order: 2 },
    { key: 'fee', label: labels.fee, enabled: true, order: 3 },
    { key: 'enrolled', label: labels.enrolled, enabled: true, order: 4 },
    { key: 'status', label: labels.status, enabled: true, order: 5 },
  ];
}

export interface EnrollmentWorkColumnLabels {
  student: string;
  session: string;
  class: string;
  enrolledDate: string;
  finalFee: string;
  status: string;
  payment: string;
}

/** Builds tenant-default Work column registry for Enrollments (before per-user overlay). */
export function buildEnrollmentWorkColumnRegistry(
  labels: EnrollmentWorkColumnLabels,
): ModuleColumnRegistryEntry[] {
  return [
    { key: 'student', label: labels.student, enabled: true, order: 0, fixed: true },
    { key: 'session', label: labels.session, enabled: true, order: 1 },
    { key: 'class', label: labels.class, enabled: true, order: 2 },
    { key: 'enrolledDate', label: labels.enrolledDate, enabled: true, order: 3 },
    { key: 'finalFee', label: labels.finalFee, enabled: true, order: 4 },
    { key: 'status', label: labels.status, enabled: true, order: 5 },
    { key: 'payment', label: labels.payment, enabled: true, order: 6 },
  ];
}

export interface ObligationCollectionWorkColumnLabels {
  receiptNo: string;
  receivedDate: string;
  sender: string;
  obligationType: string;
  repMujtahid: string;
  amount: string;
  paymentMode: string;
}

/** Builds tenant-default Work column registry for Obligation collections (before per-user overlay). */
export function buildObligationCollectionWorkColumnRegistry(
  labels: ObligationCollectionWorkColumnLabels,
): ModuleColumnRegistryEntry[] {
  return [
    { key: 'receiptNo', label: labels.receiptNo, enabled: true, order: 0, fixed: true },
    { key: 'receivedDate', label: labels.receivedDate, enabled: true, order: 1 },
    { key: 'sender', label: labels.sender, enabled: true, order: 2 },
    { key: 'obligationType', label: labels.obligationType, enabled: true, order: 3 },
    { key: 'repMujtahid', label: labels.repMujtahid, enabled: true, order: 4 },
    { key: 'amount', label: labels.amount, enabled: true, order: 5 },
    { key: 'paymentMode', label: labels.paymentMode, enabled: true, order: 6 },
  ];
}

export interface AccountingJournalWorkColumnLabels {
  ref: string;
  date: string;
  description: string;
  tags: string;
  debit: string;
  credit: string;
  status: string;
}

/** Builds tenant-default Work column registry for Accounting journal entries. */
export function buildAccountingJournalWorkColumnRegistry(
  labels: AccountingJournalWorkColumnLabels,
): ModuleColumnRegistryEntry[] {
  return [
    { key: 'ref', label: labels.ref, enabled: true, order: 0, fixed: true },
    { key: 'date', label: labels.date, enabled: true, order: 1 },
    { key: 'description', label: labels.description, enabled: true, order: 2 },
    { key: 'tags', label: labels.tags, enabled: true, order: 3 },
    { key: 'debit', label: labels.debit, enabled: true, order: 4 },
    { key: 'credit', label: labels.credit, enabled: true, order: 5 },
    { key: 'status', label: labels.status, enabled: true, order: 6 },
  ];
}

export interface AccountingAccountWorkColumnLabels {
  code: string;
  name: string;
  subtype: string;
  description: string;
  normalBalance: string;
}

/** Builds tenant-default Work column registry for Chart of Accounts. */
export function buildAccountingAccountWorkColumnRegistry(
  labels: AccountingAccountWorkColumnLabels,
): ModuleColumnRegistryEntry[] {
  return [
    { key: 'code', label: labels.code, enabled: true, order: 0, fixed: true },
    { key: 'name', label: labels.name, enabled: true, order: 1 },
    { key: 'subtype', label: labels.subtype, enabled: true, order: 2 },
    { key: 'description', label: labels.description, enabled: true, order: 3 },
    { key: 'normalBalance', label: labels.normalBalance, enabled: true, order: 4 },
  ];
}

export interface HasanatDistributionWorkColumnLabels {
  card: string;
  recipient: string;
  recipientClass: string;
  quantity: string;
  reason: string;
  issuedDate: string;
  issuedBy: string;
  status: string;
}

/** Builds tenant-default Work column registry for Hasanat distributions. */
export function buildHasanatDistributionWorkColumnRegistry(
  labels: HasanatDistributionWorkColumnLabels,
): ModuleColumnRegistryEntry[] {
  return [
    { key: 'card', label: labels.card, enabled: true, order: 0, fixed: true },
    { key: 'recipient', label: labels.recipient, enabled: true, order: 1 },
    { key: 'recipientClass', label: labels.recipientClass, enabled: true, order: 2 },
    { key: 'quantity', label: labels.quantity, enabled: true, order: 3 },
    { key: 'reason', label: labels.reason, enabled: true, order: 4 },
    { key: 'issuedDate', label: labels.issuedDate, enabled: true, order: 5 },
    { key: 'issuedBy', label: labels.issuedBy, enabled: true, order: 6 },
    { key: 'status', label: labels.status, enabled: true, order: 7 },
  ];
}

export interface HasanatRedemptionWorkColumnLabels {
  student: string;
  reward: string;
  pointsUsed: string;
  date: string;
  approvedBy: string;
}

/** Builds tenant-default Work column registry for Hasanat redemptions. */
export function buildHasanatRedemptionWorkColumnRegistry(
  labels: HasanatRedemptionWorkColumnLabels,
): ModuleColumnRegistryEntry[] {
  return [
    { key: 'student', label: labels.student, enabled: true, order: 0, fixed: true },
    { key: 'reward', label: labels.reward, enabled: true, order: 1 },
    { key: 'pointsUsed', label: labels.pointsUsed, enabled: true, order: 2 },
    { key: 'date', label: labels.date, enabled: true, order: 3 },
    { key: 'approvedBy', label: labels.approvedBy, enabled: true, order: 4 },
  ];
}

export interface ExaminationExamWorkColumnLabels {
  name: string;
  subject: string;
  date: string;
  duration: string;
  status: string;
  totalMarks: string;
  passingMarks: string;
  classes: string;
}

/** Builds tenant-default Work column registry for Examinations exam directory (list view). */
export function buildExaminationExamWorkColumnRegistry(
  labels: ExaminationExamWorkColumnLabels,
): ModuleColumnRegistryEntry[] {
  return [
    { key: 'name', label: labels.name, enabled: true, order: 0, fixed: true },
    { key: 'subject', label: labels.subject, enabled: true, order: 1 },
    { key: 'date', label: labels.date, enabled: true, order: 2 },
    { key: 'duration', label: labels.duration, enabled: true, order: 3 },
    { key: 'status', label: labels.status, enabled: true, order: 4 },
    { key: 'totalMarks', label: labels.totalMarks, enabled: true, order: 5 },
    { key: 'passingMarks', label: labels.passingMarks, enabled: true, order: 6 },
    { key: 'classes', label: labels.classes, enabled: true, order: 7 },
  ];
}

export interface ExaminationResultsWorkColumnLabels {
  rank: string;
  student: string;
  classRoll: string;
  marks: string;
  percentage: string;
  grade: string;
  passFail: string;
}

/** Builds tenant-default Work column registry for Examinations results rankings. */
export function buildExaminationResultsWorkColumnRegistry(
  labels: ExaminationResultsWorkColumnLabels,
): ModuleColumnRegistryEntry[] {
  return [
    { key: 'rank', label: labels.rank, enabled: true, order: 0, fixed: true },
    { key: 'student', label: labels.student, enabled: true, order: 1 },
    { key: 'classRoll', label: labels.classRoll, enabled: true, order: 2 },
    { key: 'marks', label: labels.marks, enabled: true, order: 3 },
    { key: 'percentage', label: labels.percentage, enabled: true, order: 4 },
    { key: 'grade', label: labels.grade, enabled: true, order: 5 },
    { key: 'passFail', label: labels.passFail, enabled: true, order: 6 },
  ];
}

export interface QuestionBankWorkColumnLabels {
  text: string;
  category: string;
  language: string;
  type: string;
  difficulty: string;
  source: string;
}

/** Builds tenant-default Work column registry for Question Bank directory (list view). */
export function buildQuestionBankWorkColumnRegistry(
  labels: QuestionBankWorkColumnLabels,
): ModuleColumnRegistryEntry[] {
  return [
    { key: 'text', label: labels.text, enabled: true, order: 0, fixed: true },
    { key: 'category', label: labels.category, enabled: true, order: 1 },
    { key: 'language', label: labels.language, enabled: true, order: 2 },
    { key: 'type', label: labels.type, enabled: true, order: 3 },
    { key: 'difficulty', label: labels.difficulty, enabled: true, order: 4 },
    { key: 'source', label: labels.source, enabled: true, order: 5 },
  ];
}
