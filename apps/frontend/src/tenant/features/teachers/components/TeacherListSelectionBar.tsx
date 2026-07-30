import type { ReactElement } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Mail, MessageCircle, MessageSquare, RotateCcw, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge, type StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import { useTranslation } from '@/hooks/useTranslation';
import type { Teacher } from '@/lib/data/teachersData';

interface TeacherListSelectionBarProps {
  selectedIds: string[];
  selectedTeachers: Teacher[];
  showDeleted: boolean;
  canWrite: boolean;
  canDelete: boolean;
  statusConfig: Record<string, StatusBadgeConfigItem>;
  onSms?: (teachers: Teacher[]) => void;
  onWhatsApp?: (teachers: Teacher[]) => void;
  onEmail?: (teachers: Teacher[]) => void;
  onBulkStatusChange?: (ids: string[], status: string) => void;
  onRequestBulkDelete: () => void;
  onRequestBulkRestore: () => void;
  onClearSelection: () => void;
}

export function TeacherListSelectionBar({
  selectedIds,
  selectedTeachers,
  showDeleted,
  canWrite,
  canDelete,
  statusConfig,
  onSms,
  onWhatsApp,
  onEmail,
  onBulkStatusChange,
  onRequestBulkDelete,
  onRequestBulkRestore,
  onClearSelection,
}: TeacherListSelectionBarProps): ReactElement {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-x-4 bottom-4 z-40 max-w-full sm:inset-x-auto sm:end-6 sm:bottom-6 bg-card/95 border border-primary/20 backdrop-blur-xl shadow-2xl rounded-2xl p-3 flex flex-wrap items-center gap-3 border-s-4 border-s-primary"
        >
          <span className="text-xs font-bold text-foreground ps-1">
            {t('teachers.selectedCount', { count: selectedIds.length })}
          </span>
          <div className="h-4 w-px bg-border" />
          {showDeleted ? (
            canDelete && (
              <Button
                type="button"
                variant="outline"
                onClick={onRequestBulkRestore}
                className="px-3 py-1.5 rounded-lg border-primary/40 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors min-h-11 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> {t('teachers.bulkRestore')}
              </Button>
            )
          ) : (
            <>
              {onWhatsApp && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onWhatsApp(selectedTeachers)}
                  className="px-3 py-1.5 rounded-lg border-border text-xs font-semibold hover:bg-muted text-foreground transition-colors min-h-11 flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-success" /> {t('teachers.list.actionWhatsApp')}
                </Button>
              )}
              {onSms && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onSms(selectedTeachers)}
                  className="px-3 py-1.5 rounded-lg border-border text-xs font-semibold hover:bg-muted text-foreground transition-colors min-h-11 flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-info" /> {t('teachers.list.actionSms')}
                </Button>
              )}
              {onEmail && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onEmail(selectedTeachers)}
                  className="px-3 py-1.5 rounded-lg border-border text-xs font-semibold hover:bg-muted text-foreground transition-colors min-h-11 flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-primary" /> {t('teachers.list.actionEmail')}
                </Button>
              )}
              {canWrite && onBulkStatusChange && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="px-3 py-1.5 rounded-lg border-border text-xs font-semibold hover:bg-muted text-foreground transition-colors min-h-11 flex items-center gap-1.5"
                    >
                      <Tag className="w-3.5 h-3.5 text-primary" /> {t('teachers.bulkStatus')} <ChevronDown className="w-3 h-3 ms-0.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {Object.keys(statusConfig).map((statusVal) => (
                      <DropdownMenuItem
                        key={statusVal}
                        onClick={() => {
                          onBulkStatusChange(selectedIds, statusVal);
                          onClearSelection();
                        }}
                      >
                        <StatusBadge status={statusVal} config={statusConfig} />
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {canDelete && (
                <>
                  <div className="h-4 w-px bg-border" />
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={onRequestBulkDelete}
                    className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-colors min-h-11"
                  >
                    {t('common.delete')}
                  </Button>
                </>
              )}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
