import React, { useState } from "react";
import { motion } from "framer-motion";
import PlatformAuthLayout from "@/platform/components/PlatformAuthLayout";
import EntryPageHead, { formatEntryTitle } from "@/components/entry/EntryPageHead";
import { AuthEmailField } from "@/components/entry/AuthEmailField";
import { AuthPasswordField } from "@/components/entry/AuthPasswordField";
import { AuthSubmitButton } from "@/components/entry/AuthFormControls";
import { AuthStatusBanner } from "@/components/entry/AuthStatusBanner";
import {
  firstSignInErrorFieldId,
  focusAuthField,
  validateSignInCredentials,
  type SignInFieldErrors,
} from "@/components/entry/authValidation";
import { usePlatformAuth } from "@/platform/lib/PlatformAuthContext";
import { getPlatformErrorMessage } from "@/platform/lib/platformAuthErrors";
import { useTranslation } from "@/hooks/useTranslation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ROUTES } from "@/lib/config/routes";

/** Apex-only sign-in for platform super-users who can provision and manage madrasas. */
export default function PlatformSignIn(): React.JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const { platformLogin, isPlatformLoginSubmitting } = usePlatformAuth();
  const emailFieldId = "platform-email";
  const passwordFieldId = "platform-password";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<SignInFieldErrors>({});
  const [error, setError] = useState<string | null>(null);

  const pageTitle = formatEntryTitle(t("platform.signInTitle"), t("entry.productName"));

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
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
      await platformLogin(email.trim(), password);
    } catch (err) {
      setError(getPlatformErrorMessage(err, t));
    }
  };

  return (
    <>
      <EntryPageHead title={pageTitle} description={t("entry.meta.platformSignIn")} />
      <PlatformAuthLayout
        title={t("platform.signInTitle")}
        subtitle={t("platform.signInSubtitle")}
      >
        <motion.form
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          onSubmit={(event) => void handleSubmit(event)}
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
      </PlatformAuthLayout>
    </>
  );
}
