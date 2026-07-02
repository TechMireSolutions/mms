import React, { useState, useRef } from "react";
import { AlertCircle, X, LucideIcon, Upload, MapPin, BrainCircuit, FileText, Camera, Star, ChevronDown, Check, Trash2 } from "lucide-react";
import { DatePicker } from "./DatePicker";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { FieldDefinition } from "@mms/shared";
import { uploadUserImage } from "@/lib/imageUpload";
import { cn } from "@/lib/utils";
import { AvatarCropper } from "./AvatarCropper";
import { FormSelect } from "./FormSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/hooks/useTranslation";
import { FORM_INPUT, FORM_LABEL, FORM_SELECT } from "./formStyles";
export const INPUT = FORM_INPUT;
export const SELECT = FORM_SELECT;
export const LABEL = FORM_LABEL;
export const COLLECTION_CARD = "rounded-xl border border-border bg-muted/20 p-3 space-y-3";
export const COLLECTION_BODY = "space-y-3";
export const TYPE_SELECT_WIDTH = "w-32";
const REMOVE_BTN = "text-muted-foreground/70 hover:text-destructive hover:bg-destructive/10";

/**
 * Uppercase caption used beside a card's type dropdown (e.g. "Type").
 */
export function CardTypeLabel({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{children}</span>
  );
}

interface CardRemoveButtonProps {
  onClick: () => void;
  label: string;
}

/**
 * Consistent 44×44 remove button for repeatable collection cards.
 */
export function CardRemoveButton({ onClick, label }: CardRemoveButtonProps): React.JSX.Element {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={`min-w-[44px] min-h-[44px] p-0 flex items-center justify-center rounded-lg transition-colors ${REMOVE_BTN}`}
      aria-label={label}
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}

export { FormSelect, type FormSelectOption } from "./FormSelect";

