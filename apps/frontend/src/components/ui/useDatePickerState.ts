import * as React from "react"
import type { Matcher } from "react-day-picker"
import {
  DEFAULT_GLOBAL_SETTINGS,
  formatDateToIso,
  formatIsoDateToDisplay,
  normalizeDateFormat,
  parseDisplayDateToIso,
  parseIsoDate,
  parseIsoYear,
  type DateFormatId,
} from "@mms/shared"
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings"

export interface UseDatePickerStateOptions {
  value?: string
  onChange?: (value: string) => void
  min?: string
  max?: string
}

export function useDatePickerState({ value, onChange, min, max }: UseDatePickerStateOptions) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const fallbackId = React.useId()

  const settings = useGlobalSettings()
  const dateFormat = normalizeDateFormat(
    settings.dateFormat,
    DEFAULT_GLOBAL_SETTINGS.dateFormat as DateFormatId,
  )

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

  React.useEffect(() => {
    if (value !== lastParsedRef.current || dateFormat !== lastFormatRef.current) {
      setInputValue(formatValueToDisplay(value || "", dateFormat))
      lastParsedRef.current = value || null
      lastFormatRef.current = dateFormat
    }
  }, [value, dateFormat, formatValueToDisplay])

  const dateValue = React.useMemo(() => parseIsoDate(value), [value])

  /** Month shown in the calendar — jump to the filled value when opening. */
  const [displayMonth, setDisplayMonth] = React.useState<Date>(
    () => dateValue ?? new Date(),
  )

  React.useEffect(() => {
    if (!open) return
    setDisplayMonth(dateValue ?? new Date())
  }, [open, dateValue])

  const disabledDays = React.useMemo(() => {
    const rules: Matcher[] = []
    const minDate = parseIsoDate(min)
    if (minDate) rules.push({ before: minDate })
    const maxDate = parseIsoDate(max)
    if (maxDate) rules.push({ after: maxDate })
    return rules.length > 0 ? rules : undefined
  }, [min, max])

  const startMonth = React.useMemo(() => {
    const year = parseIsoYear(min)
    return year !== undefined ? new Date(year, 0) : new Date(new Date().getFullYear() - 100, 0)
  }, [min])

  const endMonth = React.useMemo(() => {
    const year = parseIsoYear(max)
    return year !== undefined ? new Date(year, 11) : new Date(new Date().getFullYear() + 10, 11)
  }, [max])

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      lastParsedRef.current = ""
      onChange?.("")
      setInputValue("")
      setOpen(false)
      return
    }
    const formatted = formatDateToIso(date)
    lastParsedRef.current = formatted
    onChange?.(formatted)
    setInputValue(formatValueToDisplay(formatted, dateFormat))
    setDisplayMonth(date)
    setOpen(false)
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextInputValue = event.target.value
    setInputValue(nextInputValue)

    const parsed = parseDisplayToValue(nextInputValue, dateFormat)
    if (parsed) {
      const parsedDate = parseIsoDate(parsed)
      if (parsedDate) {
        const minDate = parseIsoDate(min)
        if (minDate && parsedDate < minDate) return
        const maxDate = parseIsoDate(max)
        if (maxDate && parsedDate > maxDate) return
        setDisplayMonth(parsedDate)
      }
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
      const parsedDate = parseIsoDate(parsed)
      if (parsedDate) {
        const minDate = parseIsoDate(min)
        if (minDate && parsedDate < minDate) {
          setInputValue(formatValueToDisplay(value || "", dateFormat))
          return
        }
        const maxDate = parseIsoDate(max)
        if (maxDate && parsedDate > maxDate) {
          setInputValue(formatValueToDisplay(value || "", dateFormat))
          return
        }
        setDisplayMonth(parsedDate)
      }
      lastParsedRef.current = parsed
      onChange?.(parsed)
      setInputValue(formatValueToDisplay(parsed, dateFormat))
    } else {
      setInputValue(formatValueToDisplay(value || "", dateFormat))
    }
  }

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation()
    lastParsedRef.current = ""
    onChange?.("")
    setInputValue("")
  }

  return {
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
    handleSelect,
    handleInputChange,
    handleBlur,
    handleClear,
  }
}
