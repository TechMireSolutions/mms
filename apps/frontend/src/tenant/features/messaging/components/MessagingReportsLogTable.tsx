import React from "react";
import { Clock, RotateCcw } from "lucide-react";
import {
  formatDateTime,
  getInitials,
  type Message,
} from "@mms/shared";
import { Button } from "@/components/ui/button";
import { ChannelBadge } from "@/components/ui/ChannelBadge";
import { ListPagination } from "@/components/ui/ListPagination";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";

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
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Clock className="mb-2 h-8 w-8 opacity-40" />
        <p className="text-sm font-medium">{t("messaging.noLogs")}</p>
      </div>
    );
  }

  const getColumnLabel = (column: MessagingLogColumn): string => {
    if (column === "recipient") return t("messaging.recipient");
    if (column === "channel") return t("messaging.channel");
    if (column === "body") return t("messaging.messageBody");
    return t("messaging.dateSent");
  };

  return (
    <div aria-busy={isFetching ? true : undefined}>
      <div className="rounded-lg border border-border/50">
        <div className="space-y-3 p-3 md:hidden">
          {logs.map((log) => {
            const name = getRecipientName(log.contactId);
            return (
              <article key={log.id} className="space-y-3 rounded-xl border border-border bg-card p-3">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                      {getInitials(name)}
                    </span>
                    <span className="min-w-0 truncate text-sm font-semibold text-foreground">{name}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <ChannelBadge channel={log.channel} />
                    <StatusBadge status={log.status || "sent"} size="sm" config={logStatusConfig} />
                  </div>
                </div>
                <dl className="grid grid-cols-1 gap-2 text-sm">
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("messaging.messageBody")}</dt>
                    <dd className="text-xs text-muted-foreground">{log.body}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("messaging.dateSent")}</dt>
                    <dd className="font-mono text-xs text-muted-foreground">{formatDateTime(log.sentAt)}</dd>
                  </div>
                </dl>
                {canWrite && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onResendLog(log)}
                    className="w-full text-xs font-semibold text-primary hover:bg-primary/10"
                  >
                    <RotateCcw className="me-1 h-3.5 w-3.5" />
                    {t("messaging.resend")}
                  </Button>
                )}
              </article>
            );
          })}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full table-fixed text-start text-sm">
            <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                {columns.map((column) => (
                  <ResizableTableHead
                    key={column}
                    columnKey={column}
                    width={getColumnWidth(column)}
                    onResize={setColumnWidth}
                    className="px-4 py-3"
                  >
                    {getColumnLabel(column)}
                  </ResizableTableHead>
                ))}
                <th className="px-4 py-3 text-center">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {logs.map((log) => {
                const name = getRecipientName(log.contactId);
                return (
                  <tr key={log.id} className="transition-colors hover:bg-muted/10">
                    <td className="flex items-center gap-2 px-4 py-3 font-semibold text-foreground">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                        {getInitials(name)}
                      </span>
                      {name}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <ChannelBadge channel={log.channel} />
                        <StatusBadge status={log.status || "sent"} size="sm" config={logStatusConfig} />
                      </div>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-muted-foreground" title={log.body}>{log.body}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{formatDateTime(log.sentAt)}</td>
                    <td className="px-4 py-3 text-center">
                      {canWrite && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onResendLog(log)}
                          className="text-xs font-semibold text-primary hover:bg-primary/10"
                        >
                          <RotateCcw className="me-1 h-3.5 w-3.5" />
                          {t("messaging.resend")}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
