import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Globe, Shield } from "lucide-react";
import type { AppTranslationKey } from "@mms/shared";
import WorkspaceRegistryList from "@/platform/components/WorkspaceRegistryList";
import ApexEntryNav from "@/platform/components/ApexEntryNav";
import { ROUTES } from "@/lib/config/routes";
import useTranslation from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";

export type ApexGateVariant = "default" | "login" | "forgotPassword" | "twoFactor" | "tenantOnly";

const TITLE_KEYS: Record<ApexGateVariant, AppTranslationKey> = {
  default: "apex.gateTitleDefault",
  login: "apex.gateLoginTitle",
  forgotPassword: "apex.gateForgotTitle",
  twoFactor: "apex.gateTwoFactorTitle",
  tenantOnly: "apex.gateTenantOnlyTitle",
};

const MESSAGE_KEYS: Partial<Record<ApexGateVariant, AppTranslationKey>> = {
  default: "apex.gateMessageDefault",
  login: "apex.gateLoginMessage",
  forgotPassword: "apex.gateForgotMessage",
  tenantOnly: "apex.gateTenantOnlyMessage",
};

interface ApexWorkspaceGateProps {
  variant?: ApexGateVariant;
  showWorkspaceList?: boolean;
}

/**
 * Shown on the apex domain when the user hits a tenant-only route (login, app modules).
 */
export default function ApexWorkspaceGate({
  variant = "default",
  showWorkspaceList = true,
}: ApexWorkspaceGateProps): React.JSX.Element {
  const { t } = useTranslation();
  const messageKey = MESSAGE_KEYS[variant];
  const isForgotPicker = variant === "forgotPassword";

  return (
    <main
      id="main-content"
      dir="ltr"
      className="min-h-screen w-full overflow-x-hidden bg-background flex flex-col items-center justify-center p-4 sm:p-6"
    >
      <div className="w-full max-w-lg mx-auto text-center space-y-5 px-1">
        <Globe className="w-10 h-10 text-primary mx-auto" aria-hidden />
        <h1 className="text-2xl font-bold text-foreground">{t(TITLE_KEYS[variant])}</h1>
        {messageKey ? (
          <p className="text-sm text-muted-foreground leading-relaxed">{t(messageKey)}</p>
        ) : null}

        {showWorkspaceList ? (
          <WorkspaceRegistryList
            destinationPath={isForgotPicker ? ROUTES.forgotPassword : ROUTES.login}
            actionLabelKey={isForgotPicker ? "apex.resetPasswordAt" : "auth.signInTo"}
          />
        ) : null}

        <ApexEntryNav
          showForgotPasswordLink={variant === "login"}
          showSignInPickerLink={variant === "forgotPassword"}
        />

        {variant === "login" || variant === "forgotPassword" || variant === "default" ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-left space-y-3">
            <p className="text-sm text-muted-foreground">{t("apex.platformAdminHint")}</p>
            <Button asChild variant="default" className="w-full">
              <Link to={variant === "forgotPassword" ? ROUTES.platformForgotPassword : ROUTES.home}>
                <Shield className="w-4 h-4" aria-hidden />
                {variant === "forgotPassword"
                  ? t("apex.platformAdminForgot")
                  : t("apex.platformAdminSignIn")}
              </Link>
            </Button>
          </div>
        ) : null}

        <Link
          to={ROUTES.home}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
          {t("apex.backToMain")}
        </Link>
      </div>
    </main>
  );
}
