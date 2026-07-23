import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import PlatformAuthLayout from "@/platform/components/PlatformAuthLayout";
import PasswordInput from "@/components/ui/PasswordInput";
import EntryPageHead, { formatEntryTitle } from "@/components/entry/EntryPageHead";
import { usePlatformAuth } from "@/platform/lib/PlatformAuthContext";
import { getPlatformErrorMessage } from "@/platform/lib/platformAuthErrors";
import { useTranslation } from "@/hooks/useTranslation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { ROUTES } from "@/lib/config/routes";

/** Apex-only sign-in for platform super-users who can provision new madrasas. */
export default function PlatformSignIn(): React.JSX.Element {
  const { t } = useTranslation();
  const { platformLogin, isPlatformLoginSubmitting } = usePlatformAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const pageTitle = formatEntryTitle(t("platform.signInTitle"), t("entry.productName"));

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    try {
      await platformLogin(email.trim(), password);
    } catch (err) {
      setError(getPlatformErrorMessage(err, t));
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
          {error ? <Alert message={error} /> : null}

          <div className="space-y-1.5 text-start">
            <label htmlFor="platform-email" className={FORM_LABEL}>{t("auth.email")}</label>
            <div className="relative">
              <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden />
              <Input
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
                className="ps-9"
              />
            </div>
          </div>

          <PasswordInput
            id="platform-password"
            name="password"
            label={t("auth.password")}
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

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
                <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden />
              </>
            )}
          </Button>
        </form>
      </PlatformAuthLayout>
    </>
  );
}
