import {
  DEFAULT_STUDENTS_SETTINGS,
  DEFAULT_TEACHERS_SETTINGS,
  type StudentsSettings,
  type TeachersSettings,
} from './settingsTypes.js';

/** Per-user Work directory column layout (globle1 §3.4). */
export interface ModuleColumnPreference {
  key: string;
  enabled: boolean;
  order: number;
  /** Optional pixel width when the user has resized the column. */
  width?: number;
}

export type ModuleColumnPref = ModuleColumnPreference;

export interface ModuleColumnRegistryEntry extends ModuleColumnPreference {
  label: string;
  fixed?: boolean;
}

export type UserModuleColumnPreferencesMap = Record<string, ModuleColumnPreference[]>;

export const MODULE_COLUMN_WIDTH_MIN = 80;
export const MODULE_COLUMN_WIDTH_MAX = 640;

/** Clamp a user-resized column width to the supported range. */
export function clampModuleColumnWidth(width: number): number {
  if (!Number.isFinite(width)) return MODULE_COLUMN_WIDTH_MIN;
  return Math.min(MODULE_COLUMN_WIDTH_MAX, Math.max(MODULE_COLUMN_WIDTH_MIN, Math.round(width)));
}

export function applyModuleColumnOverlay(
  registry: ModuleColumnRegistryEntry[],
  preferences: ModuleColumnPreference[] | null,
): ModuleColumnRegistryEntry[] {
  if (!preferences?.length) return registry;
  const preferenceByKey = new Map(preferences.map((preference) => [preference.key, preference]));
  return registry.map((column) => {
    const preference = preferenceByKey.get(column.key);
    if (!preference) return column;
    return {
      ...column,
      enabled: column.fixed ? column.enabled : preference.enabled,
      order: preference.order,
      width: preference.width ?? column.width,
    };
  });
}

/** Resolve stored pixel width for a Work column key. */
export function getModuleColumnWidth(
  registry: ModuleColumnRegistryEntry[],
  key: string,
): number | undefined {
  const column = registry.find((registryColumn) => registryColumn.key === key);
  return typeof column?.width === 'number' ? column.width : undefined;
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
  const fields = (settings.fields ?? DEFAULT_STUDENTS_SETTINGS.fields ?? {}) as Record<string, { enabled?: boolean }>;
  const customFields = settings.customFields ?? [];
  const registryColumns: ModuleColumnRegistryEntry[] = [
    { key: 'name', label: labels.name, enabled: true, order: 0, fixed: true },
  ];
  let order = 1;

  if (fields.dob?.enabled !== false) {
    registryColumns.push({ key: 'dob', label: labels.dob, enabled: true, order: order++ });
  }

  const parentsEnabled =
    fields.fatherLink?.enabled !== false ||
    fields.motherLink?.enabled !== false ||
    fields.guardianLink?.enabled !== false;
  if (parentsEnabled) {
    registryColumns.push({ key: 'parents', label: labels.parents, enabled: true, order: order++ });
  }

  registryColumns.push({ key: 'sessions', label: labels.sessions, enabled: true, order: order++ });
  registryColumns.push({ key: 'status', label: labels.status, enabled: true, order: order++ });

  for (const field of customFields) {
    registryColumns.push({
      key: `custom:${field.id}`,
      label: field.label,
      enabled: true,
      order: order++,
    });
  }

  return registryColumns;
}

export function isModuleColumnVisible(
  registry: ModuleColumnRegistryEntry[],
  key: string,
): boolean {
  const column = registry.find((registryColumn) => registryColumn.key === key);
  return column?.enabled ?? false;
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
  const fields = (settings.fields ?? DEFAULT_TEACHERS_SETTINGS.fields ?? {}) as Record<string, { enabled?: boolean }>;
  const customFields = settings.customFields ?? [];
  const registryColumns: ModuleColumnRegistryEntry[] = [
    { key: 'name', label: labels.name, enabled: true, order: 0, fixed: true },
  ];
  let order = 1;

  if (fields.specialization?.enabled !== false) {
    registryColumns.push({ key: 'specialization', label: labels.specialization, enabled: true, order: order++ });
  }
  if (fields.qualification?.enabled !== false) {
    registryColumns.push({ key: 'qualification', label: labels.qualification, enabled: true, order: order++ });
  }
  if (fields.joinDate?.enabled !== false) {
    registryColumns.push({ key: 'joinDate', label: labels.joinDate, enabled: true, order: order++ });
  }
  registryColumns.push({ key: 'status', label: labels.status, enabled: true, order: order++ });

  for (const field of customFields) {
    registryColumns.push({
      key: `custom:${field.id}`,
      label: field.label ?? field.id,
      enabled: true,
      order: order++,
    });
  }

  return registryColumns;
}

