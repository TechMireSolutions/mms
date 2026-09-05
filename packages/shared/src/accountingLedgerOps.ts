import { z } from 'zod';

export const postingRulesRecordSchema = z
  .object({
    arAccountId: z.string().nullable().optional(),
    cashAccountId: z.string().nullable().optional(),
    incomeAccountId: z.string().nullable().optional(),
    discountAccountId: z.string().nullable().optional(),
    updatedAt: z.string().optional(),
  })
  .strict();

export const postingRulesUpdateSchema = postingRulesRecordSchema
  .omit({ updatedAt: true })
  .strict();

export type PostingRules = z.infer<typeof postingRulesRecordSchema>;
export type PostingRulesUpdate = z.infer<typeof postingRulesUpdateSchema>;

export const openingBalanceRecordSchema = z
  .object({
    id: z.string(),
    fiscalYearId: z.string().min(1),
    accountId: z.string().min(1),
    debit: z.number().nonnegative().default(0),
    credit: z.number().nonnegative().default(0),
  })
  .strict();

export const openingBalanceInsertSchema = openingBalanceRecordSchema
  .extend({ id: z.string().optional() })
  .strict();

export const openingBalancesReplaceSchema = z
  .object({
    fiscalYearId: z.string().min(1),
    balances: z.array(openingBalanceInsertSchema).max(500),
  })
  .strict();

export type OpeningBalance = z.infer<typeof openingBalanceRecordSchema>;
export type OpeningBalanceInsert = z.infer<typeof openingBalanceInsertSchema>;

export const bankStatementLineRecordSchema = z
  .object({
    id: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    description: z.string().default(''),
    amount: z.number(),
  })
  .strict();

export const bankStatementLineInsertSchema = bankStatementLineRecordSchema
  .extend({ id: z.string().optional() })
  .strict();

export const bankStatementRecordSchema = z
  .object({
    id: z.string(),
    accountId: z.string().min(1),
    periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    openingBalance: z.number().default(0),
    closingBalance: z.number().default(0),
    lines: z.array(bankStatementLineRecordSchema).default([]),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .strict();

export const bankStatementInsertSchema = z
  .object({
    id: z.string().optional(),
    accountId: z.string().min(1),
    periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    openingBalance: z.number().optional().default(0),
    closingBalance: z.number().optional().default(0),
    lines: z.array(bankStatementLineInsertSchema).optional().default([]),
  })
  .strict();

export type BankStatement = z.infer<typeof bankStatementRecordSchema>;
export type BankStatementInsert = z.infer<typeof bankStatementInsertSchema>;
export type BankStatementLine = z.infer<typeof bankStatementLineRecordSchema>;

export const bankReconciliationMatchSchema = z
  .object({
    statementLineId: z.string().min(1),
    journalEntryId: z.string().min(1),
    journalLineId: z.string().min(1),
  })
  .strict();

export type BankReconciliationMatch = z.infer<typeof bankReconciliationMatchSchema>;

export const closeFiscalYearBodySchema = z
  .object({
    retainedEarningsAccountId: z.string().min(1).optional(),
  })
  .strict();
