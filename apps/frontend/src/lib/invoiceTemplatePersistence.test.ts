import { describe, expect, it } from 'vitest';
import {
  AVAILABLE_FIELDS,
  resolveField,
} from './invoiceTemplatePersistence';

describe('invoiceTemplatePersistence', () => {
  it('includes sender and reference contact details in AVAILABLE_FIELDS', () => {
    const fields = AVAILABLE_FIELDS.map((f) => f.field);
    expect(fields).toContain('sender_phone');
    expect(fields).toContain('sender_email');
    expect(fields).toContain('reference_phone');
    expect(fields).toContain('reference_email');
  });

  it('resolves sender and reference contact phone and email fields', () => {
    const lookups = {
      contacts: [
        { id: 'c1', name: 'Ali Reza', phone: '+923001234567', email: 'ali@example.com' },
        { id: 'c2', name: 'Hassan Raza', phone: '+923007654321', email: 'hassan@example.com' },
      ],
    };

    const collection = {
      sender_id: 'c1',
      reference_id: 'c2',
    };

    expect(resolveField('sender_phone', collection, lookups)).toBe('+923001234567');
    expect(resolveField('sender_email', collection, lookups)).toBe('ali@example.com');
    expect(resolveField('reference_phone', collection, lookups)).toBe('+923007654321');
    expect(resolveField('reference_email', collection, lookups)).toBe('hassan@example.com');
  });

  it('resolves amount_in_words dynamically', () => {
    const lookups = {
      currencies: [{ id: 'cur1', code: 'USD' }],
    };
    const collection = {
      amount: 1500,
      currency_id: 'cur1',
    };
    expect(resolveField('amount_in_words', collection, lookups)).toBe('One Thousand Five Hundred USD Only');
  });

  it('gracefully returns empty string for missing lookups or fields', () => {
    expect(resolveField('sender_phone', null)).toBe('');
    expect(resolveField('sender_phone', { sender_id: 'missing' }, {})).toBe('');
    expect(resolveField('amount_in_words', null)).toBe('');
  });
});