/** Helper to build a standard module column registry array from an ordered list of keys and labels. */
export function createColumnRegistry<T extends object>(
  keys: (keyof T & string)[],
  labels: T,
  fixedFirst = true,
): ModuleColumnRegistryEntry[] {
  return keys.map((key, index) => ({
    key,
    label: String(labels[key as keyof T] ?? ''),
    enabled: true,
    order: index,
    ...(index === 0 && fixedFirst ? { fixed: true } : {}),
  }));
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
  return createColumnRegistry(
    ['invoice', 'student', 'sessionClass', 'baseFee', 'discount', 'final', 'status', 'dueDate'],
    labels,
  );
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
  return createColumnRegistry(
    ['date', 'student', 'invoice', 'amount', 'method', 'receivedBy', 'note'],
    labels,
  );
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
  return createColumnRegistry(
    ['date', 'class', 'student', 'status', 'timeIn', 'timeOut', 'notes'],
    labels,
  );
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
  return createColumnRegistry(
    ['name', 'type', 'duration', 'fee', 'enrolled', 'status'],
    labels,
  );
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
  return createColumnRegistry(
    ['student', 'session', 'class', 'enrolledDate', 'finalFee', 'status', 'payment'],
    labels,
  );
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
  return createColumnRegistry(
    ['receiptNo', 'receivedDate', 'sender', 'obligationType', 'repMujtahid', 'amount', 'paymentMode'],
    labels,
  );
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
  return createColumnRegistry(
    ['ref', 'date', 'description', 'tags', 'debit', 'credit', 'status'],
    labels,
  );
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
  return createColumnRegistry(
    ['code', 'name', 'subtype', 'description', 'normalBalance'],
    labels,
  );
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
  return createColumnRegistry(
    ['card', 'recipient', 'recipientClass', 'quantity', 'reason', 'issuedDate', 'issuedBy', 'status'],
    labels,
  );
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
  return createColumnRegistry(
    ['student', 'reward', 'pointsUsed', 'date', 'approvedBy'],
    labels,
  );
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
  return createColumnRegistry(
    ['name', 'subject', 'date', 'duration', 'status', 'totalMarks', 'passingMarks', 'classes'],
    labels,
  );
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
  return createColumnRegistry(
    ['rank', 'student', 'classRoll', 'marks', 'percentage', 'grade', 'passFail'],
    labels,
  );
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
  return createColumnRegistry(
    ['text', 'category', 'language', 'type', 'difficulty', 'source'],
    labels,
  );
}

export interface UsersWorkColumnLabels {
  user: string;
  role: string;
  status: string;
  lastLogin: string;
  created: string;
  twoFactor: string;
}

/** Builds tenant-default Work column registry for Users directory. */
export function buildUsersWorkColumnRegistry(
  labels: UsersWorkColumnLabels,
): ModuleColumnRegistryEntry[] {
  return createColumnRegistry(
    ['user', 'role', 'status', 'lastLogin', 'created', 'twoFactor'],
    labels,
  );
}

export interface UsersActivityWorkColumnLabels {
  time: string;
  user: string;
  action: string;
  detail: string;
  ip: string;
}

/** Builds tenant-default Work column registry for Users activity log. */
export function buildUsersActivityWorkColumnRegistry(
  labels: UsersActivityWorkColumnLabels,
): ModuleColumnRegistryEntry[] {
  return createColumnRegistry(
    ['time', 'user', 'action', 'detail', 'ip'],
    labels,
  );
}

export interface MessagingRecipientsWorkColumnLabels {
  recipient: string;
  phone: string;
  email: string;
}

/** Builds tenant-default Work column registry for Messaging compose recipient picker. */
export function buildMessagingRecipientsWorkColumnRegistry(
  labels: MessagingRecipientsWorkColumnLabels,
): ModuleColumnRegistryEntry[] {
  return createColumnRegistry(
    ['recipient', 'phone', 'email'],
    labels,
  );
}

export interface MessagingHistoryWorkColumnLabels {
  recipient: string;
  channel: string;
  body: string;
  dateSent: string;
}

/** Builds tenant-default Work column registry for Messaging sent history. */
export function buildMessagingHistoryWorkColumnRegistry(
  labels: MessagingHistoryWorkColumnLabels,
): ModuleColumnRegistryEntry[] {
  return createColumnRegistry(
    ['recipient', 'channel', 'body', 'dateSent'],
    labels,
  );
}

export interface MessagingTemplatesWorkColumnLabels {
  label: string;
  category: string;
  body: string;
}

/** Builds tenant-default Work column registry for Messaging templates setup table. */
export function buildMessagingTemplatesWorkColumnRegistry(
  labels: MessagingTemplatesWorkColumnLabels,
): ModuleColumnRegistryEntry[] {
  return createColumnRegistry(
    ['label', 'category', 'body'],
    labels,
  );
}
