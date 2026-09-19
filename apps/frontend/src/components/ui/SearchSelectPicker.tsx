import React from "react";
import { FORM_INPUT } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";
import { Field } from "@/components/ui/FormPrimitives";
import { Input } from "@/components/ui/input";

export interface SearchSelectPickerOption {
  id: string;
  label: string;
}

/**
 * Search box + select pair for picking one record out of a searched, paged
 * list (students, staff, …). Shared by every feature that needs this pattern
 * so the search/select wiring has one authority.
 */
export function SearchSelectPicker({
  id,
  label,
  searchPlaceholder,
  emptyOptionLabel,
  value,
  search,
  options,
  onSearchChange,
  onPick,
}: {
  id: string;
  label: string;
  searchPlaceholder: string;
  emptyOptionLabel: string;
  value: string;
  search: string;
  options: SearchSelectPickerOption[];
  onSearchChange: (value: string) => void;
  onPick: (id: string, label: string) => void;
}): React.JSX.Element {
  return (
    <div className="sm:col-span-2 space-y-2">
      <Field id={`${id}-search`} label={label}>
        <Input
          id={`${id}-search`}
          name={`${id}Search`}
          className={FORM_INPUT}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
        />
      </Field>
      <FormSelect
        id={`${id}-pick`}
        name={`${id}Pick`}
        aria-label={label}
        value={value}
        onChange={(pickedId) => {
          const selected = options.find((option) => option.id === pickedId);
          onPick(pickedId, selected?.label ?? "");
        }}
        options={[
          { value: "", label: emptyOptionLabel },
          ...options.map((option) => ({ value: option.id, label: option.label })),
        ]}
      />
    </div>
  );
}
