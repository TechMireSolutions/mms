import React from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
}

/**
 * SearchBar — consistent search input used across modules.
 *
 * @param {SearchBarProps} props - The component props.
 * @returns {React.ReactElement} The rendered SearchBar component.
 */
export function SearchBar({
  value,
  onChange,
  placeholder,
  className = "",
  id,
  name,
}: SearchBarProps): React.ReactElement {
  const { t } = useTranslation();
  const fallbackId = React.useId();
  const resolvedId = id || `search-input-${fallbackId.replace(/:/g, "")}`;
  const resolvedName = name || `searchQuery-${fallbackId.replace(/:/g, "")}`;

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        id={resolvedId}
        name={resolvedName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? t("common.searchPlaceholder")}
        className="rounded-xl bg-card ps-10 pe-11"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange("")}
          aria-label={t("common.clearSearch")}
          className="absolute end-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}
