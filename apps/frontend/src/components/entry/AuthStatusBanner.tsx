import React from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AuthStatusBanner({
  message,
  variant = "error",
}: {
  message: string;
  variant?: "error" | "info";
}): React.JSX.Element {
  const isInfo = variant === "info";

  return (
    <div
      role={isInfo ? "status" : "alert"}
      aria-live={isInfo ? "polite" : "assertive"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
        isInfo
          ? "border-primary/25 bg-primary/5 text-foreground"
          : "border-destructive/40 bg-destructive/5 text-destructive",
      )}
    >
      {isInfo ? (
        <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" aria-hidden />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      )}
      <p className="leading-snug">{message}</p>
    </div>
  );
}
