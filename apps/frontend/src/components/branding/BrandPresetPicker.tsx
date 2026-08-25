import React, { useState } from "react";
import { AlertTriangle, Check, Plus, Trash2 } from "lucide-react";
import { BRANDING_THEME_PRESETS, meetsWcagAaUiContrast, type BrandingThemeMode } from "@mms/shared";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";

import {
  loadCustomPresets,
  presetPrimaryContrast,
  saveCustomPresets,
  type CustomThemePreset,
} from "./brandColorPanelShared";

interface BrandPresetPickerProps {
  primaryColor: string;
  secondaryColor: string;
  previewMode: BrandingThemeMode;
  onApplyPreset: (primary: string, secondary: string) => void;
}

export function BrandPresetPicker({
  primaryColor,
  secondaryColor,
  previewMode,
  onApplyPreset,
}: BrandPresetPickerProps) {
  const { t } = useTranslation();
  const [customPresets, setCustomPresets] = useState<CustomThemePreset[]>(loadCustomPresets);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [presetNameDraft, setPresetNameDraft] = useState("");

  const handleOpenSaveDialog = (): void => {
    setPresetNameDraft(`${t("theme.customPresetDefaultName")} ${customPresets.length + 1}`);
    setIsSavingPreset(true);
  };

  const handleConfirmSavePreset = (): void => {
    if (!presetNameDraft.trim()) return;

    const newPreset: CustomThemePreset = {
      id: `custom-${Date.now()}`,
      name: presetNameDraft.trim(),
      primaryColor,
      secondaryColor,
    };
    const updated = [...customPresets.slice(-3), newPreset];
    setCustomPresets(updated);
    saveCustomPresets(updated);
    setIsSavingPreset(false);
    notify.success(t("theme.customPresetSaved"));
  };

  const handleDeleteCustom = (id: string, e: React.MouseEvent): void => {
    e.stopPropagation();
    const updated = customPresets.filter((p) => p.id !== id);
    setCustomPresets(updated);
    saveCustomPresets(updated);
    notify.success(t("theme.customPresetDeleted"));
  };

  return (
    <div className="space-y-3">
      {/* Save Custom Preset Modal */}
      <Modal
        open={isSavingPreset}
        onClose={() => setIsSavingPreset(false)}
        title={t("theme.saveCustomPresetTitle")}
        subtitle={t("theme.saveCustomPresetDesc")}
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsSavingPreset(false)}
              className="min-h-10 px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={!presetNameDraft.trim()}
              onClick={handleConfirmSavePreset}
              className="min-h-10 px-4 text-xs font-semibold"
            >
              {t("common.save")}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-1">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border/80 bg-muted/30">
            <div className="flex items-center -space-x-2 rtl:space-x-reverse">
              <span
                className="h-8 w-8 rounded-full border-2 border-background shadow-xs shrink-0"
                style={{ backgroundColor: primaryColor }}
                aria-label={primaryColor}
              />
              <span
                className="h-8 w-8 rounded-full border-2 border-background shadow-xs shrink-0"
                style={{ backgroundColor: secondaryColor }}
                aria-label={secondaryColor}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">
                {primaryColor} & {secondaryColor}
              </p>
              <p className="text-2xs text-muted-foreground font-mono truncate">
                {t("theme.activeConfig")}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preset-name-input">{t("theme.presetNameLabel")}</Label>
            <Input
              id="preset-name-input"
              value={presetNameDraft}
              onChange={(e) => setPresetNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleConfirmSavePreset();
                }
              }}
              placeholder={t("theme.presetNamePlaceholder")}
              autoFocus
              className="min-h-11 h-11 text-xs"
            />
          </div>
        </div>
      </Modal>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Label>{t("theme.palettesTitle")}</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("theme.palettesDesc")}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpenSaveDialog}
          className="min-h-11 px-3 text-xs"
        >
          <Plus className="h-3.5 w-3.5 me-1" />
          {t("theme.saveCustomPreset")}
        </Button>
      </div>

      {customPresets.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">{t("theme.customPresetsTitle")}</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {customPresets.map((preset) => {
              const active = primaryColor === preset.primaryColor && secondaryColor === preset.secondaryColor;
              return (
                <div
                  key={preset.id}
                  onClick={() => onApplyPreset(preset.primaryColor, preset.secondaryColor)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onApplyPreset(preset.primaryColor, preset.secondaryColor);
                    }
                  }}
                  className={cn(
                    "group relative flex min-h-11 items-center justify-between gap-2 rounded-xl border p-2.5 text-start transition-all cursor-pointer hover:border-primary/40",
                    active ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-muted/20 hover:bg-muted/30",
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="relative h-8 w-8 shrink-0 rounded-full border border-white/20 shadow-xs" style={{ backgroundColor: preset.primaryColor }}>
                      <span className="absolute -bottom-0.5 -end-0.5 h-3.5 w-3.5 rounded-full border-2 border-background" style={{ backgroundColor: preset.secondaryColor }} aria-hidden />
                      {active && <Check className="absolute inset-0 m-auto h-4 w-4 text-background drop-shadow-sm" aria-hidden />}
                    </span>
                    <span className="min-w-0 truncate">
                      <span className="block truncate text-xs font-semibold text-foreground">{preset.name}</span>
                      <span className="block truncate font-mono text-2xs text-muted-foreground">{preset.primaryColor}</span>
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={t("theme.deleteCustomPreset")}
                    onClick={(e) => handleDeleteCustom(preset.id, e)}
                    className="min-h-11 min-w-11 p-0 text-muted-foreground opacity-70 group-hover:opacity-100 hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {BRANDING_THEME_PRESETS.map((preset) => {
          const active = primaryColor === preset.primaryColor && secondaryColor === preset.secondaryColor;
          const presetContrast = presetPrimaryContrast(preset.primaryColor, preset.secondaryColor, previewMode);
          const lowContrast = presetContrast !== null && !meetsWcagAaUiContrast(presetContrast);
          return (
            <Button
              key={preset.id}
              type="button"
              variant="ghost"
              onClick={() => onApplyPreset(preset.primaryColor, preset.secondaryColor)}
              className={cn(
                "h-auto min-h-11 flex items-center justify-start gap-2.5 rounded-xl border p-2.5 text-start transition-all hover:border-primary/40",
                active ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-muted/20 hover:bg-muted/30",
              )}
            >
              <span className="relative h-9 w-9 shrink-0 rounded-full border border-white/20 shadow-xs" style={{ backgroundColor: preset.primaryColor }}>
                <span className="absolute -bottom-0.5 -end-0.5 h-3.5 w-3.5 rounded-full border-2 border-background" style={{ backgroundColor: preset.secondaryColor }} aria-hidden />
                {active ? <Check className="absolute inset-0 m-auto h-4 w-4 text-background drop-shadow-sm" aria-hidden /> : null}
                {lowContrast ? <AlertTriangle className="absolute -start-1 -top-1 h-3.5 w-3.5 text-warning drop-shadow-sm dark:text-warning" aria-label={t("theme.presetContrastLow")} /> : null}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-foreground">{t(preset.labelKey)}</span>
                <span className="block truncate font-mono text-2xs text-muted-foreground">{preset.primaryColor}</span>
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
