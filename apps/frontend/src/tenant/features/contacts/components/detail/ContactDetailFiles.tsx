import type { ChangeEvent, RefObject } from "react";
import { ExternalLink, FileText, Trash2 } from "lucide-react";
import { formatDate, type Contact } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashedFileDropZone } from "@/components/ui/DashedFileDropZone";
import { DetailCollectionEmpty } from "./contactDetailChannelHelpers";

interface ContactDetailFilesProps {
  contact: Contact;
  canPersistContact: boolean;
  isDragging: boolean;
  isUploading: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onDraggingChange: (dragging: boolean) => void;
  onFiles: (filesList: FileList | null) => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onRequestDelete: (attachment: { id: string; name: string }) => void;
}

export function ContactDetailFiles({
  contact,
  canPersistContact,
  isDragging,
  isUploading,
  fileInputRef,
  onDraggingChange,
  onFiles,
  onFileChange,
  onRequestDelete,
}: ContactDetailFilesProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {canPersistContact && (
        <DashedFileDropZone
          isDragging={isDragging}
          onDraggingChange={onDraggingChange}
          onFiles={onFiles}
          onFileChange={onFileChange}
          fileInputRef={fileInputRef}
          isUploading={isUploading}
          multiple
          title={
            isUploading
              ? t("contacts.detail.uploading")
              : t("contacts.detail.cloudStorageRepository")
          }
          description={t("contacts.detail.dragDropDocuments")}
          inputAriaLabel={t("contacts.detail.cloudStorageRepository")}
          inputId="contact-drawer-document-upload-input"
          inputName="contactDocumentUpload"
          browseLabel={t("contacts.detail.browseFiles")}
        />
      )}

      <div className="space-y-3">
        {!contact.attachments || contact.attachments.length === 0 ? (
          <DetailCollectionEmpty title={t("contacts.detail.repositoryEmpty")} />
        ) : (
          contact.attachments.map((file) => (
            <Card key={file.id} className="flex items-center justify-between p-4 hover:border-primary/20 transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-foreground truncate">{file.name}</h5>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(file.size / 1024).toFixed(1)} {t("contacts.detail.kbLabel")} · {formatDate(file.date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={file.url}
                  download={file.name}
                  aria-label={t("contacts.detail.downloadFile", { name: file.name })}
                  className="min-w-11 min-h-11 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                {canPersistContact && (
                  <Button
                    variant="ghost"
                    aria-label={t("contacts.detail.deleteFile", { name: file.name })}
                    onClick={() => onRequestDelete({ id: file.id, name: file.name })}
                    className="min-w-11 min-h-11 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shadow-none"
                    type="button"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
