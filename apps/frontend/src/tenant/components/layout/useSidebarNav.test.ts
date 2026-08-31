import { describe, expect, it } from 'vitest';
import { roleHasPermission } from '@mms/shared';
import { ROUTES } from '@/lib/config/routes';
import { NAV_ITEMS, type NavItem } from '@/lib/config/navConfig';
import { filterSidebarNavItems } from './useSidebarNav';

function visiblePaths(items: readonly NavItem[]): string[] {
  return items.flatMap((item) => [
    ...(item.path ? [item.path] : []),
    ...(item.subItems?.map((subItem) => subItem.path) ?? []),
  ]);
}

describe('filterSidebarNavItems', () => {
  it('omits administrative, financial, and contacts modules for teachers', () => {
    const items = filterSidebarNavItems(
      NAV_ITEMS,
      {},
      (permission) => roleHasPermission('teacher', permission),
    );
    const paths = visiblePaths(items);

    expect(paths).toContain(ROUTES.home);
    expect(paths).toContain(ROUTES.students);
    expect(paths).toContain(ROUTES.attendance);
    expect(paths).not.toContain(ROUTES.contacts);
    expect(paths).not.toContain(ROUTES.finance);
    expect(paths).not.toContain(ROUTES.accounting);
    expect(paths).not.toContain(ROUTES.users);
    expect(paths).not.toContain(ROUTES.settings);
  });

  it('applies the same restrictions to assistant teachers', () => {
    const items = filterSidebarNavItems(
      NAV_ITEMS,
      {},
      (permission) => roleHasPermission('assistant_teacher', permission),
    );
    const paths = visiblePaths(items);

    expect(paths).not.toContain(ROUTES.contacts);
    expect(paths).not.toContain(ROUTES.finance);
    expect(paths).not.toContain(ROUTES.accounting);
    expect(paths).not.toContain(ROUTES.users);
    expect(paths).not.toContain(ROUTES.settings);
  });

  it('keeps permitted modules visible for administrators', () => {
    const items = filterSidebarNavItems(
      NAV_ITEMS,
      {},
      (permission) => roleHasPermission('admin', permission),
    );
    const paths = visiblePaths(items);

    expect(paths).toContain(ROUTES.contacts);
    expect(paths).toContain(ROUTES.finance);
    expect(paths).toContain(ROUTES.accounting);
    expect(paths).toContain(ROUTES.users);
    expect(paths).toContain(ROUTES.settings);
  });

  it('also omits modules disabled in workspace settings', () => {
    const items = filterSidebarNavItems(
      NAV_ITEMS,
      { students: false },
      (permission) => roleHasPermission('admin', permission),
    );

    expect(visiblePaths(items)).not.toContain(ROUTES.students);
  });
});
