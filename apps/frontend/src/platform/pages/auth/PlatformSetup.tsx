import React from "react";
import { EntryPageHead } from "@/components/entry";
import { PlatformSetupRegisterForm } from "@/platform/pages/auth/PlatformSetupRegisterForm";
import { PlatformSetupVerifyForm } from "@/platform/pages/auth/PlatformSetupVerifyForm";
import { usePlatformSetupController } from "@/platform/pages/auth/usePlatformSetupController";

interface PlatformSetupProps {
  smtpConfigured: boolean;
}

/**
 * First-run wizard to create the platform super-user with email verification.
 */
export default function PlatformSetup({ smtpConfigured }: PlatformSetupProps): React.JSX.Element {
  const controller = usePlatformSetupController(smtpConfigured);

  const pageHead = (
    <EntryPageHead
      title={controller.pageTitle}
      description={controller.t("entry.meta.platformSetup")}
    />
  );

  if (controller.step === "verify" && controller.setupSession) {
    return (
      <>
        {pageHead}
        <PlatformSetupVerifyForm
          t={controller.t}
          setupSession={controller.setupSession}
          code={controller.code}
          setCode={controller.setCode}
          error={controller.error}
          setupNotice={controller.setupNotice}
          loading={controller.loading}
          resendCountdown={controller.resendCountdown}
          onVerify={controller.handleVerify}
          onResend={controller.handleResend}
          onClearError={controller.clearError}
        />
      </>
    );
  }

  return (
    <>
      {pageHead}
      <PlatformSetupRegisterForm
        t={controller.t}
        smtpConfigured={smtpConfigured}
        name={controller.name}
        setName={controller.setName}
        email={controller.email}
        setEmail={controller.setEmail}
        password={controller.password}
        setPassword={controller.setPassword}
        error={controller.error}
        loading={controller.loading}
        onRegister={controller.handleRegister}
        onClearError={controller.clearError}
      />
    </>
  );
}
