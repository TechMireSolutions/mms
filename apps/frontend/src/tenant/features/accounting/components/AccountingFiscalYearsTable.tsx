import React from "react";
import { Lock, Pencil } from "lucide-react";
import { type FiscalYear, formatDate } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { DirectoryCardsGrid } from "@/components/ui/DirectoryCardsGrid";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";

export interface AccountingFiscalYearsTableProps {
  sortedYears: FiscalYear[];
  fyStatusConfig: Record<string, StatusBadgeConfigItem>;
  canEditSetup: boolean;
  onEditFiscalYear: (fiscalYear: Partial<FiscalYear>) => void;
  onRequestCloseFiscalYear?: (fiscalYearId: string) => void;
  viewMode: WorkDirectoryViewMode;
  t: TranslationFunction;
}

export function AccountingFiscalYearsTable({
  sortedYears,
  fyStatusConfig,
  canEditSetup,
  onEditFiscalYear,
  onRequestCloseFiscalYear,
  viewMode,
  t,
}: AccountingFiscalYearsTableProps): React.JSX.Element {
  return (
    <div className={WORK_SURFACE}>
      {viewMode === "cards" ? (
        <DirectoryCardsGrid className="p-3">
          {sortedYears.map((fiscalYear) => (
            <DirectoryEntityCard key={fiscalYear.id} className={`${WORK_SURFACE_INNER} space-y-2 p-3`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-foreground m-0">{fiscalYear.label}</h4>
                  <p className="text-xs text-muted-foreground m-0 mt-0.5">
                    {formatDate(fiscalYear.startDate)} → {formatDate(fiscalYear.endDate)}
                  </p>
                </div>
                <StatusBadge status={fiscalYear.status} config={fyStatusConfig} size="sm" />
              </div>
              {canEditSetup && (
                <div className="flex items-center justify-end gap-1 border-t border-border pt-2">
                  {onRequestCloseFiscalYear && fiscalYear.status !== "closed" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRequestCloseFiscalYear(fiscalYear.id)}
                      className="min-h-11 min-w-11 text-xs"
                      aria-label={`${t("accounting.settings.fy.close")} ${fiscalYear.label}`}
                      title={t("accounting.settings.fy.closeConfirmTitle")}
                    >
                      <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditFiscalYear(fiscalYear)}
                    className="min-h-11 min-w-11 text-xs"
                    aria-label={`${t("common.edit")} ${fiscalYear.label}`}
                  >
                    <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                  </Button>
                </div>
              )}
            </DirectoryEntityCard>
          ))}
          {sortedYears.length === 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground m-0 col-span-full">{t("accounting.settings.noFiscalYears")}</p>
          )}
        </DirectoryCardsGrid>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("accounting.settings.fy.label")}</TableHead>
                <TableHead>{t("accounting.settings.fy.startDateField")}</TableHead>
                <TableHead>{t("accounting.settings.fy.endDateField")}</TableHead>
                <TableHead>{t("accounting.settings.fy.status")}</TableHead>
                {canEditSetup && <TableHead className="text-end">{t("accounting.settings.fy.actions")}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedYears.map((fiscalYear) => (
                <TableRow key={fiscalYear.id}>
                  <TableCell className="font-semibold text-foreground">{fiscalYear.label}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(fiscalYear.startDate)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(fiscalYear.endDate)}</TableCell>
                  <TableCell>
                    <StatusBadge status={fiscalYear.status} config={fyStatusConfig} size="sm" />
                  </TableCell>
                  {canEditSetup && (
                    <TableCell className="text-end">
                      <div className="flex items-center justify-end gap-1">
                        {onRequestCloseFiscalYear && fiscalYear.status !== "closed" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onRequestCloseFiscalYear(fiscalYear.id)}
                            className="min-h-11 min-w-11"
                            aria-label={`${t("accounting.settings.fy.close")} ${fiscalYear.label}`}
                            title={t("accounting.settings.fy.closeConfirmTitle")}
                          >
                            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditFiscalYear(fiscalYear)}
                          className="min-h-11 min-w-11"
                          aria-label={`${t("common.edit")} ${fiscalYear.label}`}
                        >
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {sortedYears.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canEditSetup ? 5 : 4} className="py-6 text-center text-xs text-muted-foreground">
                    {t("accounting.settings.noFiscalYears")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