interface EditableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  /** When omitted, options are read-only (Setup-only editing — globle2 §5). */
  onUpdateOptions?: (options: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function EditableSelect({
  options,
  value,
  onChange,
  onUpdateOptions,
  placeholder,
  className = "w-28",
}: EditableSelectProps): React.JSX.Element {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("contacts.form.selectOption");
  const canEditOptions = Boolean(onUpdateOptions);
  const [open, setOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const handleAdd = () => {
    if (!onUpdateOptions) return;
    const text = customValue.trim();
    if (text && !options.includes(text)) {
      const nextOptions = [...options, text];
      onUpdateOptions(nextOptions);
      onChange(text);
      setCustomValue("");
    }
  };

  const handleRemove = (option: string, event: React.MouseEvent) => {
    if (!onUpdateOptions) return;
    event.stopPropagation();
    const nextOptions = options.filter((availableOption) => availableOption !== option);
    onUpdateOptions(nextOptions);
    if (value === option) {
      onChange(nextOptions[0] || "");
    }
  };

  const select = (option: string) => {
    onChange(option);
    setOpen(false);
  };

  const moveHighlight = (direction: 1 | -1) => {
    if (options.length === 0) return;
    setHighlightedIndex((prevIndex) => {
      const start = prevIndex < 0 ? (direction === 1 ? -1 : 0) : prevIndex;
      return (start + direction + options.length) % options.length;
    });
  };

  return (
    <Popover
      open={open}
      onOpenChange={(openState) => {
        setOpen(openState);
        setHighlightedIndex(openState ? Math.max(0, options.indexOf(value)) : -1);
      }}
    >
      <PopoverTrigger
        type="button"
        aria-label={resolvedPlaceholder}
        className={cn(
          "min-h-[44px] flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-left",
          className
        )}
      >
        <span className="truncate">{value || resolvedPlaceholder}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        collisionPadding={8}
        className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[13rem] max-h-[var(--radix-popover-content-available-height)] flex flex-col overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-xl divide-y divide-border/60"
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            moveHighlight(1);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            moveHighlight(-1);
          } else if (event.key === "Enter" && highlightedIndex >= 0 && (event.target as HTMLElement).tagName !== "INPUT") {
            event.preventDefault();
            select(options[highlightedIndex]);
          }
        }}
      >
        <div role="listbox" className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
          {options.map((option, index) => {
            const isSelected = value === option;
            const isHighlighted = index === highlightedIndex;
            return (
              <div
                key={option}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => select(option)}
                className={`flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-primary/5 text-primary font-semibold"
                    : isHighlighted
                      ? "bg-muted/70 text-foreground"
                      : "text-foreground"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Check className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                  <span className="truncate">{option}</span>
                </span>
                {canEditOptions ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={(event) => handleRemove(option, event)}
                    className={`min-w-[28px] min-h-[28px] p-0 flex items-center justify-center rounded transition-colors ${REMOVE_BTN}`}
                    title={t("contacts.form.removeOption", { option })}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                ) : null}
              </div>
            );
          })}
          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground italic">{t("contacts.form.noOptions")}</div>
          )}
        </div>
        {canEditOptions ? (
        <div className="p-2 flex gap-1.5 bg-muted/20 flex-shrink-0">
          <Input
            type="text"
            value={customValue}
            onChange={(event) => setCustomValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
                handleAdd();
              }
            }}
            placeholder={t("contacts.form.addNewTypePlaceholder")}
            className="flex-1 min-w-0 px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/60 h-auto"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg flex-shrink-0"
          >
            {t("common.add")}
          </Button>
        </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  id?: string;
  children: React.ReactNode;
}

/**
 * Field wrapper component.
 * @param props Component properties.
 * @returns React element.
 */
export function Field({ label, required = false, hint = undefined, error = undefined, id, children }: FieldProps): React.JSX.Element {
  return (
    <div id={id} data-field-key={id}>
      <span className={LABEL}>
        {label}
        {required && <span className="text-destructive ms-0.5">*</span>}
      </span>
      {children}
      {error ? (
        <p className="text-[10px] text-destructive mt-1 font-medium">{error}</p>
      ) : (
        hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>
      )}
    </div>
  );
}

interface FormEmptyStateProps {
  icon: LucideIcon;
  text: string;
}

/**
 * Empty state placeholder component.
 * @param props Component properties.
 * @returns React element.
 */
export function FormEmptyState({ icon: Icon, text }: FormEmptyStateProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-border rounded-xl text-muted-foreground text-sm gap-2 bg-card">
      <Icon className="w-7 h-7 opacity-25" />
      <span>{text}</span>
    </div>
  );
}

interface RequiredBannerProps {
  message: string;
}

/**
 * Inline required warning banner component.
 * @param props Component properties.
 * @returns React element.
 */
export function RequiredBanner({ message }: RequiredBannerProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive font-semibold">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

interface TagsInputProps {
  selected?: string[];
  predefined?: string[];
  onChange: (tags: string[]) => void;
}

/**
 * TagsInput component for multi-selecting tags.
 * Shows predefined chips to toggle and a free-text input for custom tags.
 * @param props Component properties.
 * @returns React element.
 */
function TagsInput({ selected = [], predefined = [], onChange }: TagsInputProps): React.JSX.Element {
  const { t } = useTranslation();
  const [inputVal, setInputVal] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const toggle = (tag: string): void => {
    if (selected.includes(tag)) {
      onChange(selected.filter((selectedTag) => selectedTag !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  const addCustom = (raw: string): void => {
    const tag = raw.trim();
    if (!tag || selected.includes(tag)) return;
    onChange([...selected, tag]);
    setInputVal("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if ((event.key === "Enter" || event.key === ",") && inputVal.trim()) {
      event.preventDefault();
      addCustom(inputVal);
    } else if (event.key === "Backspace" && !inputVal && selected.length > 0) {
      onChange(selected.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2.5">
      
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
            >
              {tag}
              <Button
                type="button"
                variant="ghost"
                onClick={() => toggle(tag)}
                className="hover:text-primary/60 transition-colors min-h-[44px] min-w-[44px] p-0 flex items-center justify-center -me-2"
                aria-label={t("contacts.form.removeTag", { tag })}
              >
                <X className="w-3 h-3" />
              </Button>
            </span>
          ))}
        </div>
      )}

      
      {predefined.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {predefined.filter((predefinedTag) => !selected.includes(predefinedTag)).map((tag) => (
            <Button
              key={tag}
              type="button"
              variant="outline"
              onClick={() => toggle(tag)}
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-3 rounded-full text-xs font-medium border border-border bg-muted/50 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all"
            >
              + {tag}
            </Button>
          ))}
        </div>
      )}

      
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          className="flex-1"
          value={inputVal}
          onChange={(event) => setInputVal(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputVal.trim()) addCustom(inputVal);
          }}
          placeholder={t("contacts.form.typeTagPlaceholder")}
        />
        {inputVal.trim() && (
          <Button
            type="button"
            size="sm"
            onClick={() => addCustom(inputVal)}
            className="px-3 min-h-[44px] text-xs font-semibold flex-shrink-0"
          >
            {t("common.add")}
          </Button>
        )}
      </div>
    </div>
  );
}

export type CustomFieldConfig = FieldDefinition;

interface CustomFieldInputProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (fieldValue: unknown) => void;
  disabled?: boolean;
  error?: boolean;
}

/**
 * CustomFieldInput component to render dynamic custom fields of various types.
 * @param props Component properties.
 * @returns React element.
 */
export function CustomFieldInput({ field, value, onChange, disabled = false, error = false }: CustomFieldInputProps): React.JSX.Element {
  const { t } = useTranslation();
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const displayValue = value ?? "";

  const getOptionsArray = (options: string | string[] | undefined): string[] => {
    if (Array.isArray(options)) return options;
    if (typeof options === "string") {
      return options.split(",").map((option) => option.trim()).filter(Boolean);
    }
    return [];
  };

  if (field.type === "tags" || field.type === "multiselect" || field.type === "multi_select") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    const predefined = getOptionsArray(field.options);
    return <TagsInput selected={selected} predefined={predefined} onChange={onChange} />;
  }

  if (field.type === "textarea") {
    return (
      <textarea
        className={cn(INPUT, "resize-none h-20", error && "border-destructive focus-visible:ring-destructive")}
        value={String(displayValue)}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder || ""}
        disabled={disabled}
      />
    );
  }

  if (field.type === "select" || field.type === "single_select") {
    return (
      <FormSelect
        value={String(displayValue)}
        onChange={(val) => onChange(val)}
        options={getOptionsArray(field.options)}
        placeholder={t("contacts.form.selectOption")}
        disabled={disabled}
        className={error ? "border-destructive focus:border-destructive" : ""}
      />
    );
  }

  if (field.type === "boolean") {
    const isChecked = !!value;
    return (
      <div className="flex items-center gap-2 pt-1 h-[44px]">
        <Checkbox
          id={field.key}
          checked={isChecked}
          onCheckedChange={(isCheckedVal) => !disabled && onChange(!!isCheckedVal)}
          disabled={disabled}
          aria-label={t("contacts.form.toggleOption", { field: field.key })}
        />
        <span className="text-sm text-muted-foreground">{isChecked ? t("common.yes") : t("common.no")}</span>
      </div>
    );
  }

  if (field.type === "file") {
    const isAvatar = field.key === "avatar" || field.label.toLowerCase().includes("photo") || field.label.toLowerCase().includes("avatar") || field.label.toLowerCase().includes("image");
    const fileUrl = typeof value === "string" ? value : (value as { url?: string })?.url || null;
    const file = typeof value === "string" ? { name: "avatar.webp", url: value } : (value as { name: string; url: string; size?: number } | null);

    const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (isAvatar && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          if (typeof readerEvent.target?.result === "string") {
            setCropSrc(readerEvent.target.result);
          }
        };
        reader.readAsDataURL(file);
        event.target.value = "";
        return;
      }

      if (file.type.startsWith("image/")) {
        try {
          const url = await uploadUserImage(file, "general");
          onChange({
            name: file.name.replace(/\.[^/.]+$/, "") + ".avif",
            url,
            size: file.size,
            type: "image/avif",
          });
        } catch {
          // Upload failed; input is reset below.
        }
        event.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        onChange({
          name: file.name,
          url: readerEvent.target?.result,
          size: file.size,
          type: file.type,
        });
      };
      reader.readAsDataURL(file);
      event.target.value = "";
    };

    if (isAvatar) {
      const initials = "C";
      return (
        <div className="flex items-center gap-4">
          {cropSrc && (
            <AvatarCropper
              src={cropSrc}
              onCrop={(url: string) => {
                onChange(url);
                setCropSrc(null);
              }}
              onCancel={() => setCropSrc(null)}
            />
          )}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center border-2 border-border">
              {fileUrl ? (
                <img src={fileUrl} alt={field.label} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-primary">{initials}</span>
              )}
            </div>
            <label className="absolute -bottom-1 -end-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-md hover:bg-primary/90 transition-colors z-10">
              <Camera className="w-3 h-3" />
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
          </div>
          <div className="text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-0.5">{field.label}</p>
            <p>{t("contacts.form.uploadAvatarInstructions")}</p>
            <p className="text-[10px] opacity-80 mt-0.5">Recommended size: 300×300 px (stored as AVIF/WebP)</p>
            {fileUrl && (
              <Button
                type="button"
                variant="link"
                onClick={() => onChange(null)}
                className="text-destructive hover:text-destructive/90 mt-1 font-medium min-h-[44px] h-auto p-0"
              >
                {t("contacts.form.removePhoto")}
              </Button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {file ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted border border-border">
            <div className="flex items-center gap-2 overflow-hidden">
              <FileText className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs font-semibold truncate">{file.name}</span>
            </div>
            <Button variant="ghost" onClick={() => onChange(null)} className="min-w-[44px] min-h-[44px] p-0 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors" type="button">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border rounded-xl hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all">
            <Upload className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-bold text-muted-foreground">{t("contacts.form.clickToUploadDocument")}</span>
            <input type="file" className="hidden" onChange={handleFile} />
          </label>
        )}
      </div>
    );
  }

  if (field.type === "location") {
    const loc = (value as { lat: number; lng: number; address?: string }) || { lat: 24.8607, lng: 67.0011 };
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            step="any"
            placeholder={t("contacts.form.latitude")}
            value={loc.lat}
            onChange={(event) => onChange({ ...loc, lat: parseFloat(event.target.value) })}
          />
          <Input
            type="number"
            step="any"
            placeholder={t("contacts.form.longitude")}
            value={loc.lng}
            onChange={(event) => onChange({ ...loc, lng: parseFloat(event.target.value) })}
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-[10px] text-primary font-bold">
          <MapPin className="w-3 h-3" />
          <span>{t("contacts.form.locationSetTo", { lat: loc.lat.toFixed(4), lng: loc.lng.toFixed(4) })}</span>
        </div>
      </div>
    );
  }

  if (field.type === "ai_summary") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded w-fit">
          <BrainCircuit className="w-3 h-3" /> {t("contacts.form.aiInsights")}
        </div>
        <div className="p-3 rounded-xl bg-muted/40 border border-border text-[11px] text-muted-foreground italic leading-relaxed">
          {String(displayValue) || t("contacts.form.aiSummaryPlaceholder")}
        </div>
      </div>
    );
  }

  if (field.key === "rating") {
    const currentRating = Number(displayValue || 0);
    return (
      <div className="flex items-center gap-1.5 pt-1">
        {Array.from({ length: 5 }).map((_, index) => {
          const starValue = index + 1;
          return (
            <Button
              key={index}
              type="button"
              variant="ghost"
              onClick={() => onChange(starValue)}
              className={`w-11 h-11 p-0 flex items-center justify-center transition-all hover:scale-125 hover:bg-transparent ${
                starValue <= currentRating ? "text-primary hover:text-primary" : "text-muted-foreground/30 hover:text-muted-foreground/40"
              }`}
            >
              <Star className={`w-5 h-5 ${starValue <= currentRating ? "fill-primary" : "fill-transparent"}`} />
            </Button>
          );
        })}
        {currentRating > 0 && (
          <span className="text-xs text-muted-foreground ms-2 font-medium">
            {currentRating} {t("contacts.form.outOf5Stars")}
          </span>
        )}
      </div>
    );
  }

  if (field.type === "datetime") {
    let formattedVal = "";
    if (displayValue) {
      try {
        const parsedDate = new Date(String(displayValue));
        if (!isNaN(parsedDate.getTime())) {
          formattedVal = parsedDate.toISOString().slice(0, 16);
        }
      } catch {
        formattedVal = String(displayValue);
      }
    }
    return (
      <Input
        type="datetime-local"
        value={formattedVal}
        onChange={(event) => onChange(event.target.value ? new Date(event.target.value).toISOString() : null)}
        disabled={disabled}
        readOnly={disabled}
        className={error ? "border-destructive focus-visible:ring-destructive" : ""}
      />
    );
  }

  if (field.type === "currency") {
    return (
      <div className="relative">
        <Input
          type="text"
          value={String(displayValue)}
          onChange={(event) => {
            const inputValue = event.target.value;
            if (inputValue === "" || /^[0-9]*\.?[0-9]*$/.test(inputValue)) {
              onChange(inputValue);
            }
          }}
          placeholder={field.placeholder || "0.00"}
          disabled={disabled}
          readOnly={disabled}
          className={cn("ps-7", error ? "border-destructive focus-visible:ring-destructive" : "")}
        />
        <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-muted-foreground text-sm font-semibold">
          ₨
        </div>
      </div>
    );
  }

  if (field.type === "date") {
    return (
      <DatePicker
        value={String(displayValue)}
        onChange={(dateVal) => onChange(dateVal)}
        disabled={disabled}
        className={error ? "border-destructive focus-within:border-destructive focus-within:ring-destructive" : ""}
      />
    );
  }
  const inputType = field.type === "number" ? "number" : "text";
  return (
    <Input
      type={inputType}
      value={String(displayValue)}
      onChange={(event) => onChange(event.target.value)}
      placeholder={field.mask || field.placeholder || ""}
      disabled={disabled}
      readOnly={disabled}
      className={error ? "border-destructive focus-visible:ring-destructive" : ""}
    />
  );
}
