import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";

interface CopyBtnProps {
  text: string;
  className?: string;
  variant?: "ghost" | "outline" | "default";
  showToast?: boolean;
}

/**
 * Reusable CopyBtn component for copying text to clipboard with feedback icon and toast.
 */
export function CopyBtn({
  text,
  className = "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-muted-foreground hover:text-foreground",
  variant = "ghost",
  showToast = false,
}: CopyBtnProps): React.JSX.Element {
  const { t } = useTranslation();
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        if (showToast) {
          notify.success(t("contacts.table.copied"));
        }
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => undefined);
  };

  return (
    <Button
      type="button"
      onClick={handleCopy}
      variant={variant}
      title={copied ? t("contacts.table.copied") : t("contacts.table.copy")}
      aria-label={copied ? t("contacts.table.copied") : t("contacts.table.copy")}
      className={className}
    >
      {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
    </Button>
  );
}
