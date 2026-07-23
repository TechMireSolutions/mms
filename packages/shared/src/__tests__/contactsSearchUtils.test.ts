import { describe, expect, it } from 'vitest';
import type { Contact } from '../contactTypes.js';
import { contactMatchesSearch, getContactSearchHaystack, normalizeSearchString } from '../contactsSearchUtils.js';

describe('contactsSearchUtils', () => {
  it('matches name and email in search haystack', () => {
    const contact = {
      id: '1',
      name: 'Ali Khan',
      emails: [{ label: 'Work', address: 'ali@example.com' }],
    } as Contact;
    expect(getContactSearchHaystack(contact)).toContain('ali@example.com');
    expect(contactMatchesSearch(contact, 'ali@')).toBe(true);
    expect(contactMatchesSearch(contact, 'missing')).toBe(false);
  });

  it('normalizes search strings (diacritics, Arabic/Urdu Yeh and Kaf)', () => {
    // Diacritics/Accents stripping
    expect(normalizeSearchString('Alí Khân')).toBe('ali khan');
    
    // Arabic diacritics (harakat)
    expect(normalizeSearchString('مُحَمَّد')).toBe('محمد');
    
    // Arabic vs Urdu/Persian Yeh (ي to ی)
    expect(normalizeSearchString('علي')).toBe('علی');
    
    // Arabic vs Urdu/Persian Kaf (ك to ک)
    expect(normalizeSearchString('أبو بكر')).toBe('ابو بکر');
  });

  it('matches contacts using normalized multilingual queries', () => {
    const contact = {
      id: '2',
      name: 'عَلِی خَان', // Urdu Yeh with Harakat/diacritics
    } as Contact;

    // Direct match (ignoring diacritics)
    expect(contactMatchesSearch(contact, 'علی')).toBe(true);

    // Matching Arabic query 'علي' against Urdu name 'عَلِی'
    expect(contactMatchesSearch(contact, 'علي')).toBe(true);
  });
});
