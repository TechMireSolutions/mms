import React from "react";
import { ShieldCheck } from "lucide-react";
import { maskEmail, type PlatformSetupRegisterResult } from "@mms/shared";
import {
  AuthResendCodeControl,
  AuthStatusBanner,
  AuthSubmitButton,
} from "@/components/entry";
import { OtpInput, isOtpComplete } from "@/components/ui/OtpInput";
import PlatformAuthLayout from "@/platform/components/PlatformAuthLayout";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

interface PlatformSetupVerifyFormProps {
  t: TranslationFunction;
  setupSession: PlatformSetupRegisterResult;
  code: string[];
  setCode: (next: string[]) => void;
  error: string | null;
  setupNotice: string | null;
  loading: boolean;
  resendCountdown: number;
  onVerify: (event: React.FormEvent) => Promise<void>;
  onResend: () => Promise<void>;
  onClearError: () => void;
}

export function PlatformSetupVerifyForm({
  t,
  setupSession,
  code,
  setCode,
  error,
  setupNotice,
  loading,
  resendCountdown,
  onVerify,
  onResend,
  onClearError,
}: PlatformSetupVerifyFormProps): React.JSX.Element {
  return (
    <PlatformAuthLayout
      title={t("platform.setupVerifyTitle")}
      subtitle={t("platform.setupVerifySubtitle", { email: maskEmail(setupSession.email) })}
    >
      <form onSubmit={(event) => void onVerify(event)} className="space-y-4" noValidate aria-busy={loading}>
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
              if (error) onClearError();
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
            onResend={() => void onResend()}
            disabled={loading}
            countdownLabel={t("auth.resendCountdown", { seconds: resendCountdown })}
            resendLabel={t("auth.resendCode")}
          />
        </fieldset>
      </form>
    </PlatformAuthLayout>
  );
}
