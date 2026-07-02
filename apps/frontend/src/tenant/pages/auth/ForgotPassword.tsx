import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Mail, CheckCircle2 } from "lucide-react";
import AuthLayout from "@/tenant/components/AuthLayout";
import EntryPageHead, { formatEntryTitle } from "@/components/entry/EntryPageHead";
import { ROUTES } from '@/lib/config/routes';
import { useTranslation } from "@/hooks/useTranslation";
import { FORM_ERROR, FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";

/**
 * Forgot password reset request form for tenant sign-in entry.
 */
export default function ForgotPassword(): React.JSX.Element {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!email) { setError(t("auth.emailRequired")); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError(t("auth.emailInvalid")); return; }
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
            ? t("auth.forgotSentTo", { email })
            : t("auth.forgotSubtitle")
        }
      >
        {sent ? (
          <div className="space-y-5">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t("auth.resetLinkSent")}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("auth.resetLinkExpiry", { email })}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { setSent(false); setEmail(""); }}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {t("auth.tryDifferentEmail")}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              <Link to={ROUTES.login} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                <ArrowLeft className="h-3 w-3" /> {t("auth.backToSignIn")}
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className={FORM_LABEL}>
                {t("auth.emailAddress")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => { setEmail(event.target.value); setError(""); }}
                placeholder="you@madrasa.app"
                className={cn(
                  FORM_INPUT,
                  error ? "border-destructive focus-visible:ring-destructive/20" : "",
                )}
              />
              {error ? <p className={FORM_ERROR}>{error}</p> : null}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {t("auth.sendResetLink")}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              <Link to={ROUTES.login} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                <ArrowLeft className="h-3 w-3" /> {t("auth.backToSignIn")}
              </Link>
            </p>
          </form>
        )}
      </AuthLayout>
    </>
  );
}
