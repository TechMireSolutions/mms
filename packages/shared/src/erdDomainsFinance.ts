import type { ErdDomain } from './erdCatalogTypes.js';

/** Accounting + student billing tables (Drizzle `accounting.ts` / `finance.ts`). */
export const ERD_DOMAIN_ACCOUNTING: ErdDomain = {
  id: 'accounting',
  labelKey: 'nav.accounting',
  tables: [
    {
      name: 'accounting_accounts',
      columns: [
        { name: 'workspace_subdomain', type: 'text', kind: 'pk' },
        { name: 'id', type: 'text', kind: 'pk' },
        { name: 'code', type: 'varchar(50)', kind: 'unique' },
        { name: 'name', type: 'varchar(150)', kind: 'column' },
        { name: 'type', type: 'varchar(50)', kind: 'column' },
        { name: 'deleted_at', type: 'timestamptz', kind: 'column' },
      ],
    },
    {
      name: 'accounting_fiscal_years',
      columns: [
        { name: 'workspace_subdomain', type: 'text', kind: 'pk' },
        { name: 'id', type: 'text', kind: 'pk' },
        { name: 'label', type: 'varchar(120)', kind: 'column' },
        { name: 'start_date', type: 'varchar(10)', kind: 'column' },
        { name: 'end_date', type: 'varchar(10)', kind: 'column' },
        { name: 'status', type: 'varchar(20)', kind: 'column' },
      ],
    },
    {
      name: 'accounting_entries',
      columns: [
        { name: 'workspace_subdomain', type: 'text', kind: 'pk' },
        { name: 'id', type: 'text', kind: 'pk' },
        { name: 'date', type: 'varchar(10)', kind: 'column' },
        { name: 'ref', type: 'varchar(100)', kind: 'column' },
        { name: 'status', type: 'varchar(20)', kind: 'column' },
        { name: 'fiscal_year', type: 'varchar(64)', kind: 'column' },
      ],
    },
    {
      name: 'accounting_journal_lines',
      columns: [
        { name: 'workspace_subdomain', type: 'text', kind: 'pk' },
        { name: 'entry_id', type: 'text', kind: 'pk' },
        { name: 'id', type: 'text', kind: 'pk' },
        { name: 'account_id', type: 'text', kind: 'fk' },
        { name: 'debit', type: 'numeric(14,2)', kind: 'column' },
        { name: 'credit', type: 'numeric(14,2)', kind: 'column' },
      ],
    },
    {
      name: 'accounting_entry_tags',
      columns: [
        { name: 'workspace_subdomain', type: 'text', kind: 'pk' },
        { name: 'entry_id', type: 'text', kind: 'pk' },
        { name: 'tag', type: 'varchar(64)', kind: 'pk' },
      ],
    },
    {
      name: 'accounting_entry_attachments',
      columns: [
        { name: 'workspace_subdomain', type: 'text', kind: 'pk' },
        { name: 'entry_id', type: 'text', kind: 'pk' },
        { name: 'url', type: 'text', kind: 'pk' },
      ],
    },
  ],
  relationships: [
    {
      fromTable: 'accounting_journal_lines',
      fromColumn: 'entry_id',
      toTable: 'accounting_entries',
      toColumn: 'id',
      cardinality: 'N:1',
    },
    {
      fromTable: 'accounting_journal_lines',
      fromColumn: 'account_id',
      toTable: 'accounting_accounts',
      toColumn: 'id',
      cardinality: 'N:1',
    },
    {
      fromTable: 'accounting_entry_tags',
      fromColumn: 'entry_id',
      toTable: 'accounting_entries',
      toColumn: 'id',
      cardinality: 'N:1',
      onDelete: 'cascade',
    },
    {
      fromTable: 'accounting_entry_attachments',
      fromColumn: 'entry_id',
      toTable: 'accounting_entries',
      toColumn: 'id',
      cardinality: 'N:1',
      onDelete: 'cascade',
    },
  ],
};

/** Student invoices and payments (Drizzle `finance.ts`). */
export const ERD_DOMAIN_FINANCE: ErdDomain = {
  id: 'finance',
  labelKey: 'nav.finance',
  tables: [
    {
      name: 'finance_invoices',
      columns: [
        { name: 'workspace_subdomain', type: 'text', kind: 'pk' },
        { name: 'id', type: 'text', kind: 'pk' },
        { name: 'student_id', type: 'varchar(64)', kind: 'fk' },
        { name: 'final_amt', type: 'numeric(12,2)', kind: 'column' },
        { name: 'status', type: 'varchar(20)', kind: 'column' },
        { name: 'due_date', type: 'varchar(10)', kind: 'column' },
      ],
    },
    {
      name: 'finance_payments',
      columns: [
        { name: 'workspace_subdomain', type: 'text', kind: 'pk' },
        { name: 'id', type: 'text', kind: 'pk' },
        { name: 'invoice_id', type: 'text', kind: 'fk' },
        { name: 'student_id', type: 'varchar(64)', kind: 'column' },
        { name: 'amount', type: 'numeric(12,2)', kind: 'column' },
        { name: 'method', type: 'varchar(50)', kind: 'column' },
      ],
    },
    {
      name: 'students',
      columns: [
        { name: 'workspace_subdomain', type: 'text', kind: 'pk' },
        { name: 'id', type: 'text', kind: 'pk' },
        { name: 'contact_id', type: 'text', kind: 'fk' },
        { name: 'gr_number', type: 'varchar(100)', kind: 'column' },
      ],
    },
  ],
  relationships: [
    {
      fromTable: 'finance_payments',
      fromColumn: 'invoice_id',
      toTable: 'finance_invoices',
      toColumn: 'id',
      cardinality: 'N:1',
      onDelete: 'cascade',
    },
    {
      fromTable: 'finance_invoices',
      fromColumn: 'student_id',
      toTable: 'students',
      toColumn: 'id',
      cardinality: 'N:1',
    },
  ],
};
