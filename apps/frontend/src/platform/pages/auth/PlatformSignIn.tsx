import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import PlatformAuthLayout from "@/platform/components/PlatformAuthLayout";
import EntryPageHead, { formatEntryTitle } from "@/components/entry/EntryPageHead";
import { AuthEmailField } from "@/components/entry/AuthEmailField";
import { AuthPasswordField } from "@/components/entry/AuthPasswordField";
import { AuthResendCodeControl, AuthSubmitButton } from "@/components/entry/AuthFormControls";
import { AuthStatusBanner } from "@/components/entry/AuthStatusBanner";
import { AuthTextField } from "@/components/entry/AuthTextField";
import {
  firstSignInErrorFieldId,
  focusAuthField,
  validateSignInCredentials,
  type SignInFieldErrors,
} from "@/components/entry/authValidation";
import { usePlatformAuth, type PlatformLoginOutcome } from "@/platform/lib/PlatformAuthContext";
import { getPlatformErrorMessage } from "@/platform/lib/platformAuthErrors";
import { useTranslation } from "@/hooks/useTranslation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ROUTES } from "@/lib/config/routes";

type SignInStep = "credentials" | "twoFactor";

/** Apex-only sign-in for platform super-users who can provision and manage madrasas. */
export default function PlatformSignIn(): React.JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const { platformLogin, platformVerify2FA, platformResend2FA, isPlatformLoginSubmitting } = usePlatformAuth();
  const emailFieldId = "platform-email";
  const passwordFieldId = "platform-password";
  const codeFieldId = "platform-2fa-code";

  const [step, setStep] = useState<SignInStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState<SignInFieldErrors>({});
  const [codeError, setCodeError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown before the code can be resent (seconds).
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = window.setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendCooldown]);

  const pageTitle = formatEntryTitle(t("platform.signInTitle"), t("entry.productName"));

  const handleCredentialsSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    const errs = validateSignInCredentials(email, password, t);
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      const focusId = firstSignInErrorFieldId(errs, emailFieldId, passwordFieldId);
      if (focusId) focusAuthField(focusId);
      return;
    }
    setFieldErrors({});
    try {
      const outcome: PlatformLoginOutcome = await platformLogin(email.trim(), password);
      if (outcome.requires2FA) {
        setChallengeId(outcome.challengeId);
        setCode("");
        setCodeError(undefined);
        setError(null);
        setResendCooldown(30);
        setStep("twoFactor");
      }
    } catch (err) {
      setError(getPlatformErrorMessage(err, t));
    }
  };

  const handleCodeSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    const trimmed = code.trim();
    if (!trimmed) {
      setCodeError(t("platform.validationFailed"));
      return;
    }
    setCodeError(undefined);
    try {
      await platformVerify2FA(challengeId, trimmed);
    } catch (err) {
      setError(getPlatformErrorMessage(err, t));
    }
  };

  const handleResend = async (): Promise<void> => {
    setError(null);
    try {
      await platformResend2FA(challengeId);
      setCode("");
      setResendCooldown(30);
    } catch (err) {
      setError(getPlatformErrorMessage(err, t));
    }
  };

  const backToCredentials = (): void => {
    setStep("credentials");
    setChallengeId("");
    setCode("");
    setCodeError(undefined);
    setError(null);
    setResendCooldown(0);
  };

  const subtitle =
    step === "twoFactor"
      ? t("platform.twoFactorSubtitle")
      : t("platform.signInSubtitle");

  return (
    <>
      <EntryPageHead title={pageTitle} description={t("entry.meta.platformSignIn")} />
      <PlatformAuthLayout
        title={step === "twoFactor" ? t("auth.twoFactorTitle") : t("platform.signInTitle")}
        subtitle={subtitle}
      >
        {step === "credentials" ? (
          <motion.form
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            onSubmit={(event) => void handleCredentialsSubmit(event)}
            className="space-y-4 text-start"
            noValidate
            aria-busy={isPlatformLoginSubmitting}
          >
            {error ? <AuthStatusBanner message={error} /> : null}

            <fieldset disabled={isPlatformLoginSubmitting} className="m-0 min-w-0 space-y-4 border-0 p-0">
              <AuthEmailField
                id={emailFieldId}
                label={t("auth.emailAddress")}
                value={email}
                autoFocus
                autoComplete="email"
                placeholder=""
                error={fieldErrors.email}
                onChange={(value) => {
                  setEmail(value);
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  setError(null);
                }}
              />

              <AuthPasswordField
                id={passwordFieldId}
                label={t("auth.password")}
                value={password}
                placeholder=""
                error={fieldErrors.password}
                forgotPasswordTo={ROUTES.platformForgotPassword}
                forgotPasswordLabel={t("auth.forgotPassword")}
                onChange={(value) => {
                  setPassword(value);
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  setError(null);
                }}
              />

              <AuthSubmitButton
                busy={isPlatformLoginSubmitting}
                busyLabel={t("auth.signingIn")}
                label={t("platform.signIn")}
              />
            </fieldset>
          </motion.form>
        ) : (
          <motion.form
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            onSubmit={(event) => void handleCodeSubmit(event)}
            className="space-y-4 text-start"
            noValidate
            aria-busy={isPlatformLoginSubmitting}
          >
            {error ? <AuthStatusBanner message={error} /> : null}

            <fieldset disabled={isPlatformLoginSubmitting} className="m-0 min-w-0 space-y-4 border-0 p-0">
              <AuthTextField
                id={codeFieldId}
                label={t("account.verificationCode")}
                value={code}
                autoFocus
                autoComplete="one-time-code"
                inputMode="numeric"
                spellCheck={false}
                placeholder=""
                error={codeError}
                icon={ShieldCheck}
                onChange={(value) => {
                  setCode(value.replace(/[^\d]/g, ""));
                  setCodeError(undefined);
                  setError(null);
                }}
              />

              <AuthSubmitButton
                busy={isPlatformLoginSubmitting}
                busyLabel={t("platform.twoFactorVerifying")}
                label={t("platform.twoFactorVerify")}
                icon={ShieldCheck}
              />

              <AuthResendCodeControl
                countdown={resendCooldown}
                onResend={() => void handleResend()}
                disabled={isPlatformLoginSubmitting}
                countdownLabel={t("auth.resendCountdown", { seconds: String(resendCooldown) })}
                resendLabel={t("auth.resendCode")}
              />
            </fieldset>

            <p className="text-center text-xs text-muted-foreground">
              <button
                type="button"
                disabled={isPlatformLoginSubmitting}
                onClick={backToCredentials}
                className="inline-flex min-h-11 items-center rounded-md px-2 font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
              >
                {t("auth.backToSignIn")}
              </button>
            </p>
          </motion.form>
        )}
      </PlatformAuthLayout>
    </>
  );
}
