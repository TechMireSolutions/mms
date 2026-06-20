import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Mail, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AuthLayout from "@/tenant/components/AuthLayout";
import { ROUTES } from '@/lib/config/routes';
import { apexUrl } from '@/lib/config/tenantConfig';
import useTranslation from "@/hooks/useTranslation";
import { FORM_ERROR, FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";

/**
 * ForgotPassword Page Component
 *
 * Renders the forgot password reset request form.
 * Captures user email, performs basic regex format validation, and simulates sending
 * a password reset link by showing a success verification state.
 *
 * @returns React element representing the forgot password page.
 */
export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) { setError(t("auth.emailRequired")); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError(t("auth.emailInvalid")); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSent(true);
  };

  return (
    <AuthLayout
      title={sent ? t("auth.forgotCheckEmail") : t("auth.forgotTitle")}
      subtitle={
        sent
          ? t("auth.forgotSentTo", { email })
          : t("auth.forgotSubtitle")
      }
    >
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-5"
          >
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div className="bg-muted/50 rounded-xl p-4 border border-border">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t("auth.resetLinkSent")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("auth.resetLinkExpiry", { email })}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              {t("auth.tryDifferentEmail")}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              <Link to={ROUTES.login} className="text-primary font-medium hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> {t("auth.backToSignIn")}
              </Link>
            </p>
            <p className="text-center text-xs text-muted-foreground">
              {t("auth.notYourMadrasa")}{" "}
              <a href={apexUrl(ROUTES.login)} className="font-medium text-primary hover:underline">
                {t("auth.viewAllMadrasaLinks")}
              </a>
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label className={FORM_LABEL}>
                {t("auth.emailAddress")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="you@madrasa.app"
                className={cn(
                  FORM_INPUT,
                  error ? "border-destructive focus:ring-destructive/20" : "",
                )}
              />
              {error ? <p className={FORM_ERROR}>{error}</p> : null}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {t("auth.sendResetLink")}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              <Link to={ROUTES.login} className="text-primary font-medium hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> {t("auth.backToSignIn")}
              </Link>
            </p>

            <div className="border-t border-border/50 pt-4 text-center text-xs text-muted-foreground space-y-2">
              <p>
                {t("auth.notYourMadrasa")}{" "}
                <a
                  href={apexUrl(ROUTES.login)}
                  className="font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
                >
                  {t("auth.viewAllMadrasaLinks")}
                </a>
              </p>
              <p>
                {t("auth.noAccount")}{" "}
                <a
                  href={apexUrl(ROUTES.onboarding)}
                  className="font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
                >
                  {t("auth.createMadrasa")}
                </a>
              </p>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
