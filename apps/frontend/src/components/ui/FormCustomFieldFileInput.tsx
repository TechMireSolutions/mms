import React, { useState } from "react";
import { Camera, FileText, Upload, X } from "lucide-react";
import { AvatarCropper } from "@/components/ui/AvatarCropper";
import { Button } from "@/components/ui/button";
import { uploadUserImage } from "@/lib/imageUpload";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import type { FieldDefinition } from "@mms/shared";

interface FormCustomFieldFileInputProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (fieldValue: unknown) => void;
  uploadInstructions: string;
  clickToUploadDocumentLabel: string;
  removePhotoLabel: string;
}

export const FormCustomFieldFileInput = React.memo(function FormCustomFieldFileInput({
      field,
      value,
      onChange,
      uploadInstructions,
      clickToUploadDocumentLabel,
      removePhotoLabel,
    }: FormCustomFieldFileInputProps): React.JSX.Element {
      const { t } = useTranslation();
      const [cropSrc, setCropSrc] = useState<string | null>(null);
      const isAvatar =
        field.key === "avatar" ||
        field.label.toLowerCase().includes("photo") ||
        field.label.toLowerCase().includes("avatar") ||
        field.label.toLowerCase().includes("image");
      const fileUrl = typeof value === "string" ? value : (value as { url?: string })?.url || null;
      const file =
        typeof value === "string"
          ? { name: "avatar.webp", url: value }
          : (value as { name: string; url: string; size?: number } | null);

      const handleFile = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        const selected = event.target.files?.[0];
        if (!selected) return;

        if (isAvatar && selected.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (readerEvent) => {
            if (typeof readerEvent.target?.result === "string") {
              setCropSrc(readerEvent.target.result);
            }
          };
          reader.readAsDataURL(selected);
          event.target.value = "";
          return;
        }

        if (selected.type.startsWith("image/")) {
          try {
            const url = await uploadUserImage(selected, "general");
            onChange({
              name: selected.name.replace(/\.[^/.]+$/, "") + ".avif",
              url,
              size: selected.size,
              type: "image/avif",
            });
          } catch {
            notify.error(t("account.photoUploadFailed"));
          }
          event.target.value = "";
          return;
        }

        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          onChange({
            name: selected.name,
            url: readerEvent.target?.result,
            size: selected.size,
            type: selected.type,
          });
        };
        reader.readAsDataURL(selected);
        event.target.value = "";
      };

      if (isAvatar) {
        const initials = "C";
        return (
          <div className="flex items-center gap-4">
            {cropSrc && (
              <AvatarCropper
                src={cropSrc}
                onCrop={(url: string) => {
                  onChange(url);
                  setCropSrc(null);
                }}
                onCancel={() => setCropSrc(null)}
              />
            )}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center border-2 border-border">
                {fileUrl ? (
                  <img src={fileUrl} alt={field.label} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-primary">{initials}</span>
                )}
              </div>
              <label className="absolute -bottom-1 -end-1 min-h-11 min-w-11 w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-md hover:bg-primary/90 transition-colors z-10">
                <Camera className="w-3 h-3" />
                <input
                  id={`${field.key}-avatar-upload`}
                  name={`${field.key}-avatar-upload`}
                  type="file"
                  accept="image/*"
                  aria-label={field.label}
                  className="hidden"
                  onChange={(event) => {
                    void handleFile(event);
                  }}
                />
              </label>
            </div>
            <div className="text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-0.5">{field.label}</p>
              <p>{uploadInstructions}</p>
              <p className="text-xs opacity-80 mt-0.5">{t("contacts.form.avatarRecommendedSize")}</p>
              {fileUrl && (
                <Button
                  type="button"
                  variant="link"
                  onClick={() => onChange(null)}
                  className="text-destructive hover:text-destructive/90 mt-1 font-medium min-h-11 h-auto p-0"
                >
                  {removePhotoLabel}
                </Button>
              )}
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-2">
          {file ? (
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted border border-border">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-xs font-semibold truncate">{file.name}</span>
              </div>
              <Button
                variant="ghost"
                onClick={() => onChange(null)}
                className="min-w-11 min-h-11 p-0 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                type="button"
                aria-label={`${t("common.delete")} ${file.name}`}
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border rounded-xl hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all">
              <Upload className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-bold text-muted-foreground">{clickToUploadDocumentLabel}</span>
              <input
                id={`${field.key}-document-upload`}
                name={`${field.key}-document-upload`}
                type="file"
                aria-label={clickToUploadDocumentLabel}
                className="hidden"
                onChange={(event) => {
                  void handleFile(event);
                }}
              />
            </label>
          )}
        </div>
      );
    });
