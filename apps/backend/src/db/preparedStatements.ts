import { and, eq, sql } from 'drizzle-orm';
import { tenantUsers, contacts, students, sessions } from './schema.js';
import { getRootDb } from './dbConnection.js';

let preparedTenantUserById: any = null;
let preparedContactById: any = null;
let preparedStudentById: any = null;
let preparedSessionById: any = null;

export function resetPreparedStatements(): void {
  preparedTenantUserById = null;
  preparedContactById = null;
  preparedStudentById = null;
  preparedSessionById = null;
}

export const preparedTenantUserColumns = {
  id: tenantUsers.id,
  workspaceSubdomain: tenantUsers.workspaceSubdomain,
  loginEmail: tenantUsers.loginEmail,
  passwordHash: tenantUsers.passwordHash,
  name: tenantUsers.name,
  role: tenantUsers.role,
  contactId: tenantUsers.contactId,
  emailVerifiedAt: tenantUsers.emailVerifiedAt,
  pendingLoginEmail: tenantUsers.pendingLoginEmail,
  mustChangePassword: tenantUsers.mustChangePassword,
  createdAt: tenantUsers.createdAt,
  updatedAt: tenantUsers.updatedAt,
  deletedAt: tenantUsers.deletedAt,
  deletedBy: tenantUsers.deletedBy,
  deletionReason: tenantUsers.deletionReason,
  restoredAt: tenantUsers.restoredAt,
  restoredBy: tenantUsers.restoredBy,
  deletedWithCascade: tenantUsers.deletedWithCascade,
  profileJson: tenantUsers.profileJson,
};

export const preparedContactColumns = {
  id: contacts.id,
  workspaceSubdomain: contacts.workspaceSubdomain,
  firstName: contacts.firstName,
  lastName: contacts.lastName,
  name: contacts.name,
  gender: contacts.gender,
  dob: contacts.dob,
  cnic: contacts.cnic,
  isSyed: contacts.isSyed,
  avatar: contacts.avatar,
  notes: contacts.notes,
  whatsappStatus: contacts.whatsappStatus,
  lastCheckedAt: contacts.lastCheckedAt,
  aiSummary: contacts.aiSummary,
  deletedAt: contacts.deletedAt,
  deletedBy: contacts.deletedBy,
  deletionReason: contacts.deletionReason,
  restoredAt: contacts.restoredAt,
  restoredBy: contacts.restoredBy,
  deletedWithCascade: contacts.deletedWithCascade,
  createdAt: contacts.createdAt,
  updatedAt: contacts.updatedAt,
  createdBy: contacts.createdBy,
  updatedBy: contacts.updatedBy,
};

export const preparedStudentColumns = {
  id: students.id,
  workspaceSubdomain: students.workspaceSubdomain,
  contactId: students.contactId,
  fatherContactId: students.fatherContactId,
  motherContactId: students.motherContactId,
  guardianContactId: students.guardianContactId,
  fatherName: students.fatherName,
  motherName: students.motherName,
  guardianName: students.guardianName,
  grNumber: students.grNumber,
  studentId: students.studentId,
  status: students.status,
  registeredDate: students.registeredDate,
  enrollmentDate: students.enrollmentDate,
  discountType: students.discountType,
  discountPct: students.discountPct,
  registrationType: students.registrationType,
  notes: students.notes,
  deletedAt: students.deletedAt,
  deletedBy: students.deletedBy,
  deletionReason: students.deletionReason,
  restoredAt: students.restoredAt,
  restoredBy: students.restoredBy,
  deletedWithCascade: students.deletedWithCascade,
  createdAt: students.createdAt,
  updatedAt: students.updatedAt,
  createdBy: students.createdBy,
  updatedBy: students.updatedBy,
};

export const preparedSessionColumns = {
  id: sessions.id,
  workspaceSubdomain: sessions.workspaceSubdomain,
  name: sessions.name,
  type: sessions.type,
  status: sessions.status,
  startDate: sessions.startDate,
  endDate: sessions.endDate,
  baseFee: sessions.baseFee,
  currency: sessions.currency,
  description: sessions.description,
  deletedAt: sessions.deletedAt,
  deletedBy: sessions.deletedBy,
  deletionReason: sessions.deletionReason,
  restoredAt: sessions.restoredAt,
  restoredBy: sessions.restoredBy,
  deletedWithCascade: sessions.deletedWithCascade,
  createdAt: sessions.createdAt,
  updatedAt: sessions.updatedAt,
};

/**
 * Hot read path: fetch tenant user by workspace and id with compiled PostgreSQL prepared statement.
 */
