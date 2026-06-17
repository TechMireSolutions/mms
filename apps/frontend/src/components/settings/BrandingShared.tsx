import React, { useState, useRef, useCallback } from 'react';
import { ImageIcon, X, Loader2, Plus, Trash2 } from 'lucide-react';
import {
  BRANDING_FOOTER_MAX,
  BRANDING_NAME_MAX,
  BRANDING_SOCIAL_PLATFORM_DEFS,
  BRANDING_SOCIAL_PLACEHOLDERS,
  DEFAULT_BRANDING_SETTINGS,
  formatBrandingFooterDefault,
  IMAGE_UPLOAD_MAX_INPUT_BYTES,
  IMAGE_UPLOAD_PRESETS,
  mergeBrandingSettings,
  type AppTranslationKey,
  type BrandingSettings,
  type BrandingSocialLink,
  type ImageUploadPurpose,
  type LogoBrandColors,
} from '@mms/shared';
import { getBrandingSettings, saveBrandingSettings } from '@/lib/db';
import { getScopedBrandingSettings } from '@/lib/settingsPreviewStore';
import useTranslation from '@/hooks/useTranslation';
import { extractLogoBrandColors } from '@/lib/extractLogoBrandColors';
import { uploadUserImage } from '@/lib/imageUpload';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import FormSelect from '@/components/ui/FormSelect';

export const MAX_FILE_BYTES = IMAGE_UPLOAD_MAX_INPUT_BYTES;
export const NAME_MAX = BRANDING_NAME_MAX;
export const TAGLINE_MAX = 80;
export const FOOTER_MAX = BRANDING_FOOTER_MAX;

/** @deprecated Use IMAGE_UPLOAD_PRESETS.logo */
export const LOGO_OPTIMIZE_OPTIONS = IMAGE_UPLOAD_PRESETS.logo;
/** @deprecated Use IMAGE_UPLOAD_PRESETS.favicon */
export const FAVICON_OPTIMIZE_OPTIONS = IMAGE_UPLOAD_PRESETS.favicon;

export function loadBranding(): BrandingSettings {
  try {
    const rawLegacy = localStorage.getItem('madrasa_branding');
    if (rawLegacy) {
      const migrated = mergeBrandingSettings(JSON.parse(rawLegacy) as Partial<BrandingSettings>);
      void saveBrandingSettings(migrated);
      localStorage.removeItem('madrasa_branding');
      return migrated;
    }
  } catch (error) {
    console.error('Failed to migrate legacy madrasa_branding key:', error);
  }

  return getScopedBrandingSettings();
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') resolve(ev.target.result);
      else reject(new Error('Failed to read image'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image'));
    reader.readAsDataURL(blob);
  });
}

interface FieldHintProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function FieldHint({ id, children, className }: FieldHintProps): React.JSX.Element {
  return (
    <p id={id} className={cn('text-xs text-muted-foreground', className)}>
      {children}
    </p>
  );
}

interface ImageUploadFieldProps {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (url: string) => void;
  onClear: () => void;
  /** When set, dominant logo colours are extracted after a successful upload. */
  onBrandColorsExtracted?: (colors: LogoBrandColors) => void;
  purpose?: ImageUploadPurpose;
  previewSize?: 'logo' | 'favicon';
}

