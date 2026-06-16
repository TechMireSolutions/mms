import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/config/routes";
import useTranslation from "@/hooks/useTranslation";

interface ApexEntryNavProps {
  /** Show link to apex forgot-password workspace picker */
  showForgotPasswordLink?: boolean;
  /** Show link back to apex login workspace picker */
  showSignInPickerLink?: boolean;
}

/** Secondary cross-links between apex entry routes (home, login picker, forgot picker). */
export default function ApexEntryNav({
  showForgotPasswordLink = false,
  showSignInPickerLink = false,
}: ApexEntryNavProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (!showForgotPasswordLink && !showSignInPickerLink) {
    return null;
  }

  return (
    <div className="text-center text-xs text-muted-foreground space-y-1.5">
      {showForgotPasswordLink ? (
        <p>
          {t("apex.forgotPasswordPicker")}{" "}
          <Link to={ROUTES.forgotPassword} className="font-medium text-primary hover:underline">
            {t("apex.goToForgotPicker")}
          </Link>
        </p>
      ) : null}
      {showSignInPickerLink ? (
        <p>
          <Link to={ROUTES.login} className="font-medium text-primary hover:underline">
            {t("apex.backToSignInPicker")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
