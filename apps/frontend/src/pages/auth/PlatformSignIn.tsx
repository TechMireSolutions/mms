import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, Loader2, Lock, Mail } from "lucide-react";
import PlatformAuthLayout from "@/components/platform/PlatformAuthLayout";
import { usePlatformAuth } from "@/lib/contexts/PlatformAuthContext";
import useTranslation from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { FORM_INPUT_ICON, FORM_LABEL } from "@/components/ui/formStyles";
import { ROUTES } from "@/lib/config/routes";

/**
 * Apex-only sign-in for platform super-users who can provision new madrasas.
 */
export default function PlatformSignIn(): React.JSX.Element {
  const { t } = useTranslation();
  const { platformLogin, isLoadingPlatformAuth } = usePlatformAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    try {
      await platformLogin(email.trim(), password);
    } catch {
      setError(t("platform.invalidCredentials"));
    }
  };

  return (
    <PlatformAuthLayout
      title={t("platform.signInTitle")}
      subtitle={t("platform.signInSubtitle")}
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
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
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
            <input
              id="platform-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={FORM_INPUT_ICON}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="platform-password" className={FORM_LABEL}>{t("auth.password")}</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
            <input
              id="platform-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={FORM_INPUT_ICON}
            />
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

        <Button type="submit" className="w-full h-11" disabled={isLoadingPlatformAuth}>
          {isLoadingPlatformAuth ? (
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
  );
}
