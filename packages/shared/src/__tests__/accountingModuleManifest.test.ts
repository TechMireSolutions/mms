import { describe, expect, it } from 'vitest';
import { accountRecordSchema } from '../accountingModuleManifest.js';

describe('accountRecordSchema', () => {
  const validAccount = {
    id: 'account-1',
    code: '1000',
    name: 'Cash',
    type: 'Asset',
    subtype: '',
    description: '',
    isActive: true,
  } as const;

  it('accepts and trims a valid account', () => {
    expect(accountRecordSchema.parse({
      ...validAccount,
      code: ' 1000 ',
      name: ' Cash ',
    })).toMatchObject({ code: '1000', name: 'Cash' });
  });

  it('rejects blank account codes and names', () => {
    const result = accountRecordSchema.safeParse({
      ...validAccount,
      code: ' ',
      name: '',
    });

    expect(result.success).toBe(false);
  });
});
