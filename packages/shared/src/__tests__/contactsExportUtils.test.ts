import { describe, expect, it } from 'vitest';
import {
  filterContactExportColumnsForViewer,
  buildContactsExportRows,
  type ContactExportColumn,
  type ContactExportLabels,
} from '../contactsExportUtils.js';
import type { Contact } from '../contactTypes.js';

describe('contactsExportUtils', () => {
  const columns: ContactExportColumn[] = [
    { id: 'name', label: 'Full Name' },
    { id: 'phone', label: 'Phone Number' },
    { id: 'email', label: 'Email Address' },
    { id: 'whatsapp', label: 'Has WhatsApp' },
    { id: 'city', label: 'City' },
  ];

  const labels: ContactExportLabels = { yes: 'Yes', no: 'No' };

  const contacts: Contact[] = [
    {
      id: 'c-1',
      firstName: 'Aisha',
      lastName: 'Siddiqui',
      name: 'Aisha Siddiqui',
      phones: [{ label: 'Mobile', number: '3001234567', countryCode: '+92' }],
      emails: [{ label: 'Personal', address: 'aisha@example.com' }],
      addresses: [{ label: 'Home', city: 'Lahore', country: 'Pakistan' }],
    },
    {
      id: 'c-2',
      firstName: 'Bilal',
      lastName: 'Hassan',
      name: 'Bilal Hassan',
      phones: [{ label: 'Home', number: '3007654321', countryCode: '+92' }],
      emails: [],
    },
  ];

  it('filters export columns based on viewer permissions', () => {
    const filtered = filterContactExportColumnsForViewer(columns, null, 'admin');
    expect(filtered).toHaveLength(5);
  });

  it('builds CSV header and rows correctly', () => {
    const rows = buildContactsExportRows(contacts, columns, labels);
    expect(rows).toHaveLength(3); // 1 header + 2 data rows

    // Header row
    expect(rows[0]).toEqual(['Full Name', 'Phone Number', 'Email Address', 'Has WhatsApp', 'City']);

    // Aisha row
    expect(rows[1]).toEqual(['Aisha Siddiqui', '+92 3001234567', 'aisha@example.com', 'Yes', 'Lahore']);

    // Bilal row
    expect(rows[2]).toEqual(['Bilal Hassan', '+92 3007654321', '', 'Yes', '']);
  });
});
