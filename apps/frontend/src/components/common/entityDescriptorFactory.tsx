import React, { type ReactNode } from "react";
import { formatMoney } from "@mms/shared";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import type {
  FieldDefinition,
  EntityDrawerSection,
  TableColumnDescriptor,
  EntityDescriptor,
  CreateEntityDescriptorOptions,
} from "@/types/entityRegistry";

/**
 * Factory creating a type-safe EntityDescriptor implementing SSOT declarative UI capabilities.
 */
export function createEntityDescriptor<T>(
  options: CreateEntityDescriptorOptions<T>,
): EntityDescriptor<T> {
  const {
    entityType,
    singularLabel,
    pluralLabel,
    idField,
    titleField,
    fields,
    defaultDrawerSectionTitle = "General Details",
    sectionTitleMap,
  } = options;

  const fieldMap = new Map<string, FieldDefinition<T>>();
  fields.forEach((field) => fieldMap.set(field.key, field));

  const getField = (key: string): FieldDefinition<T> | undefined => fieldMap.get(key);

  const getTableColumns = (): TableColumnDescriptor[] => {
    return fields
      .map((field, index) => ({
        id: field.key,
        label: field.label,
        order: field.tableOrder ?? (index + 1) * 10,
        enabled: field.defaultVisibleInTable ?? true,
        fixed: field.fixed ?? false,
      }))
      .sort((a, b) => a.order - b.order);
  };

  const getCardFields = (): FieldDefinition<T>[] => {
    return fields.filter(
      (field) => field.showInCardGrid !== false && field.cardSlot !== "hidden",
    );
  };

  const getDrawerSections = (): EntityDrawerSection<T>[] => {
    const sectionMap = new Map<string, FieldDefinition<T>[]>();
    const drawerFields = fields
      .filter((field) => !field.hideInDrawer)
      .sort((a, b) => (a.drawerOrder ?? 999) - (b.drawerOrder ?? 999));

    for (const field of drawerFields) {
      const sectionId = field.drawerSection || "general";
      if (!sectionMap.has(sectionId)) {
        sectionMap.set(sectionId, []);
      }
      sectionMap.get(sectionId)?.push(field);
    }

    return Array.from(sectionMap.entries()).map(([id, sectionFields]) => {
      let title: string;
      if (sectionTitleMap?.[id]) {
        title = sectionTitleMap[id]!;
      } else if (id === "general") {
        title = defaultDrawerSectionTitle;
      } else {
        title = id.charAt(0).toUpperCase() + id.slice(1);
      }
      return { id, title, fields: sectionFields };
    });
  };

  const getRawValue = (fieldKey: string, entity: T): unknown => {
    const field = getField(fieldKey);
    if (!field) return (entity as Record<string, unknown>)[fieldKey];
    if (field.accessor) return field.accessor(entity);
    return (entity as Record<string, unknown>)[fieldKey];
  };

  const formatFieldValue = (fieldKey: string, entity: T): string => {
    const field = getField(fieldKey);
    const rawValue = getRawValue(fieldKey, entity);

    if (rawValue === null || rawValue === undefined || rawValue === "") {
      return "—";
    }

    if (field?.formatValue) {
      return field.formatValue(rawValue, entity);
    }

    switch (field?.type) {
      case "currency":
        return typeof rawValue === "number" || typeof rawValue === "string"
          ? formatMoney(rawValue, field.currencyCode ?? "USD")
          : String(rawValue);
      case "boolean":
        return rawValue ? "Yes" : "No";
      case "date":
      case "datetime":
        return String(rawValue).slice(0, 10);
      case "badge":
      case "status": {
        const strVal = String(rawValue);
        return field.badgeVariantMap?.[strVal]?.label ?? strVal;
      }
      default:
        return String(rawValue);
    }
  };

  const renderFieldValue = (fieldKey: string, entity: T): ReactNode => {
    const field = getField(fieldKey);
    if (field?.renderValue) {
      return field.renderValue(entity);
    }

    const rawValue = getRawValue(fieldKey, entity);
    if (rawValue === null || rawValue === undefined || rawValue === "") {
      return <span className="text-muted-foreground">—</span>;
    }

    const aria = field?.ariaLabel
      ? typeof field.ariaLabel === "function"
        ? field.ariaLabel(rawValue, entity)
        : field.ariaLabel
      : undefined;

    if (field?.type === "badge" || field?.type === "status") {
      const strVal = String(rawValue);
      const customConfig = field.badgeVariantMap?.[strVal];
      if (customConfig?.className) {
        if (
          process.env.NODE_ENV === "development" &&
          !(Object.values(SEMANTIC_BADGE) as readonly string[]).includes(customConfig.className)
        ) {
          console.warn(
            `[entityDescriptorFactory] Badge className for field '${fieldKey}' value '${strVal}' does not match any SEMANTIC_BADGE token.`,
          );
        }
        return (
          <span
            aria-label={aria}
            className={`inline-flex items-center gap-1 font-bold rounded-md border text-xs px-2 py-0.5 ${customConfig.className}`}
          >
            {customConfig.label ?? strVal}
          </span>
        );
      }
      return <StatusBadge status={strVal} aria-label={aria} />;
    }

    if (field?.type === "phone" && typeof rawValue === "string") {
      return (
        <a
          href={`tel:${rawValue}`}
          aria-label={aria}
          className="text-primary hover:underline underline-offset-2 transition-colors"
        >
          {rawValue}
        </a>
      );
    }

    if (field?.type === "email" && typeof rawValue === "string") {
      return (
        <a
          href={`mailto:${rawValue}`}
          aria-label={aria}
          className="text-primary hover:underline underline-offset-2 transition-colors"
        >
          {rawValue}
        </a>
      );
    }

    return <span aria-label={aria}>{formatFieldValue(fieldKey, entity)}</span>;
  };

  return {
    entityType,
    singularLabel,
    pluralLabel,
    idField,
    titleField,
    fields,
    getField,
    getTableColumns,
    getCardFields,
    getDrawerSections,
    getRawValue,
    formatFieldValue,
    renderFieldValue,
  };
}
