---
name: mms-finance-accounting
description: Implements or audits MMS finance and accounting workflows — invoices, payments, double-entry bookkeeping, chart of accounts, fiscal years, fee structures, and financial reports. Use when modifying finance or accounting features, payment gateways, invoice templates, or ledger entries. Do NOT use for general custom form building (use mms-form-architecture), generic data querying (use mms-query-factories), or low-level database audit hash chains (use mms-audit-trail).
license: Proprietary
metadata:
  owner: mms-platform
  last-verified: 2026-09-15
---

# MMS Finance & Accounting Workflow

**Rule (norms SSOT):** `mms-core.md` · `mms-data-layer.md` §5 · `mms-auth-security.md` §5 · `mms-form-architecture.md`.
**Workflows:** `/feature-module` · **Manifest:** `.agent/skills-manifest.json`

## Anti-Patterns & Banned Operations

- ❌ **NEVER use floating point numbers for currency**: Always use decimal strings matching `/^\d+(\.\d{1,2})?$/`.
- ❌ **NEVER allow single-sided ledger mutations**: `SUM(debit)` must strictly equal `SUM(credit)` in every entry.
- ❌ **NEVER use optimistic UI updates for money**: Await server persistence before confirming transactions in UI.
- ❌ **NEVER hard-delete financial records**: Invoices and payments use soft-delete; journal entries are append-only immutable.
- ❌ **NEVER store raw card data (PAN/CVV)**: PCI-DSS compliance strictly bans cardholder secrets in tables or logs.

## Double-Entry Journal Entry Implementation Pattern

```ts
import { db } from '@/db';
import { accountingEntries, accountingAccounts } from '@/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { z } from 'zod';

export const moneyStringSchema = z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid money format');

export async function postJournalEntry(tenant: string, entry: {
  description: string;
  lines: Array<{ accountId: string; debit: string; credit: string }>;
}) {
  const totalDebit = entry.lines.reduce((acc, l) => acc + Number(l.debit || 0), 0);
  const totalCredit = entry.lines.reduce((acc, l) => acc + Number(l.credit || 0), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    throw new Error('Double-entry violation: debits and credits must balance');
  }

  return await db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL app.current_tenant = ${tenant}`);

    for (const line of entry.lines) {
      // Verify account is active (active foreign key guarding)
      const [acc] = await tx.select().from(accountingAccounts)
        .where(and(eq(accountingAccounts.id, line.accountId), sql`deleted_at IS NULL`));
      if (!acc) throw new Error(`Account ${line.accountId} not found or archived`);

      await tx.insert(accountingEntries).values({
        workspaceSubdomain: tenant,
        accountId: line.accountId,
        debit: line.debit,
        credit: line.credit,
        description: entry.description,
      });
    }
  });
}
```

## Verification Checklist

```
- [ ] Money validated as decimal strings (/^\d+(\.\d{1,2})?$/)
- [ ] Journal entries strictly balanced (debits === credits)
- [ ] No optimistic UI updates for financial transactions
- [ ] Active foreign key guard verified on accounts and invoices
- [ ] Closed fiscal periods immutable; corrections via adjustments
- [ ] Run: pnpm typecheck && cd apps/backend && pnpm test
```
