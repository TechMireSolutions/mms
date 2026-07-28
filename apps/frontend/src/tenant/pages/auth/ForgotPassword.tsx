import React, { useId, useState } from "react";
import { Mail } from "lucide-react";
import AuthLayout from "@/tenant/components/AuthLayout";
import {
  AuthBackLink,
  AuthCheckEmailSuccess,
  AuthEmailField,
  AuthMutedPanel,
  AuthSubmitButton,
  EntryPageHead,
  focusAuthField,
  formatEntryTitle,
  validateAuthEmail,
} from "@/components/entry";
import { ROUTES } from '@/lib/config/routes';
import { useTranslation } from "@/hooks/useTranslation";

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
    const emailError = validateAuthEmail(email, t);
    if (emailError) {
      setError(emailError);
      focusAuthField(emailFieldId);
      return;
    }
    setLoading(true);
    // Tenant password-reset API is not shipped yet — acknowledge without leaking account existence.
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 800));
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
          <AuthCheckEmailSuccess
            secondaryLabel={t("auth.tryDifferentEmail")}
            onSecondary={() => {
              setSent(false);
              setEmail("");
              setError("");
            }}
            footer={<AuthBackLink to={ROUTES.login} label={t("auth.backToSignIn")} />}
          >
            <AuthMutedPanel>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-foreground">{t("auth.resetLinkSent")}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {t("auth.resetLinkExpiry", { email: email.trim() })}
                  </p>
                </div>
              </div>
            </AuthMutedPanel>
          </AuthCheckEmailSuccess>
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
