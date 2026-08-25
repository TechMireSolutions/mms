import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ContactsFilterMenuButton } from './ContactsFilterMenuButton';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import type { AppTranslationKey, ContactsQuickFilter } from '@mms/shared';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockT: TranslationFunction = ((key: AppTranslationKey) => {
  const map: Partial<Record<AppTranslationKey, string>> = {
    'contacts.filters': 'Filters',
    'contacts.genderFilter': 'Gender',
    'contacts.sortBy': 'Sort By',
    'contacts.allGenders': 'All Genders',
    'contacts.gender.male': 'Male',
    'contacts.gender.female': 'Female',
    'contacts.filtersAll': 'All Contacts',
    'contacts.filtersWhatsApp': 'Has WhatsApp',
    'contacts.filtersSyed': 'Is Syed',
    'contacts.filtersMissingInfo': 'Missing Info',
    'contacts.filtersRecent': 'Recently Added',
  };
  return map[key] ?? key;
}) as unknown as TranslationFunction;

describe('ContactsFilterMenuButton Component', () => {
  it('renders filter dropdown trigger with idle state when activeFilterCount is 0', () => {
    const html = renderToStaticMarkup(
      <ContactsFilterMenuButton
        activeFilterCount={0}
        quickFilter="all"
        onQuickFilterChange={vi.fn()}
        filterGender=""
        genders={['male', 'female']}
        onGenderChange={vi.fn()}
        sortField="name"
        sortOptions={[
          { field: 'name', label: 'Name' },
          { field: 'createdAt', label: 'Recently Added' },
        ]}
        onSort={vi.fn()}
        t={mockT}
      />,
    );

    expect(html).toContain('Filters');
    expect(html).not.toContain('font-bold');
  });

  it('renders active filter badge counter when activeFilterCount > 0', () => {
    const html = renderToStaticMarkup(
      <ContactsFilterMenuButton
        activeFilterCount={3}
        quickFilter={'whatsapp' as ContactsQuickFilter}
        onQuickFilterChange={vi.fn()}
        filterGender="male"
        genders={['male', 'female']}
        onGenderChange={vi.fn()}
        sortField="createdAt"
        sortOptions={[
          { field: 'name', label: 'Name' },
          { field: 'createdAt', label: 'Recently Added' },
        ]}
        onSort={vi.fn()}
        t={mockT}
      />,
    );

    expect(html).toContain('Filters');
    expect(html).toContain('>3<');
  });

  it('renders all filter sections and options when trigger is clicked', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <ContactsFilterMenuButton
          activeFilterCount={1}
          quickFilter="whatsapp"
          onQuickFilterChange={vi.fn()}
          filterGender="male"
          genders={['male', 'female']}
          onGenderChange={vi.fn()}
          sortField="createdAt"
          sortOptions={[
            { field: 'name', label: 'Name' },
            { field: 'createdAt', label: 'Recently Added' },
          ]}
          onSort={vi.fn()}
          t={mockT}
        />,
      );
    });

    const trigger = container.querySelector('button');
    expect(trigger).not.toBeNull();

    await act(async () => {
      trigger?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      trigger?.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
    });

    const bodyHtml = document.body.innerHTML;
    expect(bodyHtml).toContain('All Contacts');
    expect(bodyHtml).toContain('Has WhatsApp');
    expect(bodyHtml).toContain('Is Syed');
    expect(bodyHtml).toContain('All Genders');
    expect(bodyHtml).toContain('Recently Added');

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
