import type { ContactLike, NamedEntity } from '@mms/shared';
import {
  hydrateActivityLog,
  hydrateAssessmentResult,
  hydrateHasanatDistribution,
  hydrateHasanatPayout,
  hydrateHasanatRedemption,
  hydrateSessionClasses,
  hydrateSessionsCollection,
  hydrateStudentFromContacts,
  hydrateStudentLinkedRows,
  hydrateTeacherFromContact,
  hydrateUserActorField,
  hydrateWorkspaceUserProfile,
  normalizeActivityLog,
  normalizeAssessmentResult,
  normalizeHasanatDistribution,
  normalizeHasanatPayout,
  normalizeHasanatRedemption,
  normalizeSessionClasses,
  normalizeSessionsCollection,
  normalizeStoredStudent,
  normalizeStoredTeacher,
  normalizeStudentLinkedRows,
  normalizeUserActorField,
  stripWorkspaceUserProfileFields,
  type HasanatDistributionLike,
  type SessionLike,
} from '@mms/shared';

type Row = Record<string, unknown>;

function asNamed(rows: Row[]): NamedEntity[] {
  return rows.map((row) => ({
    id: row.id as string | number,
    name: row.name as string | undefined,
  }));
}

function withUserActor(
  row: Row,
  userIdField: string,
  labelField: string,
  users: NamedEntity[],
  hydrate: boolean,
): Row {
  return hydrate
    ? hydrateUserActorField(row, userIdField, labelField, users)
    : normalizeUserActorField(row, userIdField, labelField);
}

export function normalizeCollectionRows(key: string, rows: Row[]): Row[] {
  if (!rows || !Array.isArray(rows)) return [];
  switch (key) {
    case 'students':
      return rows.map((row) => normalizeStoredStudent(row));
    case 'teachers':
      return rows.map((row) => normalizeStoredTeacher(row));
    case 'enrollments':
    case 'attendance_records':
    case 'finance_invoices':
      return normalizeStudentLinkedRows(rows);
    case 'finance_payments':
      return normalizeStudentLinkedRows(rows, 'studentId', 'studentName').map((row) =>
        normalizeUserActorField(row, 'receivedByUserId', 'receivedBy'),
      );
    case 'sessions':
      return normalizeSessionsCollection(rows as SessionLike[]) as Row[];
    case 'users':
      return rows.map((row) => stripWorkspaceUserProfileFields(row));
    case 'user_activity_logs':
      return rows.map((row) => normalizeActivityLog(row));
    case 'hasanat_distributions':
      return rows.map((row) =>
        normalizeUserActorField(
          normalizeHasanatDistribution(row as HasanatDistributionLike),
          'issuedByUserId',
          'issuedBy',
        ),
      );
    case 'hasanat_redemptions':
      return rows.map((row) =>
        normalizeUserActorField(normalizeHasanatRedemption(row), 'approvedByUserId', 'approvedBy'),
      );
    case 'hasanat_batches':
      return rows.map((row) => normalizeUserActorField(row, 'addedByUserId', 'addedBy'));
    case 'assessment_results':
    case 'exam_results':
      return rows.map((row) => normalizeAssessmentResult(row));
    case 'hasanat_payouts':
      return rows.map((row) =>
        normalizeUserActorField(normalizeHasanatPayout(row), 'approvedByUserId', 'approvedBy'),
      );
    default:
      return rows;
  }
}

export function hydrateCollectionRows(
  key: string,
  rows: Row[],
  context: {
    contacts: ContactLike[];
    students: Row[];
    teachers: Row[];
    users: Row[];
    distributions: Row[];
  },
): Row[] {
  if (!rows || !Array.isArray(rows)) return [];
  const contacts = context.contacts;
  const students = asNamed(context.students);
  const teachers = asNamed(context.teachers);
  const users = asNamed(context.users);
  const distributions = context.distributions as HasanatDistributionLike[];

  switch (key) {
    case 'students':
      return rows.map((row) => hydrateStudentFromContacts(row as never, contacts)) as Row[];
    case 'teachers':
      return rows.map((row) => hydrateTeacherFromContact(row as never, contacts)) as Row[];
    case 'enrollments':
    case 'attendance_records':
    case 'finance_invoices':
      return hydrateStudentLinkedRows(rows, students);
    case 'finance_payments':
      return hydrateStudentLinkedRows(rows, students, 'studentId', 'studentName').map((row) =>
        withUserActor(row, 'receivedByUserId', 'receivedBy', users, true),
      );
    case 'sessions':
      return hydrateSessionsCollection(rows as SessionLike[], teachers) as Row[];
    case 'users':
      return rows.map((row) => hydrateWorkspaceUserProfile(row, contacts));
    case 'user_activity_logs':
      return rows.map((row) => hydrateActivityLog(row, users));
    case 'hasanat_distributions':
      return rows.map((row) =>
        withUserActor(
          hydrateHasanatDistribution(row as HasanatDistributionLike, students, teachers),
          'issuedByUserId',
          'issuedBy',
          users,
          true,
        ),
      );
    case 'hasanat_redemptions':
      return rows.map((row) =>
        withUserActor(hydrateHasanatRedemption(row, distributions), 'approvedByUserId', 'approvedBy', users, true),
      );
    case 'hasanat_batches':
      return rows.map((row) => withUserActor(row, 'addedByUserId', 'addedBy', users, true));
    case 'assessment_results':
    case 'exam_results':
      return rows.map((row) => hydrateAssessmentResult(row, students));
    case 'hasanat_payouts':
      return rows.map((row) =>
        withUserActor(hydrateHasanatPayout(row, students), 'approvedByUserId', 'approvedBy', users, true),
      );
    default:
      return rows;
  }
}

export function hydrateSessionRowClasses(classes: Row[], teachers: Row[]): Row[] {
  return hydrateSessionClasses(classes, asNamed(teachers)) as Row[];
}

export function normalizeSessionRowClasses(classes: Row[]): Row[] {
  return normalizeSessionClasses(classes) as Row[];
}
