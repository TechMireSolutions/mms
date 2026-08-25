import React from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  ariaLabel?: string;
}

/**
 * SearchBar — consistent search input used across modules.
 */
export const SearchBar = React.memo(function SearchBar({
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
  id,
  name,
  disabled = false,
  autoFocus = false,
  ariaLabel,
}: SearchBarProps): React.JSX.Element {
  const { t } = useTranslation();
  const fallbackId = React.useId();
  const resolvedId = id || `search-input-${fallbackId.replace(/:/g, "")}`;
  const resolvedName = name || `searchQuery-${fallbackId.replace(/:/g, "")}`;

  return (
    <div className={cn("relative", className)}>
      <Search
        className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
        aria-hidden="true"
      />
      <Input
        type="text"
        id={resolvedId}
        name={resolvedName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? t("common.searchPlaceholder")}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={ariaLabel ?? placeholder ?? t("common.searchPlaceholder")}
        className={cn("rounded-xl bg-card ps-10 pe-11", inputClassName)}
      />
      {value && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange("")}
          aria-label={t("common.clearSearch")}
          className="absolute end-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
});
