import { sql, type SQL } from 'drizzle-orm';
import { normalizeSearchString } from '@mms/shared';
import { contacts, students, teachers, tenantUsers, contactEmails, contactAddresses } from '../schema.js';
import { primaryPhoneDigitsSql } from './contactRepositorySql.js';

export const TEACHER_USER_ROLES_SQL = sql`('teacher', 'assistant_teacher')`;

export function existsActiveStudentLinkSql(subdomain: string): SQL {
  return sql`EXISTS (
    SELECT 1 FROM ${students}
    WHERE ${students.workspaceSubdomain} = ${subdomain}
      AND ${students.deletedAt} IS NULL
      AND NULLIF(trim(${students.contactId}), '') = ${contacts.id}
  )`;
}

export function existsActiveTeacherLinkSql(subdomain: string): SQL {
  return sql`EXISTS (
    SELECT 1 FROM ${teachers}
    WHERE ${teachers.workspaceSubdomain} = ${subdomain}
      AND ${teachers.deletedAt} IS NULL
      AND NULLIF(trim(${teachers.contactId}), '') = ${contacts.id}
  )`;
}

export function existsActiveStaffLinkSql(subdomain: string): SQL {
  return sql`EXISTS (
    SELECT 1 FROM ${tenantUsers}
    WHERE ${tenantUsers.workspaceSubdomain} = ${subdomain}
      AND ${tenantUsers.deletedAt} IS NULL
      AND NULLIF(trim(${tenantUsers.contactId}), '') = ${contacts.id}
      AND lower(${tenantUsers.role}) NOT IN ${TEACHER_USER_ROLES_SQL}
  )`;
}

export function isSyedSql(): SQL {
  return sql`${contacts.isSyed} IS TRUE`;
}

/**
 * Approximate normalizeSearchString in SQL:
 * NFD → strip Latin combining marks → strip Arabic harakat → Yeh/Kaf → lower.
 */
export function sqlNormalizeSearchExpr(expr: SQL): SQL {
  const fromChars = '\u064A\u0643';
  const toChars = '\u06CC\u06A9';
  return sql`lower(
    translate(
      regexp_replace(
        regexp_replace(
          normalize(${expr}, NFD),
          '[\u0300-\u036f]',
          '',
          'g'
        ),
        '[\u064B-\u065F\u0670]',
        '',
        'g'
      ),
      ${fromChars},
      ${toChars}
    )
  )`;
}

export function buildSearchSql(search: string): SQL | null {
  const normalized = normalizeSearchString(search.trim());
  if (!normalized) return null;
  const pattern = `%${normalized}%`;
  const haystack = sql`concat_ws(' ',
      COALESCE(${contacts.name}, ''),
      COALESCE(${contacts.firstName}, ''),
      COALESCE(${contacts.lastName}, ''),
      NULLIF(${primaryPhoneDigitsSql()}, ''),
      COALESCE((
        SELECT string_agg(NULLIF(trim(e.address), ''), ' ')
        FROM ${contactEmails} e
        WHERE e.workspace_subdomain = ${contacts.workspaceSubdomain}
          AND e.contact_id = ${contacts.id}
      ), ''),
      COALESCE((
        SELECT string_agg(
          concat_ws(' ',
            NULLIF(trim(a.city), ''),
            NULLIF(trim(a.state), ''),
            NULLIF(trim(a.country), ''),
            NULLIF(trim(a.line1), '')
          ),
          ' '
        )
        FROM ${contactAddresses} a
        WHERE a.workspace_subdomain = ${contacts.workspaceSubdomain}
          AND a.contact_id = ${contacts.id}
      ), '')
    )`;
  return sql`(${sqlNormalizeSearchExpr(haystack)} LIKE ${pattern})`;
}
