import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/config/routes";
import { useTranslation } from "@/hooks/useTranslation";

interface ApexEntryNavProps {
  /** Show link to apex forgot-password workspace picker */
  showForgotPasswordLink?: boolean;
  /** Show link back to apex home (platform sign-in) */
  showHomeLink?: boolean;
}

/** Secondary cross-links between apex entry routes (home and forgot-password picker). */
export default function ApexEntryNav({
  showForgotPasswordLink = false,
  showHomeLink = false,
}: ApexEntryNavProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (!showForgotPasswordLink && !showHomeLink) {
    return null;
  }

  return (
    <div className="space-y-1.5 text-center text-xs text-muted-foreground">
      {showForgotPasswordLink ? (
        <p>
          {t("apex.forgotPasswordPicker")}{" "}
          <Link
            to={ROUTES.forgotPassword}
            className="inline-flex min-h-10 items-center rounded-md px-1 font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
          >
            {t("apex.goToForgotPicker")}
          </Link>
        </p>
      ) : null}
      {showHomeLink ? (
        <p>
          <Link
            to={ROUTES.home}
            className="inline-flex min-h-10 items-center rounded-md px-1 font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
          >
            {t("apex.backToMain")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
