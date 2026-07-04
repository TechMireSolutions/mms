import * as React from "react"

import { cn } from "@/lib/utils"
import { FORM_TEXTAREA } from "@/components/ui/formStyles"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, id, name, ...props }, ref) => {
  const fallbackId = React.useId();
  const resolvedId = id || fallbackId;
  const resolvedName = name || fallbackId;
  return (
    <textarea
      id={resolvedId}
      name={resolvedName}
      className={cn(FORM_TEXTAREA, className)}
      ref={ref}
      {...props}
    />
  );
})
Textarea.displayName = "Textarea"

export { Textarea }
