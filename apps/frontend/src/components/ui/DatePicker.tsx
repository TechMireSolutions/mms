import * as React from "react"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { getObject } from "../../lib/db"
import {
  type GlobalSettings,
  DEFAULT_GLOBAL_SETTINGS,
  formatIsoDateToDisplay,
  normalizeDateFormat,
  parseDisplayDateToIso,
  type DateFormatId,
} from "@mms/shared"

export interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  min?: string
  max?: string
  id?: string
  name?: string
  required?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  className,
  disabled,
  min,
  max,
  id,
  name,
  required,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  const settings = React.useMemo(() => {
    try {
      return getObject<GlobalSettings>("global_settings", DEFAULT_GLOBAL_SETTINGS)
    } catch {
      return DEFAULT_GLOBAL_SETTINGS
    }
  }, [])

  const dateFormat = normalizeDateFormat(
    settings.dateFormat,
    DEFAULT_GLOBAL_SETTINGS.dateFormat as DateFormatId,
  )
  const resolvedPlaceholder = placeholder || dateFormat

  const formatValueToDisplay = React.useCallback(
    (dateValue: string, format: string): string => formatIsoDateToDisplay(dateValue, format),
    [],
  )

  const parseDisplayToValue = React.useCallback(
    (display: string, format: string): string => parseDisplayDateToIso(display, format),
    [],
  )

  // Sync external value change
  React.useEffect(() => {
    setInputValue(formatValueToDisplay(value || "", dateFormat))
  }, [value, dateFormat, formatValueToDisplay])

  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    const [year, month, day] = value.split("-").map(Number)
    if (isNaN(year) || isNaN(month) || isNaN(day)) return undefined
    return new Date(year, month - 1, day)
  }, [value])

  const disabledDays = React.useMemo(() => {
    const rules: any[] = []
    if (min) {
      const [y, m, d] = min.split("-").map(Number)
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        rules.push({ before: new Date(y, m - 1, d) })
      }
    }
    if (max) {
      const [y, m, d] = max.split("-").map(Number)
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        rules.push({ after: new Date(y, m - 1, d) })
      }
    }
    return rules.length > 0 ? rules : undefined
  }, [min, max])

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      onChange?.("")
      setInputValue("")
      setOpen(false)
      return
    }
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const formatted = `${y}-${m}-${day}`
    onChange?.(formatted)
    setInputValue(formatValueToDisplay(formatted, dateFormat))
    setOpen(false)
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextInputValue = event.target.value
    setInputValue(nextInputValue)

    const parsed = parseDisplayToValue(nextInputValue, dateFormat)
    if (parsed) {
      const [year, month, day] = parsed.split("-").map(Number)
      const parsedDate = new Date(year, month - 1, day)
      if (min && parsedDate < new Date(min)) return
      if (max && parsedDate > new Date(max)) return
      onChange?.(parsed)
    } else if (nextInputValue === "") {
      onChange?.("")
    }
  }

  const handleBlur = () => {
    if (!inputValue) {
      onChange?.("")
      return
    }
    
    const parsed = parseDisplayToValue(inputValue, dateFormat)
    if (parsed) {
      if (min && new Date(parsed) < new Date(min)) {
        setInputValue(formatValueToDisplay(value || "", dateFormat))
        return
      }
      if (max && new Date(parsed) > new Date(max)) {
        setInputValue(formatValueToDisplay(value || "", dateFormat))
        return
      }
      onChange?.(parsed)
      setInputValue(formatValueToDisplay(parsed, dateFormat))
    } else {
      // Revert to current synchronized value if invalid
      setInputValue(formatValueToDisplay(value || "", dateFormat))
    }
  }

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation()
    onChange?.("")
    setInputValue("")
  }

  return (
    <div className={cn("relative flex w-full items-center rounded-lg border border-border bg-background/50 backdrop-blur-md px-3 py-1 shadow-sm transition-all focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:border-primary/50 focus-within:bg-background/80", className)}>
      <input
        type="text"
        id={id}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={resolvedPlaceholder}
        disabled={disabled}
        className="flex-1 bg-transparent border-0 p-0 text-sm focus:outline-none focus:ring-0 placeholder:text-muted-foreground/60 disabled:cursor-not-allowed disabled:opacity-50"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Enter date in ${dateFormat} format`}
      />
      
      {value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="p-1 hover:bg-muted/80 rounded-md text-muted-foreground hover:text-foreground transition-colors mr-1 cursor-pointer"
          aria-label="Clear date"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      
      <div className="h-4 w-px bg-border mx-1.5" />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          type="button"
          disabled={disabled}
          className="p-1 hover:bg-muted/80 rounded-md text-muted-foreground hover:text-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          aria-label="Open calendar popup"
        >
          <CalendarIcon className="h-4 w-4 opacity-70" />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border border-border/80 shadow-xl bg-background/90 backdrop-blur-xl rounded-xl" align="end">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={handleSelect}
            disabled={disabledDays}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      {required && !value && (
        <input
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
        name={name}
        value={value || ""}
      />
    </div>
  )
}
