import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthBackLink({
  to,
  label,
}: {
  to: string;
  label: string;
}): React.JSX.Element {
  return (
    <p className="text-center text-xs text-muted-foreground">
      <Link
        to={to}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-md px-2 font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
        {label}
      </Link>
    </p>
  );
}

export function AuthSubmitButton({
  busy,
  busyLabel,
  label,
  disabled,
}: {
  busy: boolean;
  busyLabel: string;
  label: string;
  disabled?: boolean;
}): React.JSX.Element {
  return (
    <Button
      type="submit"
      size="lg"
      disabled={busy || disabled}
      className="h-11 w-full rounded-xl font-semibold shadow-md shadow-primary/10 transition-shadow hover:shadow-lg hover:shadow-primary/15"
    >
      {busy ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {busyLabel}
        </>
      ) : (
        <>
          {label}
          <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
        </>
      )}
    </Button>
  );
}
