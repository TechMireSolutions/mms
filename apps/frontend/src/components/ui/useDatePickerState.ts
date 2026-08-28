import * as React from "react"
import type { Matcher } from "react-day-picker"
import {
  DEFAULT_GLOBAL_SETTINGS,
  formatDateInputAsYouType,
  formatDateToIso,
  formatIsoDateToDisplay,
  isDateWithinIsoBounds,
  isYearWithinBounds,
  normalizeDateFormat,
  parseDisplayDateToIso,
  parseIsoDate,
  parseYearValue,
  resolveDatePickerMonthBounds,
  resolveYearPickerBounds,
  type DateFormatId,
} from "@mms/shared"
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings"

export interface UseDatePickerStateOptions {
  value?: string | number | Date | null
  onChange?: (value: string) => void
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
  min?: string | number | null
  max?: string | number | null
  mode?: "date" | "year"
  yearOnly?: boolean
  minYear?: number | null
  maxYear?: number | null
}

function resolveInitialDisplayMonth(
  targetDate?: Date,
  minIso?: string | number | null,
  maxIso?: string | number | null,
): Date {
  if (targetDate) return targetDate
  const today = new Date()
  const minDate = typeof minIso === "string" ? parseIsoDate(minIso) : undefined
  if (minDate && today < minDate) return minDate
  const maxDate = typeof maxIso === "string" ? parseIsoDate(maxIso) : undefined
  if (maxDate && today > maxDate) return maxDate
  return today
}