export function getPreparedTenantUserById(client?: any) {
  if (client) {
    if (typeof client.select === 'function') {
      try {
        const q = client
          .select(preparedTenantUserColumns)
          .from(tenantUsers)
          .where(
            and(
              eq(tenantUsers.workspaceSubdomain, sql.placeholder('subdomain')),
              eq(tenantUsers.id, sql.placeholder('id')),
            ),
          );
        if (typeof q?.limit === 'function') {
          const limited = q.limit(1);
          if (typeof limited?.prepare === 'function') {
            return limited.prepare('prepared_find_tenant_user_by_id');
          }
        }
      } catch {
        // Mock db in unit tests without prepare support
      }
    }
    return null;
  }
  if (!preparedTenantUserById) {
    const db = getRootDb();
    preparedTenantUserById = db
      .select(preparedTenantUserColumns)
      .from(tenantUsers)
      .where(
        and(
          eq(tenantUsers.workspaceSubdomain, sql.placeholder('subdomain')),
          eq(tenantUsers.id, sql.placeholder('id')),
        ),
      )
      .limit(1)
      .prepare('prepared_find_tenant_user_by_id');
  }
  return preparedTenantUserById;
}

/**
 * Hot read path: fetch active contact by workspace and id with compiled prepared statement.
 */
export function getPreparedContactById(client?: any) {
  if (client) {
    if (typeof client.select === 'function') {
      try {
        const q = client
          .select(preparedContactColumns)
          .from(contacts)
          .where(
            and(
              eq(contacts.workspaceSubdomain, sql.placeholder('subdomain')),
              eq(contacts.id, sql.placeholder('id')),
            ),
          );
        if (typeof q?.limit === 'function') {
          const limited = q.limit(1);
          if (typeof limited?.prepare === 'function') {
            return limited.prepare('prepared_find_contact_by_id');
          }
        }
      } catch {
        // Mock db in unit tests without prepare support
      }
    }
    return null;
  }
  if (!preparedContactById) {
    const db = getRootDb();
    preparedContactById = db
      .select(preparedContactColumns)
      .from(contacts)
      .where(
        and(
          eq(contacts.workspaceSubdomain, sql.placeholder('subdomain')),
          eq(contacts.id, sql.placeholder('id')),
        ),
      )
      .limit(1)
      .prepare('prepared_find_contact_by_id');
  }
  return preparedContactById;
}

/**
 * Hot read path: fetch active student by workspace and id with compiled prepared statement.
 */
export function getPreparedStudentById(client?: any) {
  if (client) {
    if (typeof client.select === 'function') {
      try {
        const q = client
          .select(preparedStudentColumns)
          .from(students)
          .where(
            and(
              eq(students.workspaceSubdomain, sql.placeholder('subdomain')),
              eq(students.id, sql.placeholder('id')),
            ),
          );
        if (typeof q?.limit === 'function') {
          const limited = q.limit(1);
          if (typeof limited?.prepare === 'function') {
            return limited.prepare('prepared_find_student_by_id');
          }
        }
      } catch {
        // Mock db in unit tests without prepare support
      }
    }
    return null;
  }
  if (!preparedStudentById) {
    const db = getRootDb();
    preparedStudentById = db
      .select(preparedStudentColumns)
      .from(students)
      .where(
        and(
          eq(students.workspaceSubdomain, sql.placeholder('subdomain')),
          eq(students.id, sql.placeholder('id')),
        ),
      )
      .limit(1)
      .prepare('prepared_find_student_by_id');
  }
  return preparedStudentById;
}

/**
 * Hot read path: fetch active session by workspace and id with compiled prepared statement.
 */
export function getPreparedSessionById(client?: any) {
  if (client) {
    if (typeof client.select === 'function') {
      try {
        const q = client
          .select(preparedSessionColumns)
          .from(sessions)
          .where(
            and(
              eq(sessions.workspaceSubdomain, sql.placeholder('subdomain')),
              eq(sessions.id, sql.placeholder('id')),
            ),
          );
        if (typeof q?.limit === 'function') {
          const limited = q.limit(1);
          if (typeof limited?.prepare === 'function') {
            return limited.prepare('prepared_find_session_by_id');
          }
        }
      } catch {
        // Mock db in unit tests without prepare support
      }
    }
    return null;
  }
  if (!preparedSessionById) {
    const db = getRootDb();
    preparedSessionById = db
      .select(preparedSessionColumns)
      .from(sessions)
      .where(
        and(
          eq(sessions.workspaceSubdomain, sql.placeholder('subdomain')),
          eq(sessions.id, sql.placeholder('id')),
        ),
      )
      .limit(1)
      .prepare('prepared_find_session_by_id');
  }
  return preparedSessionById;
}

/**
 * Helper to execute prepared tenant user lookup with parameter binding.
 */
export async function executePreparedTenantUserLookup(subdomain: string, id: string) {
  const stmt = getPreparedTenantUserById();
  return stmt.execute({ subdomain, id });
}

/**
 * Helper to execute prepared contact lookup with parameter binding.
 */
export async function executePreparedContactLookup(subdomain: string, id: string) {
  const stmt = getPreparedContactById();
  return stmt.execute({ subdomain, id });
}

/**
 * Helper to execute prepared student lookup with parameter binding.
 */
export async function executePreparedStudentLookup(subdomain: string, id: string) {
  const stmt = getPreparedStudentById();
  return stmt.execute({ subdomain, id });
}

/**
 * Helper to execute prepared session lookup with parameter binding.
 */
export async function executePreparedSessionLookup(subdomain: string, id: string) {
  const stmt = getPreparedSessionById();
  return stmt.execute({ subdomain, id });
}
