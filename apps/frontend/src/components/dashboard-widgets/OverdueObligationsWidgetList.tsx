import React from "react";
import { Link } from "react-router-dom";
import { Scale } from "lucide-react";
import { ROUTES } from "@/lib/config/routes";
import { useTranslation } from "@/hooks/useTranslation";
import { formatMoney, formatDate } from "@mms/shared";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { SearchBar } from "@/components/ui/SearchBar";
import { SimplePagination } from "@/components/ui/SimplePagination";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  OverdueUrgencyBadge,
  OverdueRemindButton,
  type OverdueStudent,
} from "@/components/dashboard-widgets/OverdueObligationsWidgetParts";
import { OverdueObligationsWidgetMobileList } from "@/components/dashboard-widgets/OverdueObligationsWidgetMobileList";

export interface OverdueObligationsWidgetListProps {
  expanded: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  paginatedStudents: OverdueStudent[];
  students: Array<{ id: string | number; phone?: string | null }>;
  remindedIds: Set<string>;
  canWriteMessaging: boolean;
  activeCurrencyCode: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRemind: (overdueStudent: OverdueStudent) => void;
}

export function OverdueObligationsWidgetList({
  expanded,
  searchQuery,
  onSearchChange,
  paginatedStudents,
  students,
  remindedIds,
  canWriteMessaging,
  activeCurrencyCode,
  currentPage,
  totalPages,
  onPageChange,
  onRemind,
}: OverdueObligationsWidgetListProps): React.ReactElement | null {
  const { t } = useTranslation();
  if (!expanded) return null;

  return (
    <>
          <div className="p-3 px-6 border-b border-border/40 flex items-center gap-2 bg-muted/10">
            <SearchBar
              placeholder={t("contacts.searchPlaceholder")}
              value={searchQuery}
              onChange={onSearchChange}
              className="flex-1 max-w-sm"
            />
          </div>

          <div className="space-y-3 p-3 md:hidden">
            <OverdueObligationsWidgetMobileList
              paginatedStudents={paginatedStudents}
              students={students}
              remindedIds={remindedIds}
              canWriteMessaging={canWriteMessaging}
              activeCurrencyCode={activeCurrencyCode}
              onRemind={onRemind}
              t={t}
            />
          </div>

          <div className="hidden overflow-x-auto md:block">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="border-b border-border/45 bg-muted/30 hover:bg-transparent">
                  <TableHead scope="col" className="px-5 py-3 text-start text-xs font-bold text-muted-foreground uppercase tracking-wider h-auto select-none">
                    {t("hasanat.columns.redemption.student")}
                  </TableHead>
                  <TableHead scope="col" className="px-3 py-3 text-start text-xs font-bold text-muted-foreground uppercase tracking-wider h-auto select-none">
                    {t("nav.obligations")}
                  </TableHead>
                  <TableHead scope="col" className="px-3 py-3 text-start text-xs font-bold text-muted-foreground uppercase tracking-wider h-auto select-none">
                    {t("finance.columns.dueDate")}
                  </TableHead>
                  <TableHead scope="col" className="px-3 py-3 text-end text-xs font-bold text-muted-foreground uppercase tracking-wider h-auto select-none">
                    {t("finance.columns.amount")}
                  </TableHead>
                  <TableHead scope="col" className="px-3 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider h-auto select-none">
                    {t("hasanat.columns.distribution.status")}
                  </TableHead>
                  {canWriteMessaging && (
                    <TableHead scope="col" className="px-3 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider h-auto select-none">
                      {t("hasanat.columns.actions")}
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/40">
                {paginatedStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canWriteMessaging ? 6 : 5} className="text-center py-8 text-xs text-muted-foreground select-none">
                      {t("finance.report.noInvoicesMatch")}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedStudents.map((overdueStudent) => {
                    const reminded = remindedIds.has(overdueStudent.id);
                    const student = students.find((entry) => String(entry.id) === String(overdueStudent.id));
                    const hasPhone = Boolean(student?.phone);
                    return (
                      <TableRow key={`${overdueStudent.id}-${overdueStudent.dueDate}-${overdueStudent.amount}`} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <UserAvatar id={overdueStudent.id} name={overdueStudent.name} className="w-7 h-7 rounded-full text-xs font-bold" />
                            <span className="font-semibold text-foreground text-xs">{overdueStudent.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                            <span className="text-xs text-foreground font-medium">{overdueStudent.obligationType}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <div>
                            <p className="text-xs text-foreground font-semibold m-0 tabular-nums">{formatDate(overdueStudent.dueDate)}</p>
                            <p className="text-xs text-destructive font-bold mt-0.5 m-0 uppercase tracking-wide tabular-nums">
                              {t("dashboard.widgets.daysOverdue", { count: overdueStudent.daysOverdue })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-end">
                          <span className="text-xs font-bold text-foreground tabular-nums">
                            {formatMoney(overdueStudent.amount, overdueStudent.currency || activeCurrencyCode)}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-center">
                          <OverdueUrgencyBadge daysOverdue={overdueStudent.daysOverdue} t={t} />
                        </TableCell>
                        {canWriteMessaging && (
                          <TableCell className="px-3 py-3 text-center">
                            <OverdueRemindButton
                              overdueStudent={overdueStudent}
                              reminded={reminded}
                              hasPhone={hasPhone}
                              onRemind={onRemind}
                              t={t}
                            />
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <footer className="px-5 py-3.5 border-t border-border/45 flex flex-wrap items-center justify-between gap-2 bg-muted/10 select-none">
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-xs font-bold text-success/90 uppercase tracking-wider m-0">
                {remindedIds.size > 0 && t("dashboard.widgets.remindersSent", { count: remindedIds.size })}
              </p>
              <SimplePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            </div>
            <Link to={ROUTES.finance} className="inline-flex min-h-11 items-center text-xs font-bold text-primary hover:underline">
              {t("dashboard.widgets.viewAllOutstanding")}
            </Link>
          </footer>
        </>
  );
}
