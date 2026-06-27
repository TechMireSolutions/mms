import {
  accountRecordSchema as sharedAccountRecordSchema,
  accountListSchema as sharedAccountListSchema,
  journalLineRecordSchema as sharedJournalLineRecordSchema,
  journalEntryRecordSchema as sharedJournalEntryRecordSchema,
  journalEntryListSchema as sharedJournalEntryListSchema,
  fiscalYearRecordSchema as sharedFiscalYearRecordSchema,
  fiscalYearListSchema as sharedFiscalYearListSchema,
} from '@mms/shared';

export const accountRecordSchema = sharedAccountRecordSchema.passthrough();
export const accountListSchema = sharedAccountListSchema;

export const journalLineRecordSchema = sharedJournalLineRecordSchema.passthrough();

export const journalEntryRecordSchema = sharedJournalEntryRecordSchema.passthrough();
export const journalEntryListSchema = sharedJournalEntryListSchema;

export const fiscalYearRecordSchema = sharedFiscalYearRecordSchema.passthrough();
export const fiscalYearListSchema = sharedFiscalYearListSchema;
