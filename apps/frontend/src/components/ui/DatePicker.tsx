import * as React from "react"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { isRadixSelectPortalTarget } from "@/components/ui/select"
import { YearPickerGrid } from "@/components/ui/YearPickerGrid"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/useTranslation"
import { useDatePickerState } from "@/components/ui/useDatePickerState"

export interface DatePickerProps {
  value?: string | number | Date | null
  onChange?: (value: string) => void
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  min?: string | number | null
  max?: string | number | null
  id?: string
  name?: string
  required?: boolean
  autoComplete?: string
  mode?: "date" | "year"
  yearOnly?: boolean
  minYear?: number | null
  maxYear?: number | null
  "aria-label"?: string
  "aria-invalid"?: boolean
  "aria-describedby"?: string
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  {
    value,
    onChange,
    onBlur,
    placeholder,
    className,
    disabled,
    min,
    max,
    id,
    name,
    required,
    autoComplete,
    mode = "date",
    yearOnly,
    minYear,
    maxYear,
    "aria-label": ariaLabel,
    "aria-invalid": ariaInvalid,
    "aria-describedby": ariaDescribedBy,
  },
  ref,
) {
  const { t } = useTranslation()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const {
    open,
    setOpen,
    inputValue,
    fallbackId,
    dateFormat,
    dateValue,
    displayMonth,
    setDisplayMonth,
    disabledDays,
    startMonth,
    endMonth,
    isTodayAllowed,
    handleSelect,
    handleSelectToday,
    handleInputChange,
    handleBlur,
    handleClear,
    // Year Mode
    isYearMode,
    selectedYear,
    resolvedMinYear,
    resolvedMaxYear,
    yearPageStart,
    goToPreviousYearPage,
    goToNextYearPage,
    handleSelectYear,
    handleSelectThisYear,
    isThisYearAllowed,
  } = useDatePickerState({
    value,
    onChange,
    onBlur,
    min,
    max,
    mode,
    yearOnly,
    minYear,
    maxYear,
  })

  const resolvedId = id || fallbackId
  const resolvedName = name || fallbackId
  const resolvedPlaceholder = placeholder || (isYearMode ? "YYYY" : dateFormat)

  const keepOpenForChrome = (event: { target: EventTarget | null; preventDefault: () => void }) => {
    const target = event.target
    if (isRadixSelectPortalTarget(target)) {
      event.preventDefault()
      return
    }
    if (target instanceof Node && rootRef.current?.contains(target)) {
      event.preventDefault()
    }
  }

  const hiddenValue =
    typeof value === "string"
      ? value
      : typeof value === "number"
        ? String(value)
        : value instanceof Date
          ? isYearMode
            ? String(value.getFullYear())
            : value.toISOString().split("T")[0]
          : ""

  return (
    <div
      ref={rootRef}
      className={cn(
        "group relative flex min-h-11 w-full items-center rounded-lg border border-border bg-background px-3 text-sm text-foreground transition-all hover:border-border/80 focus-within:border-primary/40 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/20",
        className,
      )}
    >
      <Popover modal open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          type="button"
          disabled={disabled}
          className="me-2 min-h-11 min-w-11 flex items-center justify-center hover:bg-muted/80 rounded-md text-muted-foreground group-focus-within:text-primary hover:text-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          aria-label={isYearMode ? t("datePicker.openYearAria") : t("datePicker.openAria")}
        >
          <CalendarIcon className="h-4 w-4 transition-colors opacity-80" />
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 border border-border/80 shadow-xl bg-background/95 backdrop-blur-xl rounded-2xl overflow-hidden"
          align="start"
          onInteractOutside={keepOpenForChrome}
          onFocusOutside={keepOpenForChrome}
        >
          {isYearMode ? (
            <YearPickerGrid
              selectedYear={selectedYear}
              yearPageStart={yearPageStart}
              minYear={resolvedMinYear}
              maxYear={resolvedMaxYear}
              onSelectYear={handleSelectYear}
              onPreviousPage={goToPreviousYearPage}
              onNextPage={goToNextYearPage}
              onClear={handleClear}
              onSelectThisYear={handleSelectThisYear}
              isThisYearAllowed={isThisYearAllowed}
              hasValue={Boolean(value)}
              disabled={disabled}
            />
          ) : (
            <>
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={handleSelect}
                month={displayMonth}
                onMonthChange={setDisplayMonth}
                disabled={disabledDays}
                captionLayout="dropdown"
                startMonth={startMonth}
                endMonth={endMonth}
                autoFocus
              />
              <div className="flex items-center justify-between border-t border-border/60 px-3.5 py-2 bg-muted/20">
                <button
                  type="button"
                  onClick={() => handleClear()}
                  disabled={!value || disabled}
                  className="text-xs font-medium text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors cursor-pointer disabled:cursor-not-allowed px-2 py-1 rounded-md hover:bg-destructive/10"
                >
                  {t("datePicker.clear")}
                </button>
                <button
                  type="button"
                  onClick={handleSelectToday}
                  disabled={!isTodayAllowed || disabled}
                  className="text-xs font-semibold text-primary hover:text-primary/80 disabled:opacity-30 disabled:hover:text-primary transition-colors cursor-pointer disabled:cursor-not-allowed px-2.5 py-1 rounded-md hover:bg-primary/10"
                >
                  {t("datePicker.today")}
                </button>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>

      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        maxLength={isYearMode ? 4 : undefined}
        id={resolvedId}
        name={resolvedName}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        autoComplete={autoComplete}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            handleBlur()
            setOpen(false)
          } else if (event.key === "Escape") {
            setOpen(false)
          } else if (event.key === "ArrowDown" && (event.altKey || !open)) {
            event.preventDefault()
            setOpen(true)
          }
        }}
        placeholder={resolvedPlaceholder}
        disabled={disabled}
        className="min-h-11 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel || (isYearMode ? t("datePicker.enterYearAria") : t("datePicker.enterFormatAria", { format: dateFormat }))}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      />

      {value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="min-h-11 min-w-11 flex items-center justify-center hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive transition-colors cursor-pointer shrink-0 ms-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          aria-label={t("datePicker.clearAria")}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {required && !value && (
        <input
          id={`${resolvedId}-required-helper`}
          name={`${resolvedName}-required-helper`}
          type="text"
          className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
          required
          value=""
          onChange={() => {}}
          tabIndex={-1}
        />
      )}
      <input
        type="hidden"
        name={`${resolvedName}_hidden`}
        value={hiddenValue || ""}
      />
    </div>
  )
})
DatePicker.displayName = "DatePicker"
