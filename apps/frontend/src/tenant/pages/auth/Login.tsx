import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import AuthLayout from '@/tenant/components/AuthLayout';
import EntryPageHead, { formatEntryTitle } from '@/components/entry/EntryPageHead';
import { AuthEmailField } from '@/components/entry/AuthEmailField';
import { AuthPasswordField } from '@/components/entry/AuthPasswordField';
import { AuthSubmitButton } from '@/components/entry/AuthFormControls';
import { AuthStatusBanner } from '@/components/entry/AuthStatusBanner';
import { useSignInCredentialsForm } from '@/components/entry/useSignInCredentialsForm';
import { useAuth } from '@/lib/contexts/AuthContext';
import { DEFAULT_AUTH_REDIRECT, ROUTES } from '@/lib/config/routes';
import { apexUrl } from '@/lib/config/tenantConfig';
import { clear2FAState, is2FAVerified, mark2FAVerified } from '@/lib/twoFactor';
import { requiresTwoFactor } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useGlobalSettings } from '@/tenant/hooks/useGlobalSettings';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { Checkbox } from '@/components/ui/checkbox';
import {
  persistRememberedLoginEmail,
  readRememberedLoginEmail,
  readRememberMeEnabled,
} from '@/tenant/pages/auth/loginRememberEmail';

export default function Login(): React.ReactElement {
  const { login, isAuthenticated, exchangeHandoff, user } = useAuth();
  const settings = useGlobalSettings();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = (location.state as { from?: string } | null)?.from ?? DEFAULT_AUTH_REDIRECT;

  const {
    formId,
    emailFieldId,
    passwordFieldId,
    email,
    password,
    fieldErrors,
    error: formError,
    setError: setFormError,
    hasEmail: hasRememberedEmail,
    onEmailChange,
    onPasswordChange,
    validate,
  } = useSignInCredentialsForm({
    initialEmail: readRememberedLoginEmail(),
    t,
  });

  const rememberFieldId = `${formId}-remember`;
  const [rememberMe, setRememberMe] = useState<boolean>(readRememberMeEnabled);
  const [loading, setLoading] = useState<boolean>(false);
  const [handoffProcessing, setHandoffProcessing] = useState<boolean>(false);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    const needs2FA = requiresTwoFactor(settings, user) && !is2FAVerified();
    if (!needs2FA) {
      const dest = user?.mustChangePassword ? ROUTES.forcePasswordChange : redirectTo;
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, user, settings, navigate, redirectTo]);

  React.useEffect(() => {
    const handoff = new URLSearchParams(location.search).get('handoff');
    if (!handoff || isAuthenticated) return;

    setHandoffProcessing(true);
    setFormError('');
    void exchangeHandoff(handoff)
      .catch((err: unknown) => {
        setFormError(getAuthErrorMessage(err, t));
      })
      .finally(() => setHandoffProcessing(false));
  }, [location.search, exchangeHandoff, isAuthenticated, setFormError, t]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const trimmedEmail = email.trim();
    try {
      const { user: loggedInUser, requires2FA } = await login(trimmedEmail, password);
      persistRememberedLoginEmail(trimmedEmail, rememberMe);
      if (requires2FA) {
        navigate(ROUTES.twoFactor, { replace: true, state: { from: redirectTo } });
        return;
      }
      clear2FAState();
      mark2FAVerified();
      const dest = loggedInUser.mustChangePassword ? ROUTES.forcePasswordChange : redirectTo;
      navigate(dest, { replace: true });
    } catch (err: unknown) {
      setFormError(getAuthErrorMessage(err, t));
    } finally {
      setLoading(false);
    }
  };

  const isBusy = loading || handoffProcessing;
  const pageTitle = formatEntryTitle(t('auth.signInTitle'), t('entry.productName'));

  return (
    <>
      <EntryPageHead title={pageTitle} description={t('entry.meta.tenantSignIn')} />
      <AuthLayout
        title={t('auth.signInTitle')}
        subtitle={t('auth.signInSubtitle')}
        footer={
          <div className="space-y-2 text-xs text-muted-foreground">
            <div>
              <Link
                to={`${ROUTES.forgotPassword}?activate=1`}
                className="inline-flex min-h-11 items-center font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
              >
                {t('auth.activateAccount')}
              </Link>
            </div>
            <div>
              {t('auth.notYourMadrasa')}{' '}
              <a
                href={apexUrl(ROUTES.home)}
                className="inline-flex min-h-11 items-center font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
              >
                {t('auth.viewAllMadrasaLinks')}
              </a>
            </div>
          </div>
        }
      >
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4" noValidate aria-busy={isBusy}>
          {handoffProcessing ? (
            <AuthStatusBanner variant="loading" message={t('auth.handoffProcessing')} />
          ) : (location.state as { passwordChanged?: boolean } | null)?.passwordChanged ? (
            <AuthStatusBanner variant="info" message={t('account.passwordChanged')} />
          ) : formError ? (
            <AuthStatusBanner message={formError} />
          ) : null}

          <fieldset disabled={isBusy} className="m-0 min-w-0 space-y-4 border-0 p-0">
            <legend className="sr-only">{t('auth.signInTitle')}</legend>
            <AuthEmailField
              id={emailFieldId}
              label={t('auth.emailAddress')}
              value={email}
              autoFocus={!hasRememberedEmail}
              disabled={isBusy}
              placeholder={t('auth.emailPlaceholder')}
              error={fieldErrors.email}
              onChange={onEmailChange}
            />

            <AuthPasswordField
              id={passwordFieldId}
              label={t('auth.password')}
              value={password}
              autoFocus={hasRememberedEmail}
              disabled={isBusy}
              placeholder={t('auth.passwordPlaceholder')}
              error={fieldErrors.password}
              onChange={onPasswordChange}
            />

            <div className="flex items-center justify-between gap-3 pt-0.5">
              <label htmlFor={rememberFieldId} className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg">
                <Checkbox
                  id={rememberFieldId}
                  checked={rememberMe}
                  disabled={isBusy}
                  onCheckedChange={(checked) => {
                    const shouldRememberEmail = checked === true;
                    setRememberMe(shouldRememberEmail);
                    if (!shouldRememberEmail) {
                      persistRememberedLoginEmail('', false);
                    }
                  }}
                />
                <span className="text-sm text-muted-foreground">{t('auth.rememberMe')}</span>
              </label>

              <Link
                to={ROUTES.forgotPassword}
                className="inline-flex min-h-11 items-center rounded-md px-1 text-xs font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <AuthSubmitButton
              busy={loading}
              busyLabel={t('auth.signingIn')}
              label={t('auth.signIn')}
              disabled={handoffProcessing}
            />
          </fieldset>
        </form>
      </AuthLayout>
    </>
  );
}
