import * as React from "react"
import { Dropdown } from "react-day-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type CalendarDropdownProps = React.ComponentProps<typeof Dropdown>

/**
 * Month/year caption control for DayPicker — Radix Select (not native select)
 * so menus work inside Popover/Dialog without OS paint-order or dismiss bugs.
 */
export function CalendarDropdown({
  options,
  value,
  onChange,
  className,
  "aria-label": ariaLabel,
  disabled,
}: CalendarDropdownProps): React.JSX.Element {
  const handleValueChange = (next: string) => {
    if (!onChange) return
    onChange({
      target: { value: next },
    } as React.ChangeEvent<HTMLSelectElement>)
  }

  const stringValue = value == null ? undefined : String(value)

  return (
    <Select value={stringValue} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn(
          "h-11 min-h-11 w-auto gap-1 border-border bg-transparent px-2.5 py-2 text-sm font-semibold shadow-none hover:bg-muted/50 focus:ring-1 focus:ring-primary/30 [&>span]:line-clamp-none",
          className,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-72" position="popper">
        {options?.map((option) => (
          <SelectItem
            key={option.value}
            value={String(option.value)}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
