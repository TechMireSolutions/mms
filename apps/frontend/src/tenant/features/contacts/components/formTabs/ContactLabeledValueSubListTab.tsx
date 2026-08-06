import type { LucideIcon } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import type { AppTranslationKey } from "@mms/shared";
import { listEnabledCustomContactFormFields, type Contact } from "@mms/shared";
import { Input } from "@/components/ui/input";
import { EditableSelect, TYPE_SELECT_WIDTH } from "@/components/ui/FormPrimitives";
import { ListFieldCard, ContactSubListShell, FieldInlineError } from "./ContactSubListCards";
import {
  ContactSubListCustomFields,
  withSubListCustomFieldDefaults,
} from "./ContactSubListCustomFields";
import type { ContactSubListKey, ContactSubListTabBaseProps } from "./types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

type ListItem = Record<string, unknown>;
type TranslateFn = (key: AppTranslationKey) => string;

export interface ContactLabeledValueSubListTabProps extends ContactSubListTabBaseProps {
  listKey: Extract<ContactSubListKey, "emails" | "socials">;
  labelFieldKey: string;
  valueFieldKey: string;
  options: string[];
  onUpdateOptions: (options: string[]) => void;
  resolveLabel: (raw: unknown, options: string[], t: TranslateFn) => string;
  emptyItem: (resolvedLabel: string) => ListItem;
  icon: LucideIcon;
  accentClass: string;
  iconClass: string;
  emptyMessage: string;
  addLabel: string;
  removeLabel: (index: number) => string;
  valuePlaceholder: string;
  valueInputType?: React.HTMLInputTypeAttribute;
  valueInputIdPrefix: string;
  labelSelectIdPrefix: string;
}

/**
 * Shared Emails / Socials form tab shell: label EditableSelect + single value Input.
 */
export function ContactLabeledValueSubListTab({
  contactDraft,
  getLocalId,
  listKey,
  labelFieldKey,
  valueFieldKey,
  options,
  onUpdateOptions,
  resolveLabel,
  emptyItem,
  icon: Icon,
  accentClass,
  iconClass,
  emptyMessage,
  addLabel,
  removeLabel,
  valuePlaceholder,
  valueInputType = "text",
  valueInputIdPrefix,
  labelSelectIdPrefix,
  getListItemError,
  isFieldEnabled,
  isFieldRequired,
  fields,
  formInstanceId,
  addSubListItem,
  ensureSubListItem,
  updateSubListItem,
  removeSubListItem,
}: ContactLabeledValueSubListTabProps): JSX.Element {
  const { t } = useTranslation();
  const showLabel = isFieldEnabled(listKey, labelFieldKey);
  const showValue = isFieldEnabled(listKey, valueFieldKey);
  const customFields = listEnabledCustomContactFormFields(fields, listKey);
  const allowAdd = showLabel || showValue || customFields.length > 0;
  const items = (contactDraft[listKey] as ListItem[] | undefined) ?? [];

  const makeEmpty = () =>
    withSubListCustomFieldDefaults(emptyItem(resolveLabel(undefined, options, t)), fields, listKey);
  const addItem = () => {
    addSubListItem(listKey, makeEmpty() as unknown as NonNullable<Contact[typeof listKey]>[number]);
  };
  const ensureItem = () => {
    ensureSubListItem(listKey, makeEmpty() as unknown as NonNullable<Contact[typeof listKey]>[number]);
  };
  const removeItem = (idx: number) => removeSubListItem(listKey, idx);
  const updateItem = (idx: number, patch: ListItem) =>
    updateSubListItem(listKey, idx, patch);

  return (
    <ContactSubListShell
      isEmpty={items.length === 0}
      emptyIcon={Icon}
      emptyMessage={emptyMessage}
      addLabel={addLabel}
      onAdd={addItem}
      onEnsureRow={ensureItem}
      allowAdd={allowAdd}
    >
      <AnimatePresence initial={false}>
        {items.map((item, idx) => {
          const valueError = getListItemError(listKey, valueFieldKey, idx);
          const labelValue = resolveLabel(item[labelFieldKey], options, t);
          const rawValue = item[valueFieldKey];
          const stringValue = typeof rawValue === "string" ? rawValue : "";
          return (
            <ListFieldCard
              key={getLocalId(listKey, idx)}
              id={getLocalId(listKey, idx)}
              index={idx}
              icon={Icon}
              accentClass={accentClass}
              iconClass={iconClass}
              label={`${t("contacts.form.type")}:`}
              typeSelect={
                showLabel ? (
                  <EditableSelect
                    options={options}
                    value={labelValue}
                    onChange={(val) => updateItem(idx, { [labelFieldKey]: val })}
                    onUpdateOptions={onUpdateOptions}
                    className={TYPE_SELECT_WIDTH}
                    id={`${labelSelectIdPrefix}-${idx}`}
                    name={`${labelSelectIdPrefix}-${idx}`}
                  />
                ) : undefined
              }
              onRemove={() => removeItem(idx)}
              removeLabel={removeLabel(idx + 1)}
            >
              <div className="space-y-3">
                {showValue ? (
                  <>
                    <div className="relative flex items-center group/input">
                      <Icon className="pointer-events-none absolute start-3.5 h-4 w-4 text-muted-foreground/60 transition-colors group-focus-within/input:text-primary" />
                      <Input
                        type={valueInputType}
                        id={`${valueInputIdPrefix}-${idx}`}
                        name={`${valueInputIdPrefix}-${idx}`}
                        value={stringValue}
                        required={isFieldRequired(listKey, valueFieldKey)}
                        onChange={(e) => updateItem(idx, { [valueFieldKey]: e.target.value })}
                        placeholder={valuePlaceholder}
                        className={cn(
                          "ps-10",
                          valueError && "border-destructive focus-visible:ring-destructive",
                        )}
                      />
                    </div>
                    <FieldInlineError message={valueError} />
                  </>
                ) : null}
                <ContactSubListCustomFields
                  tabId={listKey}
                  fields={fields}
                  formInstanceId={formInstanceId}
                  rowIndex={idx}
                  row={item}
                  getListItemError={getListItemError}
                  onPatch={(patch) => updateItem(idx, patch)}
                />
              </div>
            </ListFieldCard>
          );
        })}
      </AnimatePresence>
    </ContactSubListShell>
  );
}
