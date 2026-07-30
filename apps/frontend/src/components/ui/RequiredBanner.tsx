import type React from "react";
import { AlertCircle } from "lucide-react";

interface RequiredBannerProps {
  message: string;
}

export function RequiredBanner({ message }: RequiredBannerProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive font-semibold">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