export function useDatePickerState({
  value,
  onChange,
  onBlur,
  min,
  max,
  mode = "date",
  yearOnly,
  minYear,
  maxYear,
}: UseDatePickerStateOptions) {
  const isYearMode = mode === "year" || Boolean(yearOnly)
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const fallbackId = React.useId()

  const settings = useGlobalSettings()
  const dateFormat = normalizeDateFormat(
    settings.dateFormat,
    DEFAULT_GLOBAL_SETTINGS.dateFormat as DateFormatId,
  )

  const selectedYear = React.useMemo(() => parseYearValue(value), [value])
  const yearBounds = React.useMemo(
    () => resolveYearPickerBounds(min, max, minYear, maxYear),
    [min, max, minYear, maxYear],
  )
  const resolvedMinYear = yearBounds.minYear
  const resolvedMaxYear = yearBounds.maxYear

  const [yearPageStart, setYearPageStart] = React.useState<number>(() =>
    Math.floor((selectedYear ?? new Date().getFullYear()) / 10) * 10,
  )

  const lastParsedRef = React.useRef<string | null>(null)
  const lastFormatRef = React.useRef<string>(dateFormat)

  const rawIsoString = typeof value === "string" ? value : value instanceof Date ? formatDateToIso(value) : ""

  React.useEffect(() => {
    if (isYearMode) {
      const y = parseYearValue(value)
      const formatted = y != null ? String(y) : ""
      if (formatted !== lastParsedRef.current) {
        setInputValue(formatted)
        lastParsedRef.current = formatted
      }
      return
    }

    if (rawIsoString !== lastParsedRef.current || dateFormat !== lastFormatRef.current) {
      setInputValue(formatIsoDateToDisplay(rawIsoString || "", dateFormat))
      lastParsedRef.current = rawIsoString || null
      lastFormatRef.current = dateFormat
    }
  }, [value, rawIsoString, dateFormat, isYearMode])

  const dateValue = React.useMemo(
    () => (typeof value === "string" ? parseIsoDate(value) : value instanceof Date ? value : undefined),
    [value],
  )

  /** Month shown in the calendar — jump to the filled value (or clamped valid month) when opening. */
  const [displayMonth, setDisplayMonth] = React.useState<Date>(() =>
    resolveInitialDisplayMonth(dateValue, min, max),
  )

  React.useEffect(() => {
    if (!open) return
    if (isYearMode) {
      setYearPageStart(Math.floor((selectedYear ?? new Date().getFullYear()) / 10) * 10)
    } else {
      setDisplayMonth(resolveInitialDisplayMonth(dateValue, min, max))
    }
  }, [open, dateValue, min, max, isYearMode, selectedYear])

  const minIsoStr = typeof min === "string" ? min : undefined
  const maxIsoStr = typeof max === "string" ? max : undefined

  const disabledDays = React.useMemo(() => {
    if (isYearMode) return undefined
    const rules: Matcher[] = []
    const minDate = parseIsoDate(minIsoStr)
    if (minDate) rules.push({ before: minDate })
    const maxDate = parseIsoDate(maxIsoStr)
    if (maxDate) rules.push({ after: maxDate })
    return rules.length > 0 ? rules : undefined
  }, [minIsoStr, maxIsoStr, isYearMode])

  const { startMonth, endMonth } = React.useMemo(
    () => resolveDatePickerMonthBounds(minIsoStr, maxIsoStr),
    [minIsoStr, maxIsoStr],
  )

  const commitIso = (iso: string, nextDisplayMonth?: Date, updateInput = true) => {
    lastParsedRef.current = iso
    onChange?.(iso)
    if (updateInput) {
      setInputValue(formatIsoDateToDisplay(iso, dateFormat))
    }
    if (nextDisplayMonth) setDisplayMonth(nextDisplayMonth)
  }

  const clearValue = () => {
    lastParsedRef.current = ""
    onChange?.("")
    setInputValue("")
    setDisplayMonth(new Date())
    setYearPageStart(Math.floor(new Date().getFullYear() / 10) * 10)
  }

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      clearValue()
      setOpen(false)
      return
    }
    commitIso(formatDateToIso(date), date)
    setOpen(false)
  }

  const handleSelectYear = (year: number) => {
    if (!isYearWithinBounds(year, resolvedMinYear, resolvedMaxYear)) return
    const yearStr = String(year)
    lastParsedRef.current = yearStr
    onChange?.(yearStr)
    setInputValue(yearStr)
    setOpen(false)
  }

  const goToPreviousYearPage = () => {
    setYearPageStart((prev) => prev - 12)
  }

  const goToNextYearPage = () => {
    setYearPageStart((prev) => prev + 12)
  }

  const isThisYearAllowed = React.useMemo(() => {
    return isYearWithinBounds(new Date().getFullYear(), resolvedMinYear, resolvedMaxYear)
  }, [resolvedMinYear, resolvedMaxYear])

  const handleSelectThisYear = () => {
    const currentYear = new Date().getFullYear()
    if (isThisYearAllowed) {
      handleSelectYear(currentYear)
    }
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value
    if (rawValue === "") {
      clearValue()
      return
    }

    if (isYearMode) {
      const digits = rawValue.replace(/\D/g, "").slice(0, 4)
      setInputValue(digits)

      if (digits.length === 4) {
        const num = Number(digits)
        if (isYearWithinBounds(num, resolvedMinYear, resolvedMaxYear)) {
          lastParsedRef.current = digits
          onChange?.(digits)
          setYearPageStart(Math.floor(num / 10) * 10)
        }
      }
      return
    }

    const formatted = formatDateInputAsYouType(rawValue, dateFormat, inputValue)
    setInputValue(formatted)

    const parsed = parseDisplayDateToIso(formatted, dateFormat)
    if (!parsed) return
    const parsedDate = parseIsoDate(parsed)
    if (!parsedDate || !isDateWithinIsoBounds(parsedDate, minIsoStr, maxIsoStr)) return
    commitIso(parsed, parsedDate, false)
  }

  const handleBlur = (event?: React.FocusEvent<HTMLInputElement>) => {
    if (isYearMode) {
      if (!inputValue) {
        clearValue()
      } else if (inputValue.length === 4) {
        const num = Number(inputValue)
        if (isYearWithinBounds(num, resolvedMinYear, resolvedMaxYear)) {
          const yearStr = String(num)
          lastParsedRef.current = yearStr
          onChange?.(yearStr)
          setInputValue(yearStr)
        } else {
          setInputValue(selectedYear ? String(selectedYear) : "")
        }
      } else {
        setInputValue(selectedYear ? String(selectedYear) : "")
      }
      if (event) onBlur?.(event)
      return
    }

    if (!inputValue) {
      clearValue()
      if (event) onBlur?.(event)
      return
    }

    const parsed = parseDisplayDateToIso(inputValue, dateFormat)
    const parsedDate = parsed ? parseIsoDate(parsed) : undefined
    if (parsed && parsedDate && isDateWithinIsoBounds(parsedDate, minIsoStr, maxIsoStr)) {
      commitIso(parsed, parsedDate)
      if (event) onBlur?.(event)
      return
    }
    setInputValue(formatIsoDateToDisplay(rawIsoString || "", dateFormat))
    if (event) onBlur?.(event)
  }

  const isTodayAllowed = React.useMemo(() => {
    return isDateWithinIsoBounds(new Date(), minIsoStr, maxIsoStr)
  }, [minIsoStr, maxIsoStr])

  const handleSelectToday = () => {
    const today = new Date()
    if (isTodayAllowed) {
      commitIso(formatDateToIso(today), today)
      setOpen(false)
    }
  }

  const handleClear = (event?: React.MouseEvent | React.SyntheticEvent) => {
    event?.stopPropagation()
    clearValue()
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
    setYearPageStart,
    goToPreviousYearPage,
    goToNextYearPage,
    handleSelectYear,
    handleSelectThisYear,
    isThisYearAllowed,
  }
}

