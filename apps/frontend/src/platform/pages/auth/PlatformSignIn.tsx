import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import PlatformAuthLayout from "@/platform/components/PlatformAuthLayout";
import EntryPageHead, { formatEntryTitle } from "@/components/entry/EntryPageHead";
import { usePlatformAuth } from "@/platform/lib/PlatformAuthContext";
import { ApiError } from "@/lib/apiClient";
import { mapPlatformAuthError } from "@/platform/lib/platformAuthErrors";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { FORM_INPUT_ICON, FORM_LABEL } from "@/components/ui/formStyles";
import { ROUTES } from "@/lib/config/routes";

/** Apex-only sign-in for platform super-users who can provision new madrasas. */
export default function PlatformSignIn(): React.JSX.Element {
  const { t } = useTranslation();
  const { platformLogin, isPlatformLoginSubmitting } = usePlatformAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageTitle = formatEntryTitle(t("platform.signInTitle"), t("entry.productName"));

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    try {
      await platformLogin(email.trim(), password);
    } catch (error) {
      setError(
        error instanceof ApiError ? mapPlatformAuthError(error, t) : t("errors.boundary.description"),
      );
    }
  };

  return (
    <>
      <EntryPageHead title={pageTitle} description={t("entry.meta.platformSignIn")} />
      <PlatformAuthLayout
        title={t("platform.signInTitle")}
        subtitle={t("platform.signInSubtitle")}
      >
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-4"
          noValidate
          aria-busy={isPlatformLoginSubmitting}
        >
          {error ? (
            <div
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label htmlFor="platform-email" className={FORM_LABEL}>{t("auth.email")}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden />
              <input
                id="platform-email"
                type="email"
                name="email"
                autoComplete="username"
                inputMode="email"
                autoFocus
                spellCheck={false}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={FORM_INPUT_ICON}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="platform-password" className={FORM_LABEL}>{t("auth.password")}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden />
              <input
                id="platform-password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`${FORM_INPUT_ICON} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-inline-end-0.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link
              to={ROUTES.platformForgotPassword}
              className="text-sm text-primary font-medium hover:underline"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>

          <Button type="submit" className="w-full h-11" disabled={isPlatformLoginSubmitting}>
            {isPlatformLoginSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                {t("auth.signingIn")}
              </>
            ) : (
              <>
                {t("platform.signIn")}
                <ArrowRight className="w-4 h-4" aria-hidden />
              </>
            )}
          </Button>
        </form>
      </PlatformAuthLayout>
    </>
  );
}
