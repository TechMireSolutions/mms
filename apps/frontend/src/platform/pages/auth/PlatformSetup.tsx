import React, { useState } from "react";
import { ShieldCheck, User } from "lucide-react";
import { type PlatformSetupRegisterResult, maskEmail } from "@mms/shared";
import {
  getPlatformRegisterError,
} from "@/platform/lib/platformValidation";
import PlatformAuthLayout from "@/platform/components/PlatformAuthLayout";
import {
  AuthEmailField,
  AuthPasswordField,
  AuthResendCodeControl,
  AuthStatusBanner,
  AuthSubmitButton,
  AuthTextField,
  EntryPageHead,
  formatEntryTitle,
} from "@/components/entry";
import { OtpInput, createEmptyOtp, isOtpComplete } from "@/components/ui/OtpInput";
import { useTranslation } from "@/hooks/useTranslation";
import { useResendCountdown } from "@/hooks/useResendCountdown";
import { getPlatformErrorMessage } from "@/platform/lib/platformAuthErrors";
import { usePlatformAuth } from "@/platform/lib/PlatformAuthContext";
import { useInvalidatePlatformSetupStatus } from "@/platform/hooks/usePlatformSetupStatus";
import {
  usePlatformSetupRegister,
  usePlatformSetupResend,
  usePlatformSetupVerify,
} from "@/platform/hooks/usePlatformAuthActions";

interface PlatformSetupProps {
  smtpConfigured: boolean;
}

type SetupStep = "register" | "verify";

/**
 * First-run wizard to create the platform super-user with email verification.
 */
export default function PlatformSetup({ smtpConfigured }: PlatformSetupProps): React.JSX.Element {
  const { t } = useTranslation();
  const checkPlatformAuth = usePlatformAuth().checkPlatformAuth;
  const invalidateSetupStatus = useInvalidatePlatformSetupStatus();

  const registerMutation = usePlatformSetupRegister();
  const verifyMutation = usePlatformSetupVerify();
  const resendMutation = usePlatformSetupResend();

  const [step, setStep] = useState<SetupStep>("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [setupSession, setSetupSession] = useState<PlatformSetupRegisterResult | null>(null);
  const [code, setCode] = useState(createEmptyOtp);
  const [error, setError] = useState<string | null>(null);
  const [setupNotice, setSetupNotice] = useState<string | null>(null);
  const [resendCycle, setResendCycle] = useState(0);
  const resendCountdown = useResendCountdown(step === "verify", 30, resendCycle);

  const loading = registerMutation.isPending || verifyMutation.isPending || resendMutation.isPending;

  const handleRegister = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    setSetupNotice(null);

    const validationError = getPlatformRegisterError(name, email, password, t);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!smtpConfigured && import.meta.env.PROD) {
      setError(t("platform.setupSmtpRequired"));
      return;
    }

    try {
      const result = await registerMutation.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      setSetupSession(result);
      setStep("verify");
      setCode(createEmptyOtp());
      setSetupNotice(result.emailSent ? t("platform.setupEmailSent") : null);
    } catch (err) {
      setError(getPlatformErrorMessage(err, t));
    }
  };

  const handleVerify = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!setupSession) return;

    if (!isOtpComplete(code)) {
      setError(t("auth.otpIncomplete"));
      return;
    }

    setError(null);
    try {
      await verifyMutation.mutateAsync({
        setupId: setupSession.setupId,
        code: code.join(""),
      });
      invalidateSetupStatus();
      await checkPlatformAuth();
    } catch (err) {
      setError(getPlatformErrorMessage(err, t));
    }
  };

  const handleResend = async (): Promise<void> => {
    if (!setupSession || resendCountdown > 0) return;
    setError(null);
    try {
      const result = await resendMutation.mutateAsync(setupSession.setupId);
      setSetupSession(result);
      setSetupNotice(result.emailSent ? t("platform.setupEmailSent") : null);
      setResendCycle((value) => value + 1);
    } catch (err) {
      setError(getPlatformErrorMessage(err, t));
    }
  };

  const pageHead = (
    <EntryPageHead
      title={formatEntryTitle(
        step === "verify" ? t("platform.setupVerifyTitle") : t("platform.setupTitle"),
        t("entry.productName"),
      )}
      description={t("entry.meta.platformSetup")}
    />
  );

  if (step === "verify" && setupSession) {
    return (
      <>
        {pageHead}
        <PlatformAuthLayout
          title={t("platform.setupVerifyTitle")}
          subtitle={t("platform.setupVerifySubtitle", { email: maskEmail(setupSession.email) })}
        >
          <form onSubmit={(event) => void handleVerify(event)} className="space-y-4" noValidate aria-busy={loading}>
            <fieldset disabled={loading} className="m-0 min-w-0 space-y-4 border-0 p-0">
              {setupNotice ? <AuthStatusBanner variant="info" message={setupNotice} /> : null}
              {setupSession.devCode ? (
                <AuthStatusBanner
                  variant="warning"
                  message={t("platform.setupDevCodeHint", { code: setupSession.devCode })}
                />
              ) : null}

              <OtpInput
                value={code}
                onChange={(next) => {
                  setCode(next);
                  if (error) setError(null);
                }}
                ariaLabel={t("platform.setupVerifyEmail")}
                disabled={loading}
                idPrefix="platform-otp"
                hasError={Boolean(error)}
              />

              {error ? <AuthStatusBanner message={error} /> : null}

              <AuthSubmitButton
                busy={loading}
                busyLabel={t("auth.verifying")}
                label={t("platform.setupVerifyEmail")}
                disabled={!isOtpComplete(code)}
                icon={ShieldCheck}
                showArrow={false}
              />

              <AuthResendCodeControl
                countdown={resendCountdown}
                onResend={() => void handleResend()}
                disabled={loading}
                countdownLabel={t("auth.resendCountdown", { seconds: resendCountdown })}
                resendLabel={t("auth.resendCode")}
              />
            </fieldset>
          </form>
        </PlatformAuthLayout>
      </>
    );
  }

  return (
    <>
      {pageHead}
      <PlatformAuthLayout title={t("platform.setupTitle")} subtitle={t("platform.setupSubtitle")}>
        <form onSubmit={(event) => void handleRegister(event)} className="space-y-4" noValidate aria-busy={loading}>
          {!smtpConfigured && import.meta.env.PROD ? (
            <AuthStatusBanner variant="warning" message={t("platform.setupSmtpRequired")} />
          ) : null}
          {error ? <AuthStatusBanner message={error} /> : null}

          <fieldset disabled={loading} className="m-0 min-w-0 space-y-4 border-0 p-0">
            <AuthTextField
              id="platform-setup-name"
              label={t("platform.setupFullName")}
              value={name}
              autoFocus
              autoComplete="name"
              icon={User}
              onChange={(value) => {
                setName(value);
                setError(null);
              }}
            />

            <AuthEmailField
              id="platform-setup-email"
              label={t("auth.emailAddress")}
              value={email}
              autoComplete="email"
              placeholder={t("auth.emailPlaceholder")}
              onChange={(value) => {
                setEmail(value);
                setError(null);
              }}
            />

            <AuthPasswordField
              id="platform-setup-password"
              label={t("auth.password")}
              autoComplete="new-password"
              value={password}
              onChange={(value) => {
                setPassword(value);
                setError(null);
              }}
            />

            <AuthSubmitButton
              busy={loading}
              busyLabel={t("common.save")}
              label={t("platform.setupCreateAccount")}
            />
          </fieldset>
        </form>
      </PlatformAuthLayout>
    </>
  );
}
