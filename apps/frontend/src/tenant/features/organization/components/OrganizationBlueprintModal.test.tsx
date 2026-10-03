import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { OrganizationBlueprintModal } from './OrganizationBlueprintModal';

vi.mock('react-dom', async () => {
  const actual = await vi.importActual<typeof import('react-dom')>('react-dom');
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/tenant/hooks/collections/organization', () => ({
  useOrganizationBlueprints: () => ({
    data: [
      {
        id: 'madrasa-standard-v1',
        name: 'Madrasa Hierarchy',
        description: 'Standard madrasa structure',
        industry: 'madrasa',
        locations: [{ code: 'MAIN', name: 'Main Campus' }],
        positions: [{ code: 'DIR', title: 'Director', capacity: 1 }],
      },
    ],
    isLoading: false,
  }),
  useApplyBlueprint: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

describe('OrganizationBlueprintModal', () => {
  it('renders nothing when open is false', () => {
    const html = renderToStaticMarkup(
      <OrganizationBlueprintModal open={false} onClose={() => {}} />,
    );
    expect(html).toBe('');
  });

  it('renders modal title and blueprint options when open', () => {
    const html = renderToStaticMarkup(
      <OrganizationBlueprintModal open={true} onClose={() => {}} />,
    );
    expect(html).toContain('organization.applyBlueprint');
    expect(html).toContain('Madrasa Hierarchy');
  });
});
