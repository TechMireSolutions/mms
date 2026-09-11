---
name: mms-finance-accounting
description: Implements or audits MMS finance and accounting workflows — invoices, payments, double-entry bookkeeping, chart of accounts, fiscal years, fee structures, and financial reports. Use when modifying finance or accounting features, payment gateways, invoice templates, or ledger entries.
---

# MMS Finance & Accounting Workflow

**Rules (norms SSOT):** `mms-core.md` · `mms-data-layer.md` §5 · `mms-auth-security.md` §5 · `mms-performance.md` §1-2 · `mms-form-architecture.md` · `mms-reports.md` · `mms-structure-naming.md`. Modern Audit Trail Workflow → **`mms-audit-trail`**.

Architecture standards for Madrasa financial management, student billing/invoices, payments, double-entry accounting ledgers, and regulatory audit compliance.

---

## 1. Core Financial Invariants

| Principle | Rule & Enforcement |
|---|---|
| **Money Representation** | Money amounts must always be formatted and validated as decimal strings matching `/^\d+(\.\d{1,2})?$/` (e.g. `"150.00"`). Never use floating point numbers for currency arithmetic or DTOs. |
| **Double-Entry Balance** | Every journal entry must have matching Debit and Credit totals (`SUM(debit) === SUM(credit)`). Single-sided ledger mutations are strictly forbidden. |
| **Immutability of Closed Periods**| Transactions in closed fiscal years (`is_closed: true`) cannot be created, edited, or deleted. Corrections require adjustment entries in the current open fiscal year. |
| **No Client-Side Optimistic Money**| TanStack Query mutations for invoices, payments, and ledger entries must never use optimistic updates. Await server response before UI confirmation. |
| **Soft-Delete & 4-Bucket Taxonomy** | Invoices (`finance_invoices`), payments, and accounts (`accounting_accounts`) belong to **Bucket 1 (Soft-Delete for Audit & Recovery)** with typed `deleted_at`, `deleted_by`, and `deletion_reason`. Restrict Guard blocks account archival if active ledger entries exist (`activeEntriesCount > 0` → 409 Conflict). Conversely, ledger journal entries (`accounting_entries`) belong to **Bucket 4 (Append-Only Immutable)** — physical `DELETE` and `UPDATE` are forbidden at the DB layer (`docs/soft-delete.md` §10, `mms-soft-delete`). |
| **SOX 7-Year Retention Floor** | General ledger records, invoices, payments, and double-entry journals carry a statutory minimum 7-year retention floor (`mms-audit-trail`). |
| **PCI-DSS Tokenization Ban on Card Data** | Avoid storing raw payment card numbers (PAN), CVVs, or cardholder secrets in database tables or audit trails — reference tokenized payment-processor records only (1-year floor, 3 months online) (`mms-audit-trail`). |
| **Transactional Outbox Capture** | Mutating financial records must emit 5-dimension audit events (`action_type: 'CREATE' \| 'UPDATE' \| 'DELETE'`) with RFC 8785 canonical JSON inside `withTenantTransaction`. |

---

## 2. Monorepo Structure & Key Paths

```
packages/shared/src/
  ├── financeBilling.ts / financeCollect.ts / financeInvoiceGeneration.ts  # Invoices, payments, fee items
  ├── accountingLedgerPosting.ts / accountingLedgerInvariants.ts          # Accounts, ledger entries, fiscal years
  └── index.ts (named exports: formatMoney, formatDate)                  # Currency & date formatters

apps/backend/src/
  ├── db/schema.ts               # finance_invoices, finance_payments, accounting_* tables
  ├── routes/tenant/finance.ts   # /api/finance/* routes (invoices, payments, stats)
  └── routes/tenant/accounting.ts# /api/accounting/* routes (ledger, accounts, years)

apps/frontend/src/tenant/features/
  ├── finance/                   # Invoices, payments, fee schedules, billing reports
  └── accounting/                # Chart of accounts, journal entries, balance sheet, trial balance
```

---

## 3. Invoices & Payments Lifecycle

1. **Invoice Generation**: Generated per student or fee schedule with unique invoice number (`INV-{YEAR}-{SEQ}`). Linked by `contactId` / `studentId`.
2. **Payment Allocation**: Payments record payment method (`cash`, `bank_transfer`, `check`, `online`), transaction reference, and allocated amounts per invoice item.
3. **Status Progression**: `draft` → `issued` → `partially_paid` → `paid` (or `void` / `cancelled`).
4. **Server SQL Aggregates**: Fee collection KPIs and revenue summaries must use SQL `GROUP BY` aggregates (`/api/finance/stats`), never full-collection client dumps.

---

## 4. Double-Entry Accounting Architecture

- **Chart of Accounts**: Standard account hierarchy:
  - `1000-1999`: Assets (Cash, Bank, Accounts Receivable)
  - `2000-2999`: Liabilities (Accounts Payable, Deferred Revenue)
  - `3000-3999`: Equity (Retained Earnings, Capital)
  - `4000-4999`: Revenue (Tuition Fees, Donations, Grants)
  - `5000-5999`: Expenses (Salaries, Utilities, Maintenance)
- **Journal Entries**: Header (`entry_number`, `date`, `description`, `fiscal_year_id`) with multiple line items (`account_id`, `debit`, `credit`, `memo`).
- **Fiscal Years**: Explicit start and end dates with `status: 'active' | 'closed'`. Closing generates closing entries to transfer income/expense balances to Retained Earnings.

---

## 5. Verification Checklist Before Done

- [ ] All monetary DTOs validate via `@mms/shared` decimal-as-string schemas (`moneyDecimalSchema`).
- [ ] Financial directory tables use SQL pagination (`useFinanceInvoicesPaginated`, `useFinancePaymentsPaginated`, `useAccountingEntriesPaginated`).
- [ ] Invoice/entry creation forms require clean dirty checking and disable submit when invalid.
- [ ] Reports and KPI tiles load metrics via server SQL aggregate endpoints.
- [ ] Unit tests verify currency formatting and debit/credit ledger equality.
- [ ] Financial mutations emit 5-dimension audit events with RFC 8785 canonical JSON inside `withTenantTransaction` (`mms-audit-trail`).
- [ ] SOX 7-year retention policy applied to financial audit trail events.
- [ ] Cardholder secrets and PAN are never logged; payment processor token references used exclusively.
