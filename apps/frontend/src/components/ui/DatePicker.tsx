import * as React from "react"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings"
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
  const fallbackId = React.useId()
  const resolvedId = id || fallbackId
  const resolvedName = name || fallbackId

  const settings = useGlobalSettings()

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

  const lastParsedRef = React.useRef<string | null>(null)
  const lastFormatRef = React.useRef<string>(dateFormat)

  // Sync external value change
  React.useEffect(() => {
    if (value !== lastParsedRef.current || dateFormat !== lastFormatRef.current) {
      setInputValue(formatValueToDisplay(value || "", dateFormat))
      lastParsedRef.current = value || null
      lastFormatRef.current = dateFormat
    }
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

  const startMonth = React.useMemo(() => {
    if (min) {
      const [y] = min.split("-").map(Number)
      if (!isNaN(y)) return new Date(y, 0)
    }
    return new Date(new Date().getFullYear() - 100, 0)
  }, [min])

  const endMonth = React.useMemo(() => {
    if (max) {
      const [y] = max.split("-").map(Number)
      if (!isNaN(y)) return new Date(y, 11)
    }
    return new Date(new Date().getFullYear() + 10, 11)
  }, [max])

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      lastParsedRef.current = ""
      onChange?.("")
      setInputValue("")
      setOpen(false)
      return
    }
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const formatted = `${y}-${m}-${day}`
    lastParsedRef.current = formatted
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
      lastParsedRef.current = parsed
      onChange?.(parsed)
    } else if (nextInputValue === "") {
      lastParsedRef.current = ""
      onChange?.("")
    }
  }

  const handleBlur = () => {
    if (!inputValue) {
      lastParsedRef.current = ""
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
      lastParsedRef.current = parsed
      onChange?.(parsed)
      setInputValue(formatValueToDisplay(parsed, dateFormat))
    } else {
      // Revert to current synchronized value if invalid
      setInputValue(formatValueToDisplay(value || "", dateFormat))
    }
  }

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation()
    lastParsedRef.current = ""
    onChange?.("")
    setInputValue("")
  }

  return (
    <div className={cn("relative flex w-full items-center rounded-lg border border-border bg-background px-3 py-2.5 min-h-[44px] text-sm text-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          type="button"
          disabled={disabled}
          className="mr-2 p-1 hover:bg-muted/80 rounded-md text-muted-foreground hover:text-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shrink-0"
          aria-label="Open calendar popup"
        >
          <CalendarIcon className="h-4 w-4 opacity-70" />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border border-border/80 shadow-xl bg-background/90 backdrop-blur-xl rounded-xl" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={handleSelect}
            disabled={disabledDays}
            captionLayout="dropdown"
            startMonth={startMonth}
            endMonth={endMonth}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      <input
        type="text"
        id={resolvedId}
        name={resolvedName}
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
          className="p-1 hover:bg-muted/80 rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0 ml-1"
          aria-label="Clear date"
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
        value={value || ""}
      />
    </div>
  )
}