export function ImageUploadField({
  id,
  label,
  hint,
  value,
  onChange,
  onClear,
  onBrandColorsExtracted,
  purpose,
  previewSize = 'logo',
}: ImageUploadFieldProps): React.JSX.Element {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const resolvedPurpose: ImageUploadPurpose =
    purpose ?? (previewSize === 'favicon' ? 'favicon' : 'logo');

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError(t('branding.imageErrorType'));
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(t('branding.imageErrorSize'));
      return;
    }

    setError(null);
    setUploading(true);
    try {
      if (onBrandColorsExtracted) {
        const sourceDataUrl = await readBlobAsDataUrl(file);
        const colors = await extractLogoBrandColors(sourceDataUrl);
        if (colors) onBrandColorsExtracted(colors);
      }

      const url = await uploadUserImage(file, resolvedPurpose);
      onChange(url);
    } catch {
      setError(t('branding.imageErrorUpload'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [onBrandColorsExtracted, onChange, resolvedPurpose, t]);

  const previewClass =
    previewSize === 'favicon' ? 'h-14 w-14 rounded-lg' : 'h-20 w-20 rounded-xl';

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div
        role="button"
        tabIndex={0}
        aria-labelledby={id}
        aria-describedby={error ? `${hintId} ${errorId}` : hintId}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) void processFile(file);
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          'flex items-center gap-4 rounded-xl border border-dashed p-4 transition-colors cursor-pointer',
          dragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/30',
          uploading && 'pointer-events-none opacity-70',
        )}
      >
        <div
          className={cn(
            'relative flex shrink-0 items-center justify-center overflow-hidden border border-border bg-background',
            previewClass,
          )}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden />
          ) : value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-5 w-5 text-muted-foreground" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {value ? t('branding.imageReplace') : t('branding.imageDropBrowse')}
          </p>
          <FieldHint id={hintId}>{hint}</FieldHint>
        </div>

        {value && !uploading && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label={t('branding.imageRemoveAria', { label })}
            onClick={(e) => {
              e.stopPropagation();
              onClear();
              setError(null);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void processFile(file);
          }}
          disabled={uploading}
        />
      </div>
      {error && (
        <p id={errorId} className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface SocialLinksEditorProps {
  links: BrandingSocialLink[];
  onChange: (links: BrandingSocialLink[]) => void;
}

export function SocialLinksEditor({ links, onChange }: SocialLinksEditorProps): React.JSX.Element {
  const { t } = useTranslation();

  const addLink = (): void => {
    onChange([...links, { platform: BRANDING_SOCIAL_PLATFORM_DEFS[0].id, url: '' }]);
  };

  const updateLink = (index: number, patch: Partial<BrandingSocialLink>): void => {
    onChange(links.map((link, i) => (i === index ? { ...link, ...patch } : link)));
  };

  const removeLink = (index: number): void => {
    onChange(links.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {links.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('branding.socialEmpty')}</p>
      ) : (
        <div className="space-y-3">
          {links.map((link, index) => (
            <div
              key={`${link.platform}-${index}`}
              className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-[minmax(0,160px)_1fr_auto]"
            >
              <div className="space-y-1.5">
                <Label htmlFor={`social-platform-${index}`}>{t('branding.socialPlatform')}</Label>
                <FormSelect
                  id={`social-platform-${index}`}
                  value={link.platform}
                  onChange={(platform) => updateLink(index, { platform })}
                  options={BRANDING_SOCIAL_PLATFORM_DEFS.map((def) => ({
                    value: def.id,
                    label: t(def.labelKey as AppTranslationKey),
                  }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`social-url-${index}`}>{t('branding.socialUrl')}</Label>
                <Input
                  id={`social-url-${index}`}
                  type="text"
                  inputMode={link.platform === 'WhatsApp' ? 'tel' : 'url'}
                  value={link.url}
                  placeholder={BRANDING_SOCIAL_PLACEHOLDERS[link.platform] ?? 'https://'}
                  onChange={(e) => updateLink(index, { url: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t('branding.socialRemoveAria')}
                  onClick={() => removeLink(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Button type="button" variant="outline" size="sm" onClick={addLink}>
        <Plus className="h-4 w-4" />
        {t('branding.socialAdd')}
      </Button>
    </div>
  );
}

export { SettingsStatusBadges } from '@/components/settings/SettingsShared';

export function defaultFooterForMadrasa(madrasaName: string, language = 'en'): string {
  return formatBrandingFooterDefault(madrasaName, language);
}
