import * as React from "react"

import { cn } from "@/lib/utils"
import { FORM_INPUT } from "@/components/ui/formStyles"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * Standard input — aligned with {@link FORM_INPUT} for consistent form theme.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(FORM_INPUT, className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
