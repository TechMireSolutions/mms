import * as React from "react"
import type { Matcher } from "react-day-picker"
import {
  DEFAULT_GLOBAL_SETTINGS,
  formatDateToIso,
  formatIsoDateToDisplay,
  isDateWithinIsoBounds,
  normalizeDateFormat,
  parseDisplayDateToIso,
  parseIsoDate,
  resolveDatePickerMonthBounds,
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

  const lastParsedRef = React.useRef<string | null>(null)
  const lastFormatRef = React.useRef<string>(dateFormat)

  React.useEffect(() => {
    if (value !== lastParsedRef.current || dateFormat !== lastFormatRef.current) {
      setInputValue(formatIsoDateToDisplay(value || "", dateFormat))
      lastParsedRef.current = value || null
      lastFormatRef.current = dateFormat
    }
  }, [value, dateFormat])

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

  const { startMonth, endMonth } = React.useMemo(
    () => resolveDatePickerMonthBounds(min, max),
    [min, max],
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

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextInputValue = event.target.value
    setInputValue(nextInputValue)

    if (nextInputValue === "") {
      clearValue()
      return
    }

    const parsed = parseDisplayDateToIso(nextInputValue, dateFormat)
    if (!parsed) return
    const parsedDate = parseIsoDate(parsed)
    if (!parsedDate || !isDateWithinIsoBounds(parsedDate, min, max)) return
    commitIso(parsed, parsedDate, false)
  }

  const handleBlur = () => {
    if (!inputValue) {
      clearValue()
      return
    }

    const parsed = parseDisplayDateToIso(inputValue, dateFormat)
    const parsedDate = parsed ? parseIsoDate(parsed) : undefined
    if (parsed && parsedDate && isDateWithinIsoBounds(parsedDate, min, max)) {
      commitIso(parsed, parsedDate)
      return
    }
    setInputValue(formatIsoDateToDisplay(value || "", dateFormat))
  }

  const isTodayAllowed = React.useMemo(() => {
    return isDateWithinIsoBounds(new Date(), min, max)
  }, [min, max])

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
  }
}
