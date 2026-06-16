import React, { useState, useRef } from "react";
import { AlertCircle, X, LucideIcon, Upload, MapPin, BrainCircuit, FileText, Camera, Star, ChevronDown, Check, Trash2 } from "lucide-react";
import { DatePicker } from "../../ui/DatePicker";
import { Popover, PopoverTrigger, PopoverContent } from "../../ui/popover";
import { optimizeImage, FieldDefinition } from "@mms/shared";
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import { cn } from "../../../lib/utils";
import AvatarCropper from "../AvatarCropper";
import FormSelect from "../../ui/FormSelect";
import useTranslation from "@/hooks/useTranslation";

// ── Shared style constants ─────────────────────────────────────────────────────
export const INPUT = "w-full px-3.5 py-2.5 min-h-[44px] rounded-lg border border-border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";
export const SELECT = INPUT + " cursor-pointer";
export const LABEL = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";

// Collection (repeatable) card chrome — one source of truth so every tab matches.
export const COLLECTION_CARD = "rounded-xl border border-border bg-muted/20 p-3 space-y-3";
// Body fields render full-width single-column so every text box is the same width.
export const COLLECTION_BODY = "space-y-3";
// Consistent width for the card-header "type" dropdown across tabs.
export const TYPE_SELECT_WIDTH = "w-32";

