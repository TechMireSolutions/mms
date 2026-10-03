import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { OrganizationLocationsPanel } from './OrganizationLocationsPanel';

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/tenant/hooks/useIndustryTerminology', () => ({
  useIndustryTerminology: () => ({
    locationLabel: 'Campus',
    facultyLabel: 'Faculty',
    staffSingular: 'Teacher',
  }),
}));

vi.mock('../hooks/useOrganizationLocationsPanel', () => ({
  useOrganizationLocationsPanel: () => ({
    locations: [
      {
        id: 'loc-1',
        code: 'HQ',
        name: 'Head Office',
        type: 'head_office',
        city: 'Karachi',
        addressLine1: null,
        region: null,
      },
    ],
    open: false,
    draft: {
      code: '',
      name: '',
      type: 'branch',
      addressLine1: null,
      city: null,
      isHeadOffice: false,
      isActive: true,
      sortOrder: 0,
    },
    isEdit: false,
    saving: false,
    setOpen: vi.fn(),
    setDraft: vi.fn(),
    openCreate: vi.fn(),
    openEdit: vi.fn(),
    handleSave: vi.fn(),
    handleDelete: vi.fn(),
    handleRestore: vi.fn(),
  }),
}));

vi.mock('./OrganizationLocationFormModal', () => ({
  OrganizationLocationFormModal: () => null,
}));

describe('OrganizationLocationsPanel', () => {
  it('shows restore CTA in trash mode', () => {
    const html = renderToStaticMarkup(
      <OrganizationLocationsPanel
        canWrite={true}
        canDelete={true}
        viewingDeleted={true}
      />,
    );
    expect(html).toContain('Head Office');
    expect(html).toContain('organization.restore');
  });
});
