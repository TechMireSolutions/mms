import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import type { AppTranslationKey, Contact } from "@mms/shared";
import { EditableSelect, Field } from "@/components/ui/FormPrimitives";
import { LeadingIconInput } from "@/components/ui/LeadingIconInput";
import { ListFieldCard, ContactSubListShell, resolveSubListAllowAdd } from "./ContactSubListCards";
import type { ContactSubListKey, ContactSubListTabBaseProps } from "./types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

export type ListItem = Record<string, unknown>;
export type TranslateFn = (key: AppTranslationKey) => string;

export interface ContactLabeledValueFieldContext {
  item: ListItem;
  index: number;
  updateItem: (idx: number, patch: ListItem) => void;
}

export interface ContactLabeledValueSubListTabProps extends ContactSubListTabBaseProps {
  listKey: Extract<ContactSubListKey, "emails" | "socials" | "phones">;
  labelFieldKey: string;
  valueFieldKey: string;
  valueLabel?: string;
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
  autoComplete?: string;
  inputMode?: "search" | "text" | "email" | "tel" | "url" | "numeric" | "none" | "decimal";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  spellCheck?: boolean;
  enterKeyHint?: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
  /** Optional leading control beside the value input (e.g. dial-code select). */
  valueLeadingAddon?: (ctx: ContactLabeledValueFieldContext) => ReactNode;
  /** Override default string patch when the value input changes (e.g. phone parse). */
  onValueChange?: (
    ctx: ContactLabeledValueFieldContext & { value: string },
  ) => void;
  onValueBlur?: (index: number) => void;
}

/**
 * Shared Emails / Socials / Phones form tab shell: label EditableSelect + value Input.
 */
export function ContactLabeledValueSubListTab({
  contactDraft,
  getLocalId,
  listKey,
  labelFieldKey,
  valueFieldKey,
  valueLabel,
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
  autoComplete,
  inputMode,
  autoCapitalize,
  spellCheck,
  enterKeyHint,
  valueLeadingAddon,
  onValueChange,
  onValueBlur,
  getListItemError,
  isFieldEnabled,
  isFieldRequired,
  fields,
  formInstanceId,
  addSubListItem,
  ensureSubListItem,
  updateSubListItem,
  removeSubListItem,
}: ContactLabeledValueSubListTabProps): React.JSX.Element {
  const { t } = useTranslation();
  const showLabel = isFieldEnabled(listKey, labelFieldKey);
  const showValue = isFieldEnabled(listKey, valueFieldKey);
  const allowAdd = resolveSubListAllowAdd([showLabel, showValue]);
  const items = (contactDraft[listKey] as ListItem[] | undefined) ?? [];

  const makeEmpty = () => emptyItem(resolveLabel(undefined, options, t));
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
          const fieldCtx: ContactLabeledValueFieldContext = {
            item,
            index: idx,
            updateItem,
          };
          const valueInput = (
            <LeadingIconInput
              icon={Icon}
              type={valueInputType}
              id={`${valueInputIdPrefix}-${idx}`}
              name={`${valueInputIdPrefix}-${idx}`}
              value={stringValue}
              required={isFieldRequired(listKey, valueFieldKey)}
              autoComplete={autoComplete}
              inputMode={inputMode}
              autoCapitalize={autoCapitalize}
              spellCheck={spellCheck}
              enterKeyHint={enterKeyHint}
              aria-invalid={Boolean(valueError)}
              onChange={(e) => {
                const value = e.target.value;
                if (onValueChange) {
                  onValueChange({ ...fieldCtx, value });
                  return;
                }
                updateItem(idx, { [valueFieldKey]: value });
              }}
              onBlur={onValueBlur ? () => onValueBlur(idx) : undefined}
              placeholder={valuePlaceholder}
              wrapperClassName="flex-1 min-w-0"
              className={cn(valueError && "border-destructive focus-visible:ring-destructive")}
            />
          );
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
                    className="w-36 @sm:w-48 min-w-0"
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
                  <Field
                    label={valueLabel || valuePlaceholder}
                    required={isFieldRequired(listKey, valueFieldKey)}
                    error={valueError}
                    id={`${valueInputIdPrefix}-${idx}`}
                  >
                    {valueLeadingAddon ? (
                      <div className="flex w-full items-center gap-2">
                        {valueLeadingAddon(fieldCtx)}
                        {valueInput}
                      </div>
                    ) : (
                      valueInput
                    )}
                  </Field>
                ) : null}
              </div>
            </ListFieldCard>
          );
        })}
      </AnimatePresence>
    </ContactSubListShell>
  );
}
