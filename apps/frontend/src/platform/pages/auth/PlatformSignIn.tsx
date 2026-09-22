import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import PlatformAuthLayout from "@/platform/components/PlatformAuthLayout";
import EntryPageHead, { formatEntryTitle } from "@/components/entry/EntryPageHead";
import { AuthEmailField } from "@/components/entry/AuthEmailField";
import { AuthPasswordField } from "@/components/entry/AuthPasswordField";
import {
  AuthBackLink,
  AuthResendCodeControl,
  AuthSubmitButton,
} from "@/components/entry/AuthFormControls";
import { AuthStatusBanner } from "@/components/entry/AuthStatusBanner";
import { useSignInCredentialsForm } from "@/components/entry/useSignInCredentialsForm";
import { OtpInput, createEmptyOtp, isOtpComplete } from "@/components/ui/OtpInput";
import { useResendCountdown } from "@/hooks/useResendCountdown";
import { usePlatformAuth, type PlatformLoginOutcome } from "@/platform/lib/PlatformAuthContext";
import { getPlatformErrorMessage } from "@/platform/lib/platformAuthErrors";
import { useTranslation } from "@/hooks/useTranslation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ROUTES } from "@/lib/config/routes";

type SignInStep = "credentials" | "twoFactor";

/**
 * Shared animated form wrapper — owns the Framer Motion entry animation,
 * aria-busy, noValidate, and layout class so each step stays free of
 * repeated motion boilerplate.
 */
function PlatformAuthForm({
  onSubmit,
  busy,
  reducedMotion,
  children,
}: {
  onSubmit: (event: React.FormEvent) => void;
  busy: boolean;
  reducedMotion: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <motion.form
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      onSubmit={(event) => onSubmit(event)}
      className="space-y-4 text-start"
      noValidate
      aria-busy={busy}
    >
      {children}
    </motion.form>
  );
}

/** Apex-only sign-in for platform super-users who can provision and manage madrasas. */
export default function PlatformSignIn(): React.JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const {
    platformLogin,
    platformVerify2FA,
    platformResend2FA,
    isPlatformLoginSubmitting,
  } = usePlatformAuth();

  const [step, setStep] = useState<SignInStep>("credentials");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState(createEmptyOtp);
  const [codeError, setCodeError] = useState<string | undefined>();
  const [resendCycle, setResendCycle] = useState(0);

  const {
    emailFieldId,
    passwordFieldId,
    email,
    password,
    fieldErrors,
    error,
    setError,
    hasEmail,
    onEmailChange,
    onPasswordChange,
    validate,
  } = useSignInCredentialsForm({ t });

  const resendCountdown = useResendCountdown(step === "twoFactor", 30, resendCycle);
  const isComplete = isOtpComplete(code);

  const pageTitle = formatEntryTitle(t("platform.signInTitle"), t("entry.productName"));

  const handleCredentialsSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!validate()) return;
    try {
      const outcome: PlatformLoginOutcome = await platformLogin(email.trim(), password);
      if (outcome.requires2FA) {
        setChallengeId(outcome.challengeId);
        setCode(createEmptyOtp());
        setCodeError(undefined);
        setError(null);
        setResendCycle((c) => c + 1);
        setStep("twoFactor");
      }
    } catch (err) {
      setError(getPlatformErrorMessage(err, t));
    }
  };

  const handleCodeSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    if (!isComplete) {
      setCodeError(t("auth.otpIncomplete"));
      return;
    }
    setCodeError(undefined);
    try {
      await platformVerify2FA(challengeId, code.join(""));
    } catch (err) {
      setError(getPlatformErrorMessage(err, t));
      setCode(createEmptyOtp());
    }
  };

  const handleResend = async (): Promise<void> => {
    setError(null);
    try {
      await platformResend2FA(challengeId);
      setCode(createEmptyOtp());
      setResendCycle((c) => c + 1);
    } catch (err) {
      setError(getPlatformErrorMessage(err, t));
    }
  };

  const backToCredentials = (): void => {
    setStep("credentials");
    setChallengeId("");
    setCode(createEmptyOtp());
    setCodeError(undefined);
    setError(null);
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
          <PlatformAuthForm
            onSubmit={handleCredentialsSubmit}
            busy={isPlatformLoginSubmitting}
            reducedMotion={reducedMotion}
          >
            {error ? <AuthStatusBanner message={error} /> : null}

            <fieldset disabled={isPlatformLoginSubmitting} className="m-0 min-w-0 space-y-4 border-0 p-0">
              <legend className="sr-only">{t("platform.signInTitle")}</legend>
              <AuthEmailField
                id={emailFieldId}
                label={t("auth.emailAddress")}
                value={email}
                autoFocus={!hasEmail}
                autoComplete="email"
                placeholder=""
                error={fieldErrors.email}
                onChange={onEmailChange}
              />

              <AuthPasswordField
                id={passwordFieldId}
                label={t("auth.password")}
                value={password}
                autoFocus={hasEmail}
                placeholder=""
                error={fieldErrors.password}
                forgotPasswordTo={ROUTES.platformForgotPassword}
                forgotPasswordLabel={t("auth.forgotPassword")}
                onChange={onPasswordChange}
              />

              <AuthSubmitButton
                busy={isPlatformLoginSubmitting}
                busyLabel={t("auth.signingIn")}
                label={t("platform.signIn")}
              />
            </fieldset>
          </PlatformAuthForm>
        ) : (
          <PlatformAuthForm
            onSubmit={handleCodeSubmit}
            busy={isPlatformLoginSubmitting}
            reducedMotion={reducedMotion}
          >
            {error ? <AuthStatusBanner message={error} /> : null}

            <fieldset disabled={isPlatformLoginSubmitting} className="m-0 min-w-0 space-y-4 border-0 p-0">
              <legend className="sr-only">{t("auth.twoFactorTitle")}</legend>

              <OtpInput
                value={code}
                onChange={(next) => {
                  setCode(next);
                  if (codeError) setCodeError(undefined);
                  if (error) setError(null);
                }}
                ariaLabel={t("auth.twoFactorTitle")}
                disabled={isPlatformLoginSubmitting}
                hasError={Boolean(codeError || error)}
              />

              {codeError ? (
                <p className="text-center text-xs text-destructive" role="alert">
                  {codeError}
                </p>
              ) : null}

              <AuthSubmitButton
                busy={isPlatformLoginSubmitting}
                busyLabel={t("platform.twoFactorVerifying")}
                label={t("platform.twoFactorVerify")}
                icon={ShieldCheck}
                disabled={!isComplete}
                showArrow={false}
              />

              <AuthResendCodeControl
                countdown={resendCountdown}
                onResend={() => void handleResend()}
                disabled={isPlatformLoginSubmitting}
                countdownLabel={t("auth.resendCountdown", { seconds: String(resendCountdown) })}
                resendLabel={t("auth.resendCode")}
              />

              <AuthBackLink
                onClick={backToCredentials}
                disabled={isPlatformLoginSubmitting}
                label={t("auth.backToSignIn")}
              />
            </fieldset>
          </PlatformAuthForm>
        )}
      </PlatformAuthLayout>
    </>
  );
}
