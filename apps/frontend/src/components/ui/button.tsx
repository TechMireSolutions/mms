import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline min-h-0 min-w-0 h-auto p-0 font-semibold",
        capsPrimary:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        capsOutline:
          "border border-border/60 bg-card/50 text-muted-foreground hover:text-foreground hover:bg-muted/30 shadow-none",
        capsGhost:
          "text-muted-foreground hover:text-foreground hover:bg-muted/30 shadow-none",
        capsSuccess:
          "border border-success/30 bg-success/10 text-success hover:bg-success/15 hover:text-success shadow-none",
        capsDestructive:
          "border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive shadow-none",
        capsAccent:
          "border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary shadow-none",
      },
      size: {
        default: "min-h-11 h-11 px-4 py-2",
        sm: "min-h-11 h-11 rounded-xl px-3 text-xs",
        lg: "min-h-11 h-12 rounded-xl px-8 text-base",
        icon: "min-h-11 min-w-11 h-11 w-11",
        caps: "min-h-11 h-auto rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider gap-1.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

/**
 * Standard touch-first button component enforcing 44x44px minimum target bounds.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, title, "aria-label": ariaLabel, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const resolvedAriaLabel = ariaLabel || (typeof title === "string" ? title : undefined);
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        title={title}
        aria-label={resolvedAriaLabel}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
