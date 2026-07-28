import React, { useId, useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { isValidEmail } from "@mms/shared";
import AuthLayout from "@/tenant/components/AuthLayout";
import EntryPageHead, { formatEntryTitle } from "@/components/entry/EntryPageHead";
import { AuthEmailField } from "@/components/entry/AuthEmailField";
import { AuthBackLink, AuthSubmitButton } from "@/components/entry/AuthFormControls";
import { ROUTES } from '@/lib/config/routes';
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";

/**
 * Forgot password reset request form for tenant sign-in entry.
 */
export default function ForgotPassword(): React.JSX.Element {
  const { t } = useTranslation();
  const formId = useId();
  const emailFieldId = `${formId}-email`;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError(t("auth.emailRequired"));
      return;
    }
    if (!isValidEmail(trimmed)) {
      setError(t("auth.emailInvalid"));
      return;
    }
    setLoading(true);
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 1500));
    setLoading(false);
    setSent(true);
  };

  const pageTitle = formatEntryTitle(
    sent ? t("auth.forgotCheckEmail") : t("auth.forgotTitle"),
    t("entry.productName"),
  );

  return (
    <>
      <EntryPageHead title={pageTitle} description={t("entry.meta.tenantForgot")} />
      <AuthLayout
        title={sent ? t("auth.forgotCheckEmail") : t("auth.forgotTitle")}
        subtitle={
          sent
            ? t("auth.forgotSentTo", { email: email.trim() })
            : t("auth.forgotSubtitle")
        }
      >
        {sent ? (
          <div className="space-y-5">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10" aria-hidden>
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/40 p-4 text-start">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-foreground">{t("auth.resetLinkSent")}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {t("auth.resetLinkExpiry", { email: email.trim() })}
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSent(false);
                setEmail("");
                setError("");
              }}
              className="h-11 w-full rounded-xl"
            >
              {t("auth.tryDifferentEmail")}
            </Button>

            <AuthBackLink to={ROUTES.login} label={t("auth.backToSignIn")} />
          </div>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4" noValidate aria-busy={loading}>
            <fieldset disabled={loading} className="m-0 min-w-0 space-y-4 border-0 p-0">
              <AuthEmailField
                id={emailFieldId}
                label={t("auth.emailAddress")}
                value={email}
                autoFocus
                placeholder={t("auth.emailPlaceholder")}
                error={error || undefined}
                onChange={(value) => {
                  setEmail(value);
                  setError("");
                }}
              />

              <AuthSubmitButton
                busy={loading}
                busyLabel={t("auth.sendingResetLink")}
                label={t("auth.sendResetLink")}
              />

              <AuthBackLink to={ROUTES.login} label={t("auth.backToSignIn")} />
            </fieldset>
          </form>
        )}
      </AuthLayout>
    </>
  );
}
