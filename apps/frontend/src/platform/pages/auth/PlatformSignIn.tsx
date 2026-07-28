import React, { useId, useState } from "react";
import { Link } from "react-router-dom";
import { isValidEmail } from "@mms/shared";
import PlatformAuthLayout from "@/platform/components/PlatformAuthLayout";
import PasswordInput from "@/components/ui/PasswordInput";
import EntryPageHead, { formatEntryTitle } from "@/components/entry/EntryPageHead";
import { AuthEmailField } from "@/components/entry/AuthEmailField";
import { AuthSubmitButton } from "@/components/entry/AuthFormControls";
import { AuthStatusBanner } from "@/components/entry/AuthStatusBanner";
import { usePlatformAuth } from "@/platform/lib/PlatformAuthContext";
import { getPlatformErrorMessage } from "@/platform/lib/platformAuthErrors";
import { useTranslation } from "@/hooks/useTranslation";
import { FORM_ERROR } from "@/components/ui/formStyles";
import { ROUTES } from "@/lib/config/routes";
import { cn } from "@/lib/utils";

interface PlatformSignInErrors {
  email?: string;
  password?: string;
}

/** Apex-only sign-in for platform super-users who can provision new madrasas. */
export default function PlatformSignIn(): React.JSX.Element {
  const { t } = useTranslation();
  const { platformLogin, isPlatformLoginSubmitting } = usePlatformAuth();
  const formId = useId();
  const emailFieldId = `${formId}-email`;
  const passwordFieldId = `${formId}-password`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<PlatformSignInErrors>({});
  const [error, setError] = useState<string | null>(null);

  const pageTitle = formatEntryTitle(t("platform.signInTitle"), t("entry.productName"));

  const validate = (): PlatformSignInErrors => {
    const validationErrors: PlatformSignInErrors = {};
    const trimmed = email.trim();
    if (!trimmed) {
      validationErrors.email = t("auth.emailRequired");
    } else if (!isValidEmail(trimmed)) {
      validationErrors.email = t("auth.emailInvalid");
    }
    if (!password) {
      validationErrors.password = t("auth.passwordRequired");
    }
    return validationErrors;
  };

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
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
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-4"
          noValidate
          aria-busy={isPlatformLoginSubmitting}
        >
          {error ? <AuthStatusBanner message={error} /> : null}

          <fieldset disabled={isPlatformLoginSubmitting} className="m-0 min-w-0 space-y-4 border-0 p-0">
            <AuthEmailField
              id={emailFieldId}
              label={t("auth.email")}
              value={email}
              autoFocus
              autoComplete="username"
              placeholder={t("auth.emailPlaceholder")}
              error={fieldErrors.email}
              onChange={(value) => {
                setEmail(value);
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
                setError(null);
              }}
            />

            <div className="space-y-1.5">
              <PasswordInput
                id={passwordFieldId}
                name="password"
                label={t("auth.password")}
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  setError(null);
                }}
                placeholder={t("auth.passwordPlaceholder")}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? `${passwordFieldId}-error` : undefined}
                className={cn(
                  "h-11",
                  fieldErrors.password && "border-destructive focus-visible:ring-destructive/25",
                )}
              />
              {fieldErrors.password ? (
                <p id={`${passwordFieldId}-error`} className={FORM_ERROR} role="alert">
                  {fieldErrors.password}
                </p>
              ) : null}
              <div className="flex justify-end pt-0.5">
                <Link
                  to={ROUTES.platformForgotPassword}
                  className="rounded-md px-1 py-1 text-xs font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>
            </div>

            <AuthSubmitButton
              busy={isPlatformLoginSubmitting}
              busyLabel={t("auth.signingIn")}
              label={t("platform.signIn")}
            />
          </fieldset>
        </form>
      </PlatformAuthLayout>
    </>
  );
}
