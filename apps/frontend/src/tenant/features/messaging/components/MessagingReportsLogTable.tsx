import React from "react";
import { Clock, RotateCcw } from "lucide-react";
import {
  formatDateTime,
  getInitials,
  type Message,
} from "@mms/shared";
import { Button } from "@/components/ui/button";
import { ChannelBadge } from "@/components/ui/ChannelBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListPagination } from "@/components/ui/ListPagination";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { StatGrid, StatRow } from "@/components/ui/StatGrid";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { SEMANTIC_TEXT, SEMANTIC_BG } from "@/lib/semanticTone";

type MessagingLogColumn = "recipient" | "channel" | "body" | "dateSent";

interface MessagingReportsLogTableProps {
  logs: Message[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  canWrite: boolean;
  isPending: boolean;
  isFetching: boolean;
  logStatusConfig: Record<string, StatusBadgeConfigItem>;
  getRecipientName: (contactId: string | number) => string;
  getColumnWidth: (column: string) => number | undefined;
  setColumnWidth: (column: string, width: number) => void;
  onPageChange: (page: number) => void;
  onResendLog: (log: Message) => void;
}

export function MessagingReportsLogTable({
  logs,
  total,
  page,
  pageSize,
  hasMore,
  canWrite,
  isPending,
  isFetching,
  logStatusConfig,
  getRecipientName,
  getColumnWidth,
  setColumnWidth,
  onPageChange,
  onResendLog,
}: MessagingReportsLogTableProps): React.JSX.Element {
  const { t } = useTranslation();
  const columns: MessagingLogColumn[] = ["recipient", "channel", "body", "dateSent"];

  if (isPending && logs.length === 0) {
    return (
      <div role="status" aria-live="polite" aria-busy="true" className="rounded-lg border border-border/50 p-3">
        <TableSkeleton rows={6} cols={5} />
        <span className="sr-only">{t("common.loading")}</span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <EmptyState icon={Clock} title={t("messaging.noLogs")} compact />
    );
  }

  const getColumnLabel = (column: MessagingLogColumn): string => {
    if (column === "recipient") return t("messaging.recipient");
    if (column === "channel") return t("messaging.channel");
    if (column === "body") return t("messaging.messageBody");
    return t("messaging.dateSent");
  };

  return (
    <div aria-busy={isFetching ? true : undefined} className="space-y-4">
      <div className={cn(WORK_SURFACE, "overflow-hidden")}>
        <div className="space-y-3 p-3 md:hidden">
          {logs.map((log) => {
            const name = getRecipientName(log.contactId);
            return (
              <article key={log.id} className={`${WORK_SURFACE_INNER} space-y-3 p-3`}>
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${SEMANTIC_BG.primary} text-xs font-black ${SEMANTIC_TEXT.primary}`}>
                      {getInitials(name)}
                    </span>
                    <span className="min-w-0 truncate text-sm font-semibold text-foreground">{name}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <ChannelBadge channel={log.channel} />
                    <StatusBadge status={log.status || "sent"} size="sm" config={logStatusConfig} />
                  </div>
                </div>
                <StatGrid columns="1">
                  <StatRow
                    label={t("messaging.messageBody")}
                    value={log.body}
                    ddClassName="text-xs text-muted-foreground"
                  />
                  <StatRow
                    label={t("messaging.dateSent")}
                    value={formatDateTime(log.sentAt)}
                    ddClassName="font-mono text-xs text-muted-foreground"
                  />
                </StatGrid>
                {canWrite && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onResendLog(log)}
                    className={`w-full text-xs font-semibold ${SEMANTIC_TEXT.primary} hover:bg-primary/10`}
                  >
                    <RotateCcw className="me-1 h-3.5 w-3.5" />
                    {t("messaging.resend")}
                  </Button>
                )}
              </article>
            );
          })}
        </div>
        <div className="hidden md:block">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="border-b border-border/60 hover:bg-muted/30">
                {columns.map((column) => (
                  <ModuleTableHeaderCell
                    key={column}
                    columnKey={column}
                    width={getColumnWidth(column)}
                    onResize={setColumnWidth}
                    className="px-3 py-2.5"
                  >
                    {getColumnLabel(column)}
                  </ModuleTableHeaderCell>
                ))}
                <TableHead className="px-3 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase h-auto">
                  <span className="sr-only">{t("common.actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/50">
              {logs.map((log) => {
                const name = getRecipientName(log.contactId);
                return (
                  <TableRow key={log.id} className="transition-colors hover:bg-muted/20">
                    <TableCell className="flex items-center gap-2 px-3 py-2.5 font-semibold text-foreground">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full ${SEMANTIC_BG.primary} text-xs font-black ${SEMANTIC_TEXT.primary}`}>
                        {getInitials(name)}
                      </span>
                      {name}
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <ChannelBadge channel={log.channel} />
                        <StatusBadge status={log.status || "sent"} size="sm" config={logStatusConfig} />
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate px-3 py-2.5 text-muted-foreground" title={log.body}>{log.body}</TableCell>
                    <TableCell className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{formatDateTime(log.sentAt)}</TableCell>
                    <TableCell className="px-3 py-2.5 text-end">
                      {canWrite && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onResendLog(log)}
                          className={`text-xs font-semibold ${SEMANTIC_TEXT.primary} hover:bg-primary/10`}
                        >
                          <RotateCcw className="me-1 h-3.5 w-3.5" />
                          {t("messaging.resend")}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      <ListPagination
        page={page}
        total={total}
        limit={pageSize}
        hasMore={hasMore}
        onPageChange={onPageChange}
        i18nNamespace="messaging"
        variant="range"
      />
    </div>
  );
}
