import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type DayPickerProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { CalendarDropdown } from "@/components/ui/CalendarDropdown"

export type CalendarProps = DayPickerProps

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
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
        weekday: "text-muted-foreground rounded-md w-8 font-normal text-xs",
        week: "flex w-full mt-2",
        day: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent/60 [&:has([aria-selected].day-outside)]:bg-accent/30 [&:has([aria-selected].day-range-end)]:rounded-e-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-e-md [&:has(>.day-range-start)]:rounded-s-md first:[&:has([aria-selected])]:rounded-s-md last:[&:has([aria-selected])]:rounded-e-md"
            : "[&:has([aria-selected])]:rounded-lg"
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "min-h-11 min-w-11 p-0 font-normal aria-selected:opacity-100 rounded-lg hover:bg-muted/80 transition-colors"
        ),
        range_start: "day-range-start",
        range_end: "day-range-end",
        selected:
          "bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/30 hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-lg",
        today:
          "font-semibold text-primary ring-1 ring-primary/40 rounded-lg [&:not([aria-selected])]:bg-primary/5",
        outside:
          "day-outside text-muted-foreground/40 aria-selected:bg-accent/40 aria-selected:text-muted-foreground",
        disabled: "text-muted-foreground/35 opacity-40 cursor-not-allowed pointer-events-none",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        dropdowns: "flex justify-center gap-1.5 items-center",
        ...classNames,
      }}
      {...props}
      components={{
        Chevron: ({ className: chevronClassName, orientation, ...chevronProps }) => {
          if (orientation === "left") {
            return <ChevronLeft className={cn("h-4 w-4", chevronClassName)} {...chevronProps} />
          }
          return <ChevronRight className={cn("h-4 w-4", chevronClassName)} {...chevronProps} />
        },
        Dropdown: CalendarDropdown,
        ...components,
      }}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
