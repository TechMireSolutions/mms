import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { OrganizationArchivedPositions } from './OrganizationArchivedPositions';

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/tenant/hooks/collections/organization', () => ({
  useOrganizationPositions: () => ({
    data: [
      {
        id: 'pos-archived-1',
        code: 'DEAN-1',
        name: 'Dean of Studies',
        deletedAt: '2026-10-01T00:00:00.000Z',
      },
    ],
    isLoading: false,
  }),
  useRestorePosition: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

describe('OrganizationArchivedPositions', () => {
  it('renders restore CTA for archived positions', () => {
    const html = renderToStaticMarkup(<OrganizationArchivedPositions />);
    expect(html).toContain('Dean of Studies');
    expect(html).toContain('organization.restore');
    expect(html).toContain('organization.positionsTrash');
  });
});
