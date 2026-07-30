import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { calculateProfileCompleteness } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useTenantProfile } from '@/tenant/hooks/useTenantProfile';
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import { genderAvatarGradient } from '@/lib/semanticTone';
import { getPasswordStrength } from '@/tenant/features/profile/passwordStrength';
import { useAccountProfileContactActions } from '@/tenant/features/profile/hooks/useAccountProfileContactActions';
import { useAccountProfileSecurityActions } from '@/tenant/features/profile/hooks/useAccountProfileSecurityActions';

export function useAccountProfilePageController() {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useTenantProfile();
  const { fieldConfig } = useContactConfig();
  const contact = useAccountProfileContactActions();
  const security = useAccountProfileSecurityActions();

  const [showCropper, setShowCropper] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loginVerified = useMemo(
    () => Boolean(profile?.emailVerifiedAt),
    [profile?.emailVerifiedAt],
  );

  const completeness = useMemo(() => {
    if (!profile?.contact || !fieldConfig) return 0;
    return calculateProfileCompleteness(profile.contact, fieldConfig);
  }, [profile?.contact, fieldConfig]);

  const avatarGradient = useMemo(() => {
    return genderAvatarGradient(profile?.contact?.gender ?? '');
  }, [profile?.contact?.gender]);

  const passwordStrength = useMemo(() => {
    return getPasswordStrength(security.newPassword);
  }, [security.newPassword]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setShowCropper(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarCrop = async (url: string) => {
    await contact.handleAvatarCrop(url);
    setShowCropper(null);
  };

  return {
    t,
    profile,
    isLoading,
    ...contact,
    ...security,
    showCropper,
    setShowCropper,
    fileInputRef,
    loginVerified,
    completeness,
    avatarGradient,
    passwordStrength,
    handleFileChange,
    handleAvatarCrop,
  };
}
