import { ChangeEvent, FormEvent } from "react";
import { motion } from "framer-motion";
import { History, Send } from "lucide-react";
import { ContactActivity, formatDate } from "@mms/shared";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { ACTIVITY_TYPE_I18N } from "@/lib/contacts/contactI18n";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ICON_MAP } from "./contactDetailStyles";

export interface ContactDetailTimelineProps {
  activities: ContactActivity[];
  noteText: string;
  noteInputId: string;
  canPersistContact: boolean;
  onNoteTextChange: (value: string) => void;
  onAddNote: (event: FormEvent) => Promise<void>;
}

export function ContactDetailTimeline({
  activities,
  noteText,
  noteInputId,
  canPersistContact,
  onNoteTextChange,
  onAddNote,
}: ContactDetailTimelineProps): JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  return (
    <div className="space-y-5">
      {canPersistContact && <div className="relative">
        <form onSubmit={onAddNote} className="flex gap-2">
          <label htmlFor={noteInputId} className="sr-only">
            {t('contacts.detail.logEventOrNote')}
          </label>
          <Input
            id={noteInputId}
            name="contact-note"
            type="text"
            placeholder={t('contacts.detail.logEventOrNote')}
            value={noteText}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onNoteTextChange(e.target.value)}
            className="flex-1 px-4 py-3 rounded-2xl"
          />
          <Button
            type="submit"
            aria-label={t('contacts.detail.logEventOrNoteSubmit')}
            className={`w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-none ${
              reducedMotion ? "" : "hover:scale-105 active:scale-95 transition-all"
            }`}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>}

      <div className="space-y-6 relative ps-3">
        <div className="absolute start-[3px] top-0 bottom-0 w-0.5 bg-border/50" />
        {(!activities || activities.length === 0) ? (
          <EmptyState
            title={t('contacts.detail.quietTimeline')}
            icon={History}
            className="opacity-30 uppercase tracking-widest"
          />
        ) : (
          activities.map((act, idx) => {
            const Icon = ICON_MAP[act.type] || History;
            return (
              <motion.div
                key={act.id}
                initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.15, delay: reducedMotion ? 0 : Math.min(idx * 0.03, 0.3) }}
                className="relative ps-6 group"
              >
                <div
                  className="absolute start-0 top-1.5 w-6 h-6 rounded-full bg-card border-2 border-border flex items-center justify-center z-10 group-hover:border-primary transition-colors"
                  style={{ insetInlineStart: '-15.5px' }}
                >
                  <Icon className="w-2.5 h-2.5 text-muted-foreground group-hover:text-primary" />
                </div>
                <Card className="p-4 shadow-xs hover:border-primary/20 group-hover:border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                      {ACTIVITY_TYPE_I18N[act.type] ? t(ACTIVITY_TYPE_I18N[act.type]) : act.type}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground/60">{formatDate(act.date)}</span>
                  </div>
                  <p className="text-xs text-foreground font-medium leading-relaxed">{act.content}</p>
                  {act.by && <span className="block mt-2 text-xs font-bold text-primary italic">— {act.by}</span>}
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
