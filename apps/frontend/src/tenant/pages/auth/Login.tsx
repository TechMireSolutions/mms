import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '@/tenant/components/AuthLayout';
import EntryPageHead, { formatEntryTitle } from '@/components/entry/EntryPageHead';
import { AuthEmailField } from '@/components/entry/AuthEmailField';
import { AuthPasswordField } from '@/components/entry/AuthPasswordField';
import { AuthSubmitButton } from '@/components/entry/AuthFormControls';
import { AuthStatusBanner } from '@/components/entry/AuthStatusBanner';
import {
  firstSignInErrorFieldId,
  focusAuthField,
  validateSignInCredentials,
  type SignInFieldErrors,
} from '@/components/entry/authValidation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { DEFAULT_AUTH_REDIRECT, ROUTES } from '@/lib/config/routes';
import { apexUrl } from '@/lib/config/tenantConfig';
import { clear2FAState, is2FAVerified, mark2FAVerified } from '@/lib/twoFactor';
import { requiresTwoFactor } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { Checkbox } from '@/components/ui/checkbox';
import {
  persistRememberedLoginEmail,
  readRememberedLoginEmail,
  readRememberMeEnabled,
} from '@/tenant/pages/auth/loginRememberEmail';

export default function Login(): React.ReactElement {
  const { login, isAuthenticated, exchangeHandoff, user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const formId = React.useId();
  const emailFieldId = `${formId}-email`;
  const passwordFieldId = `${formId}-password`;
  const rememberFieldId = `${formId}-remember`;

  const redirectTo = (location.state as { from?: string } | null)?.from ?? DEFAULT_AUTH_REDIRECT;

  const [email, setEmail] = useState<string>(readRememberedLoginEmail);
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(readRememberMeEnabled);
  const [loading, setLoading] = useState<boolean>(false);
  const [handoffProcessing, setHandoffProcessing] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<SignInFieldErrors>({});
  const [formError, setFormError] = useState<string>('');

  React.useEffect(() => {
    if (!isAuthenticated) return;
    void import('@/lib/db').then(({ getGlobalSettings }) => {
      const settings = getGlobalSettings();
      const needs2FA = requiresTwoFactor(settings, user) && !is2FAVerified();
      if (!needs2FA) {
        navigate(user?.mustChangePassword ? ROUTES.forcePasswordChange : redirectTo, { replace: true });
      }
    });
  }, [isAuthenticated, user, navigate, redirectTo]);

  React.useEffect(() => {
    const handoff = new URLSearchParams(location.search).get('handoff');
    if (!handoff || isAuthenticated) return;

    setHandoffProcessing(true);
    setFormError('');
    void exchangeHandoff(handoff)
      .then(() => navigate(redirectTo, { replace: true }))
      .catch((err: unknown) => {
        setFormError(err instanceof Error ? err.message : t('auth.handoffFailed'));
      })
      .finally(() => setHandoffProcessing(false));
  }, [location.search, exchangeHandoff, isAuthenticated, navigate, redirectTo, t]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setFormError('');
    const errs = validateSignInCredentials(email, password, t);
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      const focusId = firstSignInErrorFieldId(errs, emailFieldId, passwordFieldId);
      if (focusId) focusAuthField(focusId);
      return;
    }
    setFieldErrors({});
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
      navigate(loggedInUser.mustChangePassword ? ROUTES.forcePasswordChange : redirectTo, { replace: true });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : t('auth.invalidCredentials'));
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
          <p className="text-xs text-muted-foreground">
            {t('auth.notYourMadrasa')}{' '}
            <a
              href={apexUrl(ROUTES.home)}
              className="inline-flex min-h-11 items-center font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
            >
              {t('auth.viewAllMadrasaLinks')}
            </a>
          </p>
        }
      >
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4" noValidate aria-busy={isBusy}>
          {handoffProcessing ? (
            <AuthStatusBanner variant="loading" message={t('auth.handoffProcessing')} />
          ) : formError ? (
            <AuthStatusBanner message={formError} />
          ) : null}

          <fieldset disabled={isBusy} className="m-0 min-w-0 space-y-4 border-0 p-0">
            <AuthEmailField
              id={emailFieldId}
              label={t('auth.emailAddress')}
              value={email}
              autoFocus
              disabled={isBusy}
              placeholder={t('auth.emailPlaceholder')}
              error={fieldErrors.email}
              onChange={(value) => {
                setEmail(value);
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
                setFormError('');
              }}
            />

            <AuthPasswordField
              id={passwordFieldId}
              label={t('auth.password')}
              value={password}
              placeholder={t('auth.passwordPlaceholder')}
              error={fieldErrors.password}
              forgotPasswordTo={ROUTES.forgotPassword}
              forgotPasswordLabel={t('auth.forgotPassword')}
              onChange={(value) => {
                setPassword(value);
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
                setFormError('');
              }}
            />

            <label htmlFor={rememberFieldId} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-0.5 py-1">
              <Checkbox
                id={rememberFieldId}
                checked={rememberMe}
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
