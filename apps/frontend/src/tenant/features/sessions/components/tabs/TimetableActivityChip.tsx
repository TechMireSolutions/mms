import React from "react";
import { motion } from "framer-motion";
import { Clock, MapPin, Trash2 } from "lucide-react";
import type { TimetableItem } from '@/lib/data/sessionsData';
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { TIMETABLE_TYPE_CONFIG } from "@/tenant/features/sessions/components/tabs/timetableTabConfig";

interface TimetableActivityChipProps {
  entry: TimetableItem;
  onDelete: (id: string) => void;
  canWrite: boolean;
}

export function TimetableActivityChip({ entry, onDelete, canWrite }: TimetableActivityChipProps): React.JSX.Element {
  const { t } = useTranslation();
  const typeConfig = TIMETABLE_TYPE_CONFIG[entry.type] || TIMETABLE_TYPE_CONFIG.class;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs ${typeConfig.color}`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${typeConfig.dot} mt-1 flex-shrink-0`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <h5 className="font-semibold text-sm truncate m-0">{entry.activity}</h5>
        <div className="flex items-center gap-2 mt-0.5 opacity-80">
          <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" aria-hidden="true" />{entry.startTime}–{entry.endTime}</span>
          {entry.location && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" aria-hidden="true" />{entry.location}</span>}
        </div>
      </div>
      {canWrite && <Button
        variant="ghost"
        size="icon"
        aria-label={t("sessions.timetable.deleteNamed", { name: entry.activity })}
        onClick={() => onDelete(entry.id)}
        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity text-current hover:text-destructive ms-1 flex-shrink-0"
      >
        <Trash2 className="w-3 h-3" aria-hidden="true" />
      </Button>}
    </motion.article>
  );
}
