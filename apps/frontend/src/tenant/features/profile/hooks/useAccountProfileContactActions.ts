import { useEffect, useState } from 'react';
import { getPrimaryEmail, getPrimaryPhone } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useTenantProfile } from '@/tenant/hooks/useTenantProfile';
import { apiJson, ApiError } from '@/lib/apiClient';
import { getApiValidationMessage } from '@/lib/apiValidationMessage';
import { notify } from '@/lib/notify';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { TENANT_PROFILE_KEY } from '@/tenant/hooks/useTenantProfile';

export function useAccountProfileContactActions() {
  const { t } = useTranslation();
  const { checkUserAuth } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile, refetch } = useTenantProfile();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [savingContact, setSavingContact] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.contact?.name ?? profile.name ?? '');
    setPhone(profile.contact ? (getPrimaryPhone(profile.contact) || '') : ((profile as unknown as Record<string, unknown>).phone as string | undefined ?? ''));
    setContactEmail(profile.contact ? (getPrimaryEmail(profile.contact) || '') : ((profile as unknown as Record<string, unknown>).email as string | undefined ?? ''));
  }, [profile]);

  const handleSaveContact = async (): Promise<void> => {
    if (!profile?.contact) return;
    setSavingContact(true);
    try {
      const emails = contactEmail.trim()
        ? [{ label: 'Primary', address: contactEmail.trim().toLowerCase() }]
        : profile.contact.emails;
      await apiJson('/api/auth/me/contact', {
        method: 'PUT',
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          emails,
          avatar: profile.contact.avatar ?? undefined,
        }),
      });
      await queryClient.invalidateQueries({ queryKey: TENANT_PROFILE_KEY });
      await refetch();
      await checkUserAuth();
      notify.success(t('account.contactSaved'));
    } catch (error: unknown) {
      const validationMessage = getApiValidationMessage(error);
      const message =
        validationMessage ||
        (error instanceof ApiError ? error.message : t('errors.boundary.description'));
      notify.error(validationMessage ? t('account.contactUniqueConflict') : message, {
        description: validationMessage || undefined,
      });
    } finally {
      setSavingContact(false);
    }
  };

  const handleAvatarCrop = async (url: string) => {
    if (!profile?.contact) return;
    setSavingContact(true);
    try {
      const emails = contactEmail.trim()
        ? [{ label: 'Primary', address: contactEmail.trim().toLowerCase() }]
        : profile.contact.emails;
      await apiJson('/api/auth/me/contact', {
        method: 'PUT',
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          emails,
          avatar: url,
        }),
      });
      await queryClient.invalidateQueries({ queryKey: TENANT_PROFILE_KEY });
      await refetch();
      await checkUserAuth();
      notify.success(t('account.contactSaved'));
    } catch (error: unknown) {
      const validationMessage = getApiValidationMessage(error);
      const message =
        validationMessage ||
        (error instanceof ApiError ? error.message : t('errors.boundary.description'));
      notify.error(validationMessage ? t('account.contactUniqueConflict') : message, {
        description: validationMessage || undefined,
      });
    } finally {
      setSavingContact(false);
    }
  };

  return {
    name,
    phone,
    contactEmail,
    savingContact,
    setName,
    setPhone,
    setContactEmail,
    handleSaveContact,
    handleAvatarCrop,
  };
}
