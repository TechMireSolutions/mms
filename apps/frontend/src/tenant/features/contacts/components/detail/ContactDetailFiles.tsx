import { ChangeEvent, RefObject } from "react";
import { ExternalLink, FileText, Loader2, Trash2 } from "lucide-react";
import { Contact, formatDate } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface ContactDetailFilesProps {
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
      {canPersistContact && <div
        onDragOver={(e) => {
          e.preventDefault();
          onDraggingChange(true);
        }}
        onDragLeave={() => onDraggingChange(false)}
        onDrop={(e) => {
          e.preventDefault();
          onDraggingChange(false);
          onFiles(e.dataTransfer.files);
        }}
        className={`p-8 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center gap-3 transition-all ${
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border bg-muted/20"
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          {isUploading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <FileText className="w-6 h-6" />
          )}
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground">
            {isUploading ? t('contacts.detail.uploading') : t('contacts.detail.cloudStorageRepository')}
          </h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-[11.25rem]">
            {t('contacts.detail.dragDropDocuments')}
          </p>
        </div>
        <input
          id="contact-drawer-document-upload-input"
          name="contactDocumentUpload"
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          multiple
          className="hidden"
          aria-label={t('contacts.detail.cloudStorageRepository')}
        />
        <Button
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 px-6 min-h-11 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-none"
          type="button"
        >
          {t('contacts.detail.browseFiles')}
        </Button>
      </div>}

      <div className="space-y-3">
        {(!contact.attachments || contact.attachments.length === 0) ? (
          <div className="py-10 text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{t('contacts.detail.repositoryEmpty')}</p>
          </div>
        ) : (
          contact.attachments.map((file) => (
            <Card key={file.id} className="flex items-center justify-between p-4 hover:border-primary/20 transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-foreground truncate">{file.name}</h5>
                  <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} {t('contacts.detail.kbLabel')} · {formatDate(file.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={file.url}
                  download={file.name}
                  aria-label={t('contacts.detail.downloadFile', { name: file.name })}
                  className="min-w-11 min-h-11 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                {canPersistContact && (
                  <Button
                    variant="ghost"
                    aria-label={t('contacts.detail.deleteFile', { name: file.name })}
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
