import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { Loader2, Search, X } from "lucide-react";
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
  /** When true, replaces the search icon with a subtle spinning loader */
  isSearching?: boolean;
}

/**
 * SearchBar — consistent search input used across modules with full a11y,
 * virtual keyboard hints, ref forwarding, and animated loading feedback.
 */
export const SearchBar = (forwardRef<HTMLInputElement, SearchBarProps>(function SearchBar(
    {
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
      isSearching = false,
    },
    forwardedRef,
  ): React.JSX.Element {
    const { t } = useTranslation();
    const fallbackId = React.useId();
    const resolvedId = id || `search-input-${fallbackId.replace(/:/g, "")}`;
    const resolvedName = name || `searchQuery-${fallbackId.replace(/:/g, "")}`;
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement);

    const handleClear = (): void => {
      onChange("");
      inputRef.current?.focus();
    };

    return (
      <div className={cn("relative", className)}>
        {isSearching ? (
          <Loader2
            className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin pointer-events-none"
            aria-hidden="true"
          />
        ) : (
          <Search
            className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
        )}
        <Input
          ref={inputRef}
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoCapitalize="none"
          id={resolvedId}
          name={resolvedName}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && value && !disabled) {
              onChange("");
              event.stopPropagation();
            }
          }}
          placeholder={placeholder ?? t("common.searchPlaceholder")}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-keyshortcuts="/"
          aria-label={ariaLabel ?? placeholder ?? t("common.searchPlaceholder")}
          className={cn(
            "rounded-xl bg-card ps-10 pe-11 [&::-webkit-search-cancel-button]:hidden",
            inputClassName,
          )}
        />
        {value && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            aria-label={t("common.clearSearch")}
            className="absolute end-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
        )}
      </div>
    );
  }));
