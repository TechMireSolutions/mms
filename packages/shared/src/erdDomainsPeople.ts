import type { ErdDomain } from './erdCatalogTypes.js';

/** Canonical person directory and child collections (Drizzle `contacts.ts`). */
export const ERD_DOMAIN_CONTACTS: ErdDomain = {
  id: 'contacts',
  labelKey: 'nav.contacts',
  tables: [
    {
      name: 'contacts',
      columns: [
        { name: 'workspace_subdomain', type: 'text', kind: 'pk' },
        { name: 'id', type: 'text', kind: 'pk' },
        { name: 'first_name', type: 'varchar(150)', kind: 'column' },
        { name: 'name', type: 'varchar(300)', kind: 'column' },
        { name: 'cnic', type: 'varchar(30)', kind: 'unique' },
      ],
    },
    {
      name: 'contact_phones',
      columns: [
        { name: 'workspace_subdomain', type: 'text', kind: 'pk' },
        { name: 'contact_id', type: 'text', kind: 'pk' },
        { name: 'id', type: 'text', kind: 'pk' },
        { name: 'number', type: 'varchar(50)', kind: 'column' },
      ],
    },
    {
      name: 'contact_emails',
      columns: [
        { name: 'workspace_subdomain', type: 'text', kind: 'pk' },
        { name: 'contact_id', type: 'text', kind: 'pk' },
        { name: 'id', type: 'text', kind: 'pk' },
        { name: 'address', type: 'varchar(255)', kind: 'column' },
      ],
    },
    {
      name: 'contact_addresses',
      columns: [
        { name: 'workspace_subdomain', type: 'text', kind: 'pk' },
        { name: 'contact_id', type: 'text', kind: 'pk' },
        { name: 'id', type: 'text', kind: 'pk' },
      ],
    },
    {
      name: 'contact_relationships',
      columns: [
        { name: 'workspace_subdomain', type: 'text', kind: 'pk' },
        { name: 'contact_id', type: 'text', kind: 'pk' },
        { name: 'id', type: 'text', kind: 'pk' },
      ],
    },
    {
      name: 'tenant_users',
      columns: [
        { name: 'workspace_subdomain', type: 'text', kind: 'pk' },
        { name: 'id', type: 'text', kind: 'pk' },
        { name: 'contact_id', type: 'text', kind: 'fk' },
      ],
    },
  ],
  relationships: [
    {
      fromTable: 'contact_phones',
      fromColumn: 'contact_id',
      toTable: 'contacts',
      toColumn: 'id',
      cardinality: 'N:1',
      onDelete: 'cascade',
    },
    {
      fromTable: 'contact_emails',
      fromColumn: 'contact_id',
      toTable: 'contacts',
      toColumn: 'id',
      cardinality: 'N:1',
      onDelete: 'cascade',
    },
    {
      fromTable: 'contact_addresses',
      fromColumn: 'contact_id',
      toTable: 'contacts',
      toColumn: 'id',
      cardinality: 'N:1',
      onDelete: 'cascade',
    },
    {
      fromTable: 'contact_relationships',
      fromColumn: 'contact_id',
      toTable: 'contacts',
      toColumn: 'id',
      cardinality: 'N:1',
      onDelete: 'cascade',
    },
    {
      fromTable: 'tenant_users',
      fromColumn: 'contact_id',
      toTable: 'contacts',
      toColumn: 'id',
      cardinality: '1:1',
    },
  ],
};

/** Student rows linked to contacts (Drizzle `students.ts`). */
export const ERD_DOMAIN_STUDENTS: ErdDomain = {
  id: 'students',
  labelKey: 'nav.students',
  tables: [
    {
      name: 'students',
      columns: [
        { name: 'workspace_subdomain', type: 'text', kind: 'pk' },
        { name: 'id', type: 'text', kind: 'pk' },
        { name: 'contact_id', type: 'text', kind: 'fk' },
        { name: 'father_contact_id', type: 'text', kind: 'fk' },
        { name: 'mother_contact_id', type: 'text', kind: 'fk' },
        { name: 'guardian_contact_id', type: 'text', kind: 'fk' },
        { name: 'gr_number', type: 'varchar(100)', kind: 'column' },
      ],
    },
    {
      name: 'student_enrolled_sessions',
      columns: [
        { name: 'workspace_subdomain', type: 'text', kind: 'pk' },
        { name: 'student_id', type: 'text', kind: 'pk' },
        { name: 'id', type: 'text', kind: 'pk' },
        { name: 'session_id', type: 'varchar(100)', kind: 'column' },
      ],
    },
    {
      name: 'contacts',
      columns: [
        { name: 'workspace_subdomain', type: 'text', kind: 'pk' },
        { name: 'id', type: 'text', kind: 'pk' },
        { name: 'name', type: 'varchar(300)', kind: 'column' },
      ],
    },
  ],
  relationships: [
    {
      fromTable: 'students',
      fromColumn: 'contact_id',
      toTable: 'contacts',
      toColumn: 'id',
      cardinality: '1:1',
      onDelete: 'set null',
    },
    {
      fromTable: 'students',
      fromColumn: 'father_contact_id',
      toTable: 'contacts',
      toColumn: 'id',
      cardinality: 'N:1',
      onDelete: 'set null',
    },
    {
      fromTable: 'students',
      fromColumn: 'mother_contact_id',
      toTable: 'contacts',
      toColumn: 'id',
      cardinality: 'N:1',
      onDelete: 'set null',
    },
    {
      fromTable: 'students',
      fromColumn: 'guardian_contact_id',
      toTable: 'contacts',
      toColumn: 'id',
      cardinality: 'N:1',
      onDelete: 'set null',
    },
    {
      fromTable: 'student_enrolled_sessions',
      fromColumn: 'student_id',
      toTable: 'students',
      toColumn: 'id',
      cardinality: 'N:1',
      onDelete: 'cascade',
    },
  ],
};

/** Staff rows linked to contacts and tenant users (Drizzle `teachers.ts`). */
export const ERD_DOMAIN_TEACHERS: ErdDomain = {
  id: 'teachers',
  labelKey: 'nav.teachers',
  tables: [
    {
      name: 'teachers',
      columns: [
        { name: 'workspace_subdomain', type: 'text', kind: 'pk' },
        { name: 'id', type: 'text', kind: 'pk' },
        { name: 'contact_id', type: 'text', kind: 'fk' },
        { name: 'user_id', type: 'text', kind: 'fk' },
        { name: 'employee_id', type: 'varchar(100)', kind: 'column' },
      ],
    },
    {
      name: 'contacts',
      columns: [
        { name: 'workspace_subdomain', type: 'text', kind: 'pk' },
        { name: 'id', type: 'text', kind: 'pk' },
        { name: 'name', type: 'varchar(300)', kind: 'column' },
      ],
    },
    {
      name: 'tenant_users',
      columns: [
        { name: 'workspace_subdomain', type: 'text', kind: 'pk' },
        { name: 'id', type: 'text', kind: 'pk' },
        { name: 'contact_id', type: 'text', kind: 'fk' },
      ],
    },
  ],
  relationships: [
    {
      fromTable: 'teachers',
      fromColumn: 'contact_id',
      toTable: 'contacts',
      toColumn: 'id',
      cardinality: '1:1',
      onDelete: 'set null',
    },
    {
      fromTable: 'teachers',
      fromColumn: 'user_id',
      toTable: 'tenant_users',
      toColumn: 'id',
      cardinality: '1:1',
      onDelete: 'set null',
    },
  ],
};
