import React, { useState } from "react";
import { type PlatformSetupRegisterResult } from "@mms/shared";
import { getPlatformRegisterError } from "@/platform/lib/platformValidation";
import { formatEntryTitle } from "@/components/entry";
import { createEmptyOtp, isOtpComplete } from "@/components/ui/OtpInput";
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
import { ApiError } from "@/lib/apiClient";

type SetupStep = "register" | "verify";

export function usePlatformSetupController(smtpConfigured: boolean) {
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

  const pageTitle = formatEntryTitle(
    step === "verify" ? t("platform.setupVerifyTitle") : t("platform.setupTitle"),
    t("entry.productName"),
  );

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
      if (err instanceof ApiError && (err.type === 'too_many_attempts' || err.type === 'invalid_setup')) {
        setSetupSession(null);
        setStep('register');
        setCode(createEmptyOtp());
      }
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
      if (err instanceof ApiError && (err.type === 'too_many_attempts' || err.type === 'invalid_setup')) {
        setSetupSession(null);
        setStep('register');
        setCode(createEmptyOtp());
      }
    }
  };

  const clearError = () => setError(null);

  return {
    t,
    step,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    setupSession,
    code,
    setCode,
    error,
    setupNotice,
    resendCountdown,
    loading,
    pageTitle,
    handleRegister,
    handleVerify,
    handleResend,
    clearError,
  };
}
