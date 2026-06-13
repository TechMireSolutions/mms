import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  isBrandingFieldsDirty,
  mergeBrandingSettings,
  pickBrandingFields,
  type BrandingSettings,
} from '@mms/shared';
import { getBrandingSettings, saveBrandingSettings } from '@/lib/db';
import { clearBrandingSettingsPreview, previewBrandingSettings } from '@/lib/settingsPreview';
import { loadBranding } from '@/components/settings/BrandingShared';
import { serverSyncErrorKey } from '@/lib/serverSyncErrors';
import { notify } from '@/lib/notify';
import useTranslation from '@/hooks/useTranslation';

export interface UseBrandingDraftOptions {
  saveSuccessMessage: string;
  saveSuccessDescription: string;
  /** Subset used for dirty flag and live preview (defaults to full record). */
  trackKeys?: readonly (keyof BrandingSettings)[];
}

export interface UseBrandingDraftResult {
  data: BrandingSettings;
  isDirty: boolean;
  saved: boolean;
  saving: boolean;
  upd: <K extends keyof BrandingSettings>(field: K, value: BrandingSettings[K]) => void;
  handleSave: () => Promise<boolean>;
  applyPersisted: (next: BrandingSettings) => void;
}

function loadPersistedBranding(): BrandingSettings {
  return mergeBrandingSettings(getBrandingSettings());
}

function loadDraftBranding(): BrandingSettings {
  return loadBranding();
}

/**
 * Shared draft state for `/settings/branding` and `/settings/theme` (same DB record).
 * Dirty compares draft to persisted storage; preview overlay keeps unsaved edits across tab switches.
 */
export function useBrandingDraft({
  saveSuccessMessage,
  saveSuccessDescription,
  trackKeys,
}: UseBrandingDraftOptions): UseBrandingDraftResult {
  const { t } = useTranslation();
  const [baseline, setBaseline] = useState<BrandingSettings>(loadPersistedBranding);
  const [data, setData] = useState<BrandingSettings>(loadDraftBranding);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const isDirty = useMemo(() => {
    if (!trackKeys) {
      return JSON.stringify(data) !== JSON.stringify(baseline);
    }
    return isBrandingFieldsDirty(data, baseline, trackKeys);
  }, [baseline, data, trackKeys]);

  useEffect(() => {
    const sync = (): void => {
      if (isDirty) return;
      const next = loadPersistedBranding();
      setBaseline(next);
      setData(next);
      setSaved(false);
    };
    window.addEventListener('local-database-update', sync);
    return () => window.removeEventListener('local-database-update', sync);
  }, [isDirty]);

  useEffect(() => {
    const merged = mergeBrandingSettings(data);
    const patch = trackKeys ? pickBrandingFields(merged, trackKeys) : merged;
    previewBrandingSettings(patch);
  }, [data, trackKeys]);

  const applyPersisted = useCallback((next: BrandingSettings): void => {
    const merged = mergeBrandingSettings(next);
    setBaseline(merged);
    setData(merged);
    clearBrandingSettingsPreview();
    setSaved(false);
  }, []);

  const upd = useCallback(<K extends keyof BrandingSettings>(field: K, value: BrandingSettings[K]): void => {
    setData((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }, []);

  const handleSave = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    try {
      const merged = mergeBrandingSettings(data);
      const result = await saveBrandingSettings(merged);
      if (!result.ok) {
        notify.error(t('settings.serverSaveFailed'), {
          description: t(serverSyncErrorKey(result.status)),
        });
        return false;
      }
      setBaseline(merged);
      setData(merged);
      clearBrandingSettingsPreview();
      setSaved(true);
      notify.success(saveSuccessMessage, { description: saveSuccessDescription });
      setTimeout(() => setSaved(false), 2500);
      return true;
    } finally {
      setSaving(false);
    }
  }, [data, saveSuccessDescription, saveSuccessMessage, t]);

  return { data, isDirty, saved, saving, upd, handleSave, applyPersisted };
}
