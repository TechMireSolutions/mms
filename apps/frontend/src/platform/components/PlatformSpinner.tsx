import React from "react";
import { Loader2 } from "lucide-react";

interface PlatformSpinnerProps {
  label: string;
}

/**
 * Centered inline spinner for platform tables/lists loading states.
 */
export default function PlatformSpinner({ label }: PlatformSpinnerProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
      <Loader2 className="w-6 h-6 animate-spin text-primary" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
