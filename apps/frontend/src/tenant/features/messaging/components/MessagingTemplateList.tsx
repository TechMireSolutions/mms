import React from "react";
import { Tag } from "lucide-react";
import type { MessageTemplate } from "@mms/shared";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormSelect } from "@/components/ui/FormSelect";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";
import { SearchBar } from "@/components/ui/SearchBar";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { ChannelBadge } from "@/components/ui/ChannelBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { MessagingTemplateActionButtons } from "./MessagingTemplateActionButtons";

export interface MessagingTemplateListProps {
  templates: MessageTemplate[];
  canWrite: boolean;
  search: string;
  categoryFilter: string;
  categorySelectOptions: { value: string; label: string }[];
  categoryBadgeConfig: Record<string, StatusBadgeConfigItem>;
  getColumnWidth: (col: string) => number | undefined;
  setColumnWidth: (col: string, width: number) => void;
  onSearch: (value: string) => void;
  onCategoryFilter: (value: string) => void;
  onCopy: (body: string) => void;
  onDuplicate: (template: MessageTemplate) => void;
  onEdit: (template: MessageTemplate) => void;
  onDeleteRequest: (id: string) => void;
}

export const MessagingTemplateList = (function MessagingTemplateList({
  templates,
  canWrite,
  search,
  categoryFilter,
  categorySelectOptions,
  categoryBadgeConfig,
  getColumnWidth,
  setColumnWidth,
  onSearch,
  onCategoryFilter,
  onCopy,
  onDuplicate,
  onEdit,
  onDeleteRequest,
}: MessagingTemplateListProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className={`${WORK_SURFACE} space-y-4 p-4 md:col-span-2`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h4 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {t("messaging.configuredPresets")}
          </h4>
          <p className="text-xs text-muted-foreground">{t("messaging.configuredPresetsDesc")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto max-w-full">
          <FormSelect
            id="filterCategory"
            value={categoryFilter}
            onChange={onCategoryFilter}
            options={categorySelectOptions}
          />
          <SearchBar
            placeholder={t("messaging.search.placeholder")}
            value={search}
            onChange={onSearch}
            className="max-w-xs"
          />
        </div>
      </div>

      <div className="rounded-lg border border-border/50">
        {/* Mobile cards */}
        <div className="space-y-3 p-3 md:hidden">
          {templates.map((template) => (
            <article key={template.id} className={`${WORK_SURFACE_INNER} space-y-3 p-3`}>
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-semibold text-foreground">
                    {template.labelKey ? t(template.labelKey as Parameters<typeof t>[0]) : template.label}
                  </h4>
                  {template.channel && template.channel !== "all" && (
                    <div className="mt-1">
                      <ChannelBadge channel={template.channel} className="text-xs" />
                    </div>
                  )}
                </div>
                <StatusBadge status={template.category || "general"} config={categoryBadgeConfig} size="sm" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">{t("messaging.templateCopy")}</p>
                <p className="text-xs text-muted-foreground">{template.body}</p>
              </div>
              <div className="flex flex-wrap items-center">
                <MessagingTemplateActionButtons
                  template={template}
                  canWrite={canWrite}
                  onCopy={onCopy}
                  onDuplicate={onDuplicate}
                  onEdit={onEdit}
                  onDeleteRequest={onDeleteRequest}
                />
              </div>
            </article>
          ))}
          {templates.length === 0 && <EmptyState title={t("messaging.noTemplates")} compact />}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <Table className="table-fixed text-start text-xs">
            <TableHeader className="bg-muted/40 font-semibold uppercase tracking-wider text-muted-foreground">
              <TableRow className="border-b border-border/60">
                {(["label", "category", "body"] as const).map((column) => (
                  <ResizableTableHead
                    key={column}
                    columnKey={column}
                    width={getColumnWidth(column)}
                    onResize={setColumnWidth}
                    className="px-4 py-2.5"
                  >
                    {column === "label"
                      ? t("messaging.templateLabel")
                      : column === "category"
                        ? t("messaging.category")
                        : t("messaging.templateCopy")}
                  </ResizableTableHead>
                ))}
                <TableHead className="w-32 px-4 py-2.5 text-center">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60">
              {templates.map((template) => (
                <TableRow key={template.id} className="transition-colors hover:bg-muted/5">
                  <TableCell className="flex items-center gap-1.5 px-4 py-3 font-semibold text-foreground">
                    <span>
                      {template.labelKey ? t(template.labelKey as Parameters<typeof t>[0]) : template.label}
                    </span>
                    {template.channel && template.channel !== "all" && (
                      <ChannelBadge channel={template.channel} className="text-xs" />
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <StatusBadge status={template.category || "general"} config={categoryBadgeConfig} size="sm" />
                  </TableCell>
                  <TableCell className="max-w-sm truncate px-4 py-3 text-muted-foreground" title={template.body}>
                    {template.body}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <MessagingTemplateActionButtons
                      template={template}
                      canWrite={canWrite}
                      onCopy={onCopy}
                      onDuplicate={onDuplicate}
                      onEdit={onEdit}
                      onDeleteRequest={onDeleteRequest}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {templates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-4">
                    <EmptyState title={t("messaging.noTemplates")} compact />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
});

export default MessagingTemplateList;
