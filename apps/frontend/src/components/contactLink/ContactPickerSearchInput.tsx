import React from "react";
import { Search, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContactPickerMenu } from "./ContactPickerMenu";
import ContactCreateModal from "./ContactCreateModal";
import type { ContactCreateDefaults } from "./ContactCreateModal";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import type { Contact } from "@mms/shared";

interface ContactPickerSearchInputProps {
  t: TranslationFunction;
  label: string;
  resolvedId: string;
  resolvedName: string;
  query: string;
  open: boolean;
  allowCreate: boolean;
  error: boolean;
  searchPlaceholder?: string;
  createActionLabel: string;
  menuRef: React.RefObject<HTMLDivElement>;
  anchorRef: React.RefObject<HTMLDivElement>;
  menuStyle: React.CSSProperties;
  matches: Contact[];
  isSearching: boolean;
  emptyTitle: string;
  emptyHint: string;
  createOpen: boolean;
  createQuery: string;
  createDefaults?: ContactCreateDefaults;
  onQueryChange: (value: string) => void;
  onOpen: () => void;
  onClearQuery: () => void;
  onOpenCreate: () => void;
  onCloseDropdown: () => void;
  onSelect: (contact: Contact) => void;
  onCloseCreate: () => void;
  onCreated: (contact: Contact) => void;
}

export function ContactPickerSearchInput({
  t,
  label,
  resolvedId,
  resolvedName,
  query,
  open,
  allowCreate,
  error,
  searchPlaceholder,
  createActionLabel,
  menuRef,
  anchorRef,
  menuStyle,
  matches,
  isSearching,
  emptyTitle,
  emptyHint,
  createOpen,
  createQuery,
  createDefaults,
  onQueryChange,
  onOpen,
  onClearQuery,
  onOpenCreate,
  onCloseDropdown,
  onSelect,
  onCloseCreate,
  onCreated,
}: ContactPickerSearchInputProps): React.JSX.Element {
  return (
    <div className="relative">
      <label htmlFor={resolvedId} className={FORM_LABEL}>{label}</label>
      <div ref={anchorRef} className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/75 pointer-events-none" />
        <Input
          id={resolvedId}
          name={resolvedName}
          className={cn(
            "ps-9.5",
            allowCreate ? (query ? "pe-16" : "pe-10") : (query ? "pe-9" : "pe-3"),
            error && "border-destructive focus-visible:ring-destructive",
          )}
          placeholder={searchPlaceholder ?? t("contacts.searchPlaceholder")}
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
            onOpen();
          }}
          onFocus={onOpen}
          autoComplete="off"
          aria-expanded={open}
          aria-controls={open ? `${resolvedId}-listbox` : undefined}
          role="combobox"
        />
        <div className="absolute end-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {query ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClearQuery}
              className="text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted shadow-none"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          ) : null}
          {allowCreate ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onMouseDown={(event) => {
                event.preventDefault();
                onOpenCreate();
                onCloseDropdown();
              }}
              title={createActionLabel}
              aria-label={createActionLabel}
              className="text-primary hover:text-primary hover:bg-primary/10 transition-colors rounded-md shadow-none"
            >
              <Plus className="w-4 h-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <ContactPickerMenu
        open={open}
        menuRef={menuRef}
        resolvedId={resolvedId}
        label={label}
        menuStyle={menuStyle}
        matches={matches}
        isSearching={isSearching}
        emptyTitle={emptyTitle}
        emptyHint={emptyHint}
        onSelect={onSelect}
      />

      {allowCreate ? (
        <ContactCreateModal
          open={createOpen}
          onClose={onCloseCreate}
          initialName={createQuery}
          createDefaults={createDefaults}
          onCreated={onCreated}
        />
      ) : null}
    </div>
  );
}
