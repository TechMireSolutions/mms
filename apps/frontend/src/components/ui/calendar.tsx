import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import { DayPicker, DayPickerProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = DayPickerProps

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    (<DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:gap-4 sm:space-y-0",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "gap-1 flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "min-h-11 min-w-11 bg-transparent p-0 opacity-50 hover:opacity-100 absolute start-1"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "min-h-11 min-w-11 bg-transparent p-0 opacity-50 hover:opacity-100 absolute end-1"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday:
          "text-muted-foreground rounded-md w-8 font-normal text-xs",
        week: "flex w-full mt-2",
        day: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-e-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-e-md [&:has(>.day-range-start)]:rounded-s-md first:[&:has([aria-selected])]:rounded-s-md last:[&:has([aria-selected])]:rounded-e-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "min-h-11 min-w-11 p-0 font-normal aria-selected:opacity-100"
        ),
        range_start: "day-range-start",
        range_end: "day-range-end",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent text-accent-foreground",
        outside:
          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        dropdowns: "flex justify-center gap-1.5 items-center z-20",
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
          }
          return <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        },
        Dropdown: ({ className, options, value, onChange, ...props }) => {
          const stopDismiss = (event: React.SyntheticEvent) => {
            event.stopPropagation()
          }
          return (
            <div
              className="relative inline-flex items-center"
              onPointerDown={stopDismiss}
              onClick={stopDismiss}
            >
              <select
                className={cn(
                  "appearance-none min-h-11 bg-transparent ps-2.5 pe-6 py-2 text-sm font-semibold rounded-md border border-border hover:bg-muted/50 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all",
                  className
                )}
                value={value}
                onChange={onChange}
                {...props}
                onPointerDown={stopDismiss}
                onClick={stopDismiss}
              >
                {options?.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled} className="bg-background text-foreground">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3 w-3 absolute end-1.5 pointer-events-none opacity-50" />
            </div>
          )
        }
      }}
      {...props} />)
  );
}
Calendar.displayName = "Calendar"

export { Calendar }
