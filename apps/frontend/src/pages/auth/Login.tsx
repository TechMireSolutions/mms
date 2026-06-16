import React, { useState, useEffect, useCallback, useId } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import AuthLayout from "../../components/auth/AuthLayout";
import { useAuth } from "../../lib/AuthContext";
import { DEFAULT_AUTH_REDIRECT, ROUTES } from "../../lib/routes";
import { getGlobalSettings } from "../../lib/db";
import {
  clear2FAState,
  is2FAVerified,
  mark2FAVerified,
} from "../../lib/twoFactor";
import { requiresTwoFactor } from "@mms/shared";
import useTranslation from "@/hooks/useTranslation";
import { apexUrl } from "../../lib/tenantConfig";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const REMEMBER_EMAIL_KEY = "mms_login_remember_email";

const fieldInputClass =
  "h-11 border-border/70 bg-background shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/20";

interface LoginErrors {
  email?: string;
  password?: string;
}

/**
 * Tenant login — email/password auth with optional 2FA and apex handoff support.
 */
export default function Login(): React.ReactElement {
  const { login, isAuthenticated, exchangeHandoff, user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const formId = useId();
  const emailFieldId = `${formId}-email`;
  const passwordFieldId = `${formId}-password`;
  const rememberFieldId = `${formId}-remember`;

  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? DEFAULT_AUTH_REDIRECT;

  const [email, setEmail] = useState<string>(() => {
    try {
      return localStorage.getItem(REMEMBER_EMAIL_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(REMEMBER_EMAIL_KEY));
    } catch {
      return false;
    }
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [handoffProcessing, setHandoffProcessing] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState<string>("");

  useEffect(() => {
    if (!isAuthenticated) return;
    const settings = getGlobalSettings();
    const needs2FA = requiresTwoFactor(settings, user) && !is2FAVerified();
    if (!needs2FA) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, user, navigate, redirectTo]);

  useEffect(() => {
    const handoff = new URLSearchParams(location.search).get("handoff");
    if (!handoff || isAuthenticated) return;

    setHandoffProcessing(true);
    setFormError("");
    void exchangeHandoff(handoff)
      .then(() => navigate(redirectTo, { replace: true }))
      .catch((err: unknown) => {
        setFormError(err instanceof Error ? err.message : t("auth.handoffFailed"));
      })
      .finally(() => setHandoffProcessing(false));
  }, [location.search, exchangeHandoff, isAuthenticated, navigate, redirectTo, t]);

  const persistRememberedEmail = useCallback((value: string, remember: boolean) => {
    try {
      if (remember && value.trim()) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, value.trim());
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
    } catch {
      // ignore storage failures
    }
  }, []);

  const validate = (): LoginErrors => {
    const next: LoginErrors = {};
    const trimmed = email.trim();
    if (!trimmed) {
      next.email = t("auth.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(trimmed)) {
      next.email = t("auth.emailInvalid");
    }
    if (!password) {
      next.password = t("auth.passwordRequired");
    }
    return next;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setFormError("");
    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    const trimmedEmail = email.trim();
    try {
      const { requires2FA } = await login(trimmedEmail, password);
      persistRememberedEmail(trimmedEmail, rememberMe);
      if (requires2FA) {
        navigate(ROUTES.twoFactor, { replace: true, state: { from: redirectTo } });
        return;
      }
      clear2FAState();
      mark2FAVerified();
      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : t("auth.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  const isBusy = loading || handoffProcessing;

  return (
    <AuthLayout title={t("auth.signInTitle")}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-busy={isBusy}>
        <AnimatePresence mode="wait">
          {(formError || handoffProcessing) && (
            <motion.div
              key={handoffProcessing ? "handoff" : "error"}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              <div
                role="alert"
                className={cn(
                  "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
                  handoffProcessing
                    ? "border-primary/25 bg-primary/5 text-foreground"
                    : "border-destructive/40 bg-destructive/5 text-destructive"
                )}
              >
                {handoffProcessing ? (
                  <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <p className="leading-snug">
                  {handoffProcessing ? t("auth.handoffProcessing") : formError}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <fieldset disabled={isBusy} className="m-0 min-w-0 space-y-4 border-0 p-0">
          <div className="space-y-1.5">
            <Label htmlFor={emailFieldId} className="text-foreground/90">
              {t("auth.emailAddress")}
            </Label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80"
                aria-hidden
              />
              <Input
                id={emailFieldId}
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  setFormError("");
                }}
                placeholder="you@madrasa.app"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? `${emailFieldId}-error` : undefined}
                className={cn(
                  fieldInputClass,
                  "pl-10",
                  fieldErrors.email && "border-destructive focus-visible:ring-destructive/25"
                )}
              />
            </div>
            {fieldErrors.email && (
              <p id={`${emailFieldId}-error`} className="text-xs text-destructive" role="alert">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={passwordFieldId} className="text-foreground/90">
              {t("auth.password")}
            </Label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80"
                aria-hidden
              />
              <Input
                id={passwordFieldId}
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  setFormError("");
                }}
                placeholder="••••••••"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? `${passwordFieldId}-error` : undefined}
                className={cn(
                  fieldInputClass,
                  "pl-10 pr-11",
                  fieldErrors.password && "border-destructive focus-visible:ring-destructive/25"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-0.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p id={`${passwordFieldId}-error`} className="text-xs text-destructive" role="alert">
                {fieldErrors.password}
              </p>
            )}
            <div className="flex justify-end pt-0.5">
              <Link
                to={ROUTES.forgotPassword}
                className="rounded-md px-1 py-1 text-xs font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>
          </div>

          <label
            htmlFor={rememberFieldId}
            className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-0.5 py-1"
          >
            <input
              type="checkbox"
              id={rememberFieldId}
              checked={rememberMe}
              onChange={(e) => {
                const next = e.target.checked;
                setRememberMe(next);
                if (!next) {
                  persistRememberedEmail("", false);
                }
              }}
              className="h-4 w-4 shrink-0 rounded border-border text-primary accent-primary"
            />
            <span className="text-sm text-muted-foreground">{t("auth.rememberMe")}</span>
          </label>

          <Button
            type="submit"
            disabled={isBusy}
            size="lg"
            className="h-11 w-full rounded-xl font-semibold shadow-md shadow-primary/15 transition-shadow hover:shadow-lg hover:shadow-primary/20"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("auth.signingIn")}
              </>
            ) : (
              <>
                {t("auth.signIn")}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </fieldset>

        <div className="border-t border-border/50 pt-4 text-center text-xs text-muted-foreground space-y-2">
          <p>
            {t("auth.noAccount")}{" "}
            <a
              href={apexUrl(ROUTES.onboarding)}
              className="font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
            >
              {t("auth.createMadrasa")}
            </a>
          </p>
          <p>
            {t("auth.notYourMadrasa")}{" "}
            <a
              href={apexUrl(ROUTES.login)}
              className="font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
            >
              {t("auth.viewAllMadrasaLinks")}
            </a>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
