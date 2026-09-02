import React, { useDeferredValue, useMemo, useState } from 'react';
import { BookOpen, Check, X, ShieldCheck, Search } from 'lucide-react';
import {
  groupRbacModulesForPermissionsNav,
  PERMISSION_ACTIONS,
  type PermissionAction,
  type PermissionMap,
  type RbacModuleDef,
} from '@mms/shared';
import { WORK_SURFACE } from '@/components/ui/formStyles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModuleTableHeaderCell } from '@/components/ui/ModuleTableHeaderCell';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslation } from '@/hooks/useTranslation';
import { PermissionMatrixRow } from '@/tenant/features/users/components/PermissionMatrixRow';
import { PermissionMatrixMobileRow } from '@/tenant/features/users/components/PermissionMatrixMobileRow';

interface PermissionMatrixProps {
  modules: readonly RbacModuleDef[];
  perms: PermissionMap;
  readOnly: boolean;
  onToggle: (moduleId: string, action: PermissionAction) => void;
  onSelectAll: (moduleId: string) => void;
  onClearAll: (moduleId: string) => void;
}

export function PermissionMatrix({
  modules,
  perms,
  readOnly,
  onToggle,
  onSelectAll,
  onClearAll,
}: PermissionMatrixProps): React.JSX.Element {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearch = useDeferredValue(searchQuery);

  const filteredModules = useMemo(() => {
    if (!deferredSearch.trim()) return modules;
    const q = deferredSearch.trim().toLowerCase();
    return modules.filter((m) => t(m.labelKey).toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
  }, [modules, deferredSearch, t]);

  const groups = useMemo(() => groupRbacModulesForPermissionsNav(filteredModules), [filteredModules]);
  const colSpan = PERMISSION_ACTIONS.length + 1 + (readOnly ? 0 : 1);
  const matrixActions = { perms, readOnly, onToggle, onSelectAll, onClearAll };

  const totalPossible = modules.length * PERMISSION_ACTIONS.length;
  const totalGranted = useMemo(() => {
    return modules.reduce((count, m) => count + (perms[m.id]?.length ?? 0), 0);
  }, [modules, perms]);

  const allModulesChecked = useMemo(() => {
    return (
      filteredModules.length > 0 &&
      filteredModules.every((m) => {
        const actions = perms[m.id] || [];
        return PERMISSION_ACTIONS.every((a) => actions.includes(a));
      })
    );
  }, [filteredModules, perms]);

  const handleToggleGlobalAll = () => {
    if (allModulesChecked) {
      for (const m of filteredModules) onClearAll(m.id);
    } else {
      for (const m of filteredModules) onSelectAll(m.id);
    }
  };

  const isColumnAllChecked = (action: PermissionAction) => {
    return (
      filteredModules.length > 0 &&
      filteredModules.every((m) => (perms[m.id] || []).includes(action))
    );
  };

  const handleToggleColumn = (action: PermissionAction) => {
    const colChecked = isColumnAllChecked(action);
    for (const m of filteredModules) {
      const current = perms[m.id] || [];
      const hasAction = current.includes(action);
      if (colChecked && hasAction) {
        onToggle(m.id, action);
      } else if (!colChecked && !hasAction) {
        onToggle(m.id, action);
      }
    }
  };

  const isGroupAllChecked = (groupModules: RbacModuleDef[]) => {
    return (
      groupModules.length > 0 &&
      groupModules.every((m) => {
        const actions = perms[m.id] || [];
        return PERMISSION_ACTIONS.every((a) => actions.includes(a));
      })
    );
  };

  const handleToggleGroup = (groupModules: RbacModuleDef[]) => {
    const allChecked = isGroupAllChecked(groupModules);
    for (const m of groupModules) {
      if (allChecked) {
        onClearAll(m.id);
      } else {
        onSelectAll(m.id);
      }
    }
  };

  if (modules.length === 0) {
    return (
      <div className={WORK_SURFACE}>
        <EmptyState title={t('users.permissions.emptyRoles')} compact />
      </div>
    );
  }

  return (
    <div className={WORK_SURFACE}>
      {/* Top Toolbar with Search & Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 border-b border-border/40">
        <div className="relative flex-1 min-w-search max-w-xs">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.columns.searchPlaceholder')}
            className="ps-8 pe-3 h-8 text-xs bg-muted/30"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>{totalGranted} / {totalPossible}</span>
          </div>
          {!readOnly && filteredModules.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleGlobalAll}
              className="h-8 px-2.5 text-xs font-bold gap-1 rounded-lg border-border cursor-pointer"
              aria-label={allModulesChecked ? t('common.deselect') : t('users.permissions.colAll')}
            >
              {allModulesChecked ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
              {allModulesChecked ? t('common.deselect') : t('users.permissions.colAll')}
            </Button>
          ) : null}
        </div>
      </div>

      {filteredModules.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title={t('common.columns.noMatches')}
            description={t('common.clearFilters')}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs"
              >
                {t('common.clearSearch')}
              </Button>
            }
            compact
          />
        </div>
      ) : (
        <>
          {/* Mobile Layout */}
          <div className="space-y-4 p-3 md:hidden">
            {groups.map((group) => {
              const groupChecked = isGroupAllChecked(group.modules);
              return (
                <section key={group.groupId} className="space-y-2">
                  {group.labelKey ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                          <BookOpen className="h-3.5 w-3.5 text-primary" aria-hidden />
                        </div>
                        <h3 className="text-xs font-bold text-foreground">{t(group.labelKey)}</h3>
                      </div>
                      {!readOnly && group.modules.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleGroup(group.modules)}
                          className="h-7 px-2 text-2xs font-semibold text-primary hover:bg-primary/10 gap-1 rounded-md"
                        >
                          {groupChecked ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                          <span>{groupChecked ? t('common.deselect') : t('users.permissions.colAll')}</span>
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                  {group.modules.map((moduleItem) => (
                    <PermissionMatrixMobileRow
                      key={moduleItem.id}
                      mod={moduleItem}
                      {...matrixActions}
                    />
                  ))}
                </section>
              );
            })}
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:block">
            <Table>
              <caption className="sr-only">{t('users.permissions.matrixCaption')}</caption>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                  <ModuleTableHeaderCell columnKey="module" className="min-w-input-filter px-3 py-2.5">
                    <span>{t('users.permissions.colModule')}</span>
                  </ModuleTableHeaderCell>
                  {PERMISSION_ACTIONS.map((permissionAction) => (
                    <ModuleTableHeaderCell
                      key={permissionAction}
                      columnKey={permissionAction}
                      className="w-16 px-1 py-1.5 text-center"
                    >
                      {!readOnly ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleColumn(permissionAction)}
                          className="h-7 w-full px-1 text-2xs font-semibold hover:bg-primary/10 gap-0.5 rounded-md cursor-pointer justify-center"
                          title={t(`users.permission.${permissionAction}`)}
                        >
                          <span>{t(`users.permission.${permissionAction}`)}</span>
                        </Button>
                      ) : (
                        <span>{t(`users.permission.${permissionAction}`)}</span>
                      )}
                    </ModuleTableHeaderCell>
                  ))}
                  {!readOnly ? (
                    <ModuleTableHeaderCell columnKey="all" className="px-2 py-2.5 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleToggleGlobalAll}
                        className="h-7 px-2 text-2xs font-bold text-primary hover:bg-primary/10 gap-1 rounded-md cursor-pointer"
                        aria-label={allModulesChecked ? t('common.deselect') : t('users.permissions.colAll')}
                        title={t('users.permissions.colAll')}
                      >
                        {allModulesChecked ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                        <span>{t('users.permissions.colAll')}</span>
                      </Button>
                    </ModuleTableHeaderCell>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {groups.map((group) => {
                  const groupChecked = isGroupAllChecked(group.modules);
                  return (
                    <React.Fragment key={group.groupId}>
                      {group.labelKey ? (
                        <TableRow className="bg-muted/25">
                          <TableCell colSpan={colSpan} className="px-3 py-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                                  <BookOpen className="h-3 w-3 text-primary" aria-hidden />
                                </div>
                                <span className="text-xs font-bold text-foreground">{t(group.labelKey)}</span>
                              </div>
                              {!readOnly && group.modules.length > 1 ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleGroup(group.modules)}
                                  className="h-6 px-2 text-2xs font-medium text-primary hover:bg-primary/10 gap-1 rounded-md"
                                >
                                  {groupChecked ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                                  <span>{groupChecked ? t('common.deselect') : t('users.permissions.colAll')}</span>
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null}
                      {group.modules.map((moduleItem) => (
                        <PermissionMatrixRow
                          key={moduleItem.id}
                          mod={moduleItem}
                          inGroup={!!group.labelKey}
                          {...matrixActions}
                        />
                      ))}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

export { PermissionMatrixRow } from '@/tenant/features/users/components/PermissionMatrixRow';
export { PermissionMatrixMobileRow } from '@/tenant/features/users/components/PermissionMatrixMobileRow';