// Shared destructive affordance (config-overridable, no hardcoded Tailwind colour scattered around)
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
  const { uiStrings } = useContactConfig();
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors ${uiStrings?.deleteActionClass || REMOVE_BTN}`}
      aria-label={label}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

export { default as FormSelect, type FormSelectOption } from "../../ui/FormSelect";

interface EditableSelectProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  onUpdateOptions: (opts: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function EditableSelect({
  options,
  value,
  onChange,
  onUpdateOptions,
  placeholder = "Select...",
  className = "w-28",
}: EditableSelectProps): React.JSX.Element {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [customVal, setCustomVal] = useState("");
  const [highlight, setHighlight] = useState(-1);

  const handleAdd = () => {
    const text = customVal.trim();
    if (text && !options.includes(text)) {
      const next = [...options, text];
      onUpdateOptions(next);
      onChange(text);
      setCustomVal("");
    }
  };

  const handleRemove = (opt: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = options.filter((o) => o !== opt);
    onUpdateOptions(next);
    if (value === opt) {
      onChange(next[0] || "");
    }
  };

  const select = (opt: string) => {
    onChange(opt);
    setOpen(false);
  };

  const moveHighlight = (dir: 1 | -1) => {
    if (options.length === 0) return;
    setHighlight((h) => {
      const start = h < 0 ? (dir === 1 ? -1 : 0) : h;
      return (start + dir + options.length) % options.length;
    });
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        setHighlight(o ? Math.max(0, options.indexOf(value)) : -1);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={placeholder}
          className={cn(
            "min-h-[44px] flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-left",
            className
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronDown className={`w-4 h-4 flex-shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        collisionPadding={8}
        className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[13rem] max-h-[var(--radix-popover-content-available-height)] flex flex-col overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-xl divide-y divide-border/60"
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            moveHighlight(1);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            moveHighlight(-1);
          } else if (e.key === "Enter" && highlight >= 0 && (e.target as HTMLElement).tagName !== "INPUT") {
            e.preventDefault();
            select(options[highlight]);
          }
        }}
      >
        <div role="listbox" className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
          {options.map((opt, idx) => {
            const isSel = value === opt;
            const isHi = idx === highlight;
            return (
              <div
                key={opt}
                role="option"
                aria-selected={isSel}
                onMouseEnter={() => setHighlight(idx)}
                onClick={() => select(opt)}
                className={`flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${
                  isSel
                    ? "bg-primary/5 text-primary font-semibold"
                    : isHi
                      ? "bg-muted/70 text-foreground"
                      : "text-foreground"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Check className={`w-3.5 h-3.5 flex-shrink-0 ${isSel ? "opacity-100" : "opacity-0"}`} />
                  <span className="truncate">{opt}</span>
                </span>
                <button
                  type="button"
                  onClick={(e) => handleRemove(opt, e)}
                  className={`min-w-[28px] min-h-[28px] flex items-center justify-center rounded transition-colors ${REMOVE_BTN}`}
                  title={t("contacts.form.removeOption", { option: opt })}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground italic">{t("contacts.form.noOptions")}</div>
          )}
        </div>
        <div className="p-2 flex gap-1.5 bg-muted/20 flex-shrink-0">
          <input
            type="text"
            value={customVal}
            onChange={(e) => setCustomVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                handleAdd();
              }
            }}
            placeholder={t("contacts.form.addNewTypePlaceholder")}
            className="flex-1 min-w-0 px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/60"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="px-2.5 py-1.5 inline-flex items-center justify-center text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex-shrink-0"
          >
            {t("common.add")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

/**
 * Field wrapper component.
 * @param props Component properties.
 * @returns React element.
 */
export function Field({ label, required = false, hint = undefined, children }: FieldProps): React.JSX.Element {
  return (
    <div>
      <span className={LABEL}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </span>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
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
      onChange(selected.filter((t) => t !== tag));
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if ((e.key === "Enter" || e.key === ",") && inputVal.trim()) {
      e.preventDefault();
      addCustom(inputVal);
    } else if (e.key === "Backspace" && !inputVal && selected.length > 0) {
      onChange(selected.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
            >
              {tag}
              <button
                type="button"
                onClick={() => toggle(tag)}
                className="hover:text-primary/60 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"
                aria-label={t("contacts.form.removeTag", { tag })}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Predefined tag chips (only show un-selected ones) */}
      {predefined.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {predefined.filter((t) => !selected.includes(t)).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-3 rounded-full text-xs font-medium border border-border bg-muted/50 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all"
            >
              + {tag}
            </button>
          ))}
        </div>
      )}

      {/* Custom tag input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          className={`${INPUT} flex-1`}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputVal.trim()) addCustom(inputVal);
          }}
          placeholder={t("contacts.form.typeTagPlaceholder")}
        />
        {inputVal.trim() && (
          <button
            type="button"
            onClick={() => addCustom(inputVal)}
            className="px-3 min-h-[44px] rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex-shrink-0"
          >
            {t("common.add")}
          </button>
        )}
      </div>
    </div>
  );
}

export type CustomFieldConfig = FieldDefinition;

interface CustomFieldInputProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (val: unknown) => void;
}

/**
 * CustomFieldInput component to render dynamic custom fields of various types.
 * @param props Component properties.
 * @returns React element.
 */
export function CustomFieldInput({ field, value, onChange }: CustomFieldInputProps): React.JSX.Element {
  const { uiStrings } = useContactConfig();
  const { t } = useTranslation();
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const displayValue = value ?? "";

  const getOptionsArray = (opts: string | string[] | undefined): string[] => {
    if (Array.isArray(opts)) return opts;
    if (typeof opts === "string") {
      return opts.split(",").map((o) => o.trim()).filter(Boolean);
    }
    return [];
  };

  if (field.type === "tags" || field.type === "multiselect") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    const predefined = getOptionsArray(field.options);
    return <TagsInput selected={selected} predefined={predefined} onChange={onChange} />;
  }

  if (field.type === "textarea") {
    return (
      <textarea
        className={`${INPUT} resize-none h-20`}
        value={String(displayValue)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || ""}
      />
    );
  }

  if (field.type === "select") {
    return (
      <FormSelect
        value={String(displayValue)}
        onChange={(val) => onChange(val)}
        options={getOptionsArray(field.options)}
        placeholder={t("contacts.form.selectOption")}
      />
    );
  }

  if (field.type === "boolean") {
    const isChecked = !!value;
    return (
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => onChange(!isChecked)}
          aria-label={t("contacts.form.toggleOption", { field: field.key })}
          className={`w-11 h-11 flex-shrink-0 flex items-center justify-center transition-all bg-transparent`}
        >
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            isChecked ? "bg-primary border-primary" : "border-border bg-background"
          }`}>
            {isChecked && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
          </div>
        </button>
        <span className="text-sm text-muted-foreground">{isChecked ? t("common.yes") : t("common.no")}</span>
      </div>
    );
  }

  if (field.type === "file") {
    const isAvatar = field.key === "avatar" || field.label.toLowerCase().includes("photo") || field.label.toLowerCase().includes("avatar") || field.label.toLowerCase().includes("image");
    const fileUrl = typeof value === "string" ? value : (value as { url?: string })?.url || null;
    const file = typeof value === "string" ? { name: "avatar.webp", url: value } : (value as { name: string; url: string; size?: number } | null);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      let f = e.target.files?.[0];
      if (!f) return;

      if (f.type.startsWith("image/")) {
        f = await optimizeImage(f);
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === "string" && isAvatar) {
          setCropSrc(ev.target.result);
        } else {
          onChange({
            name: f.name,
            url: ev.target?.result,
            size: f.size,
            type: f.type
          });
        }
      };
      reader.readAsDataURL(f);
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
              uiStrings={uiStrings}
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
            <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-md hover:bg-primary/90 transition-colors">
              <Camera className="w-3 h-3" />
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
          </div>
          <div className="text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-0.5">{field.label}</p>
            <p>{t("contacts.form.uploadAvatarInstructions")}</p>
            {fileUrl && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="text-destructive hover:text-destructive/90 mt-1 font-medium min-h-[44px]"
              >
                {t("contacts.form.removePhoto")}
              </button>
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
            <button onClick={() => onChange(null)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors" type="button">
              <X className="w-3.5 h-3.5" />
            </button>
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
          <input
            className={INPUT}
            type="number"
            step="any"
            placeholder={t("contacts.form.latitude")}
            value={loc.lat}
            onChange={(e) => onChange({ ...loc, lat: parseFloat(e.target.value) })}
          />
          <input
            className={INPUT}
            type="number"
            step="any"
            placeholder={t("contacts.form.longitude")}
            value={loc.lng}
            onChange={(e) => onChange({ ...loc, lng: parseFloat(e.target.value) })}
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
        {Array.from({ length: 5 }).map((_, idx) => {
          const starValue = idx + 1;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(starValue)}
              className={`w-11 h-11 flex items-center justify-center transition-all hover:scale-125 focus:outline-none ${
                starValue <= currentRating ? "text-primary" : "text-muted-foreground/30"
              }`}
            >
              <Star className={`w-5 h-5 ${starValue <= currentRating ? "fill-primary" : "fill-transparent"}`} />
            </button>
          );
        })}
        {currentRating > 0 && (
          <span className="text-xs text-muted-foreground ml-2 font-medium">
            {currentRating} {t("contacts.form.outOf5Stars")}
          </span>
        )}
      </div>
    );
  }

  if (field.type === "date") {
    return (
      <DatePicker
        value={String(displayValue)}
        onChange={(val) => onChange(val)}
      />
    );
  }

  // Fallback to text, number inputs
  const inputType = field.type === "number" ? "number" : "text";
  return (
    <input
      className={INPUT}
      type={inputType}
      value={String(displayValue)}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.mask || field.placeholder || ""}
    />
  );
}
