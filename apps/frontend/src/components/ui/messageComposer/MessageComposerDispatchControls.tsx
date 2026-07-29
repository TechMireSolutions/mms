import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Clock, Pause, Play, XCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SegmentedPillFilter } from '@/components/ui/SegmentedPillFilter';
import { useTranslation } from '@/hooks/useTranslation';
import type { DispatchSpeed } from './useMessageComposerDispatch';

interface MessageComposerDispatchControlsProps {
  skippedCount: number;
  isEmail: boolean;
  isBulk: boolean;
  opening: boolean;
  dispatchSpeed: DispatchSpeed;
  dispatchProgress: { current: number; total: number } | null;
  isPaused: boolean;
  onShowSkipped: () => void;
  onDispatchSpeedChange: (speed: DispatchSpeed) => void;
  onPausedChange: (paused: boolean) => void;
  onCancel: () => void;
}

export function MessageComposerDispatchControls({
  skippedCount,
  isEmail,
  isBulk,
  opening,
  dispatchSpeed,
  dispatchProgress,
  isPaused,
  onShowSkipped,
  onDispatchSpeedChange,
  onPausedChange,
  onCancel,
}: MessageComposerDispatchControlsProps): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <>
      <AnimatePresence>
        {skippedCount > 0 && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex flex-col gap-2 rounded-lg border border-warning/20 bg-warning/10 p-2.5 text-xs text-warning sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" /><span className="min-w-0">{t('messaging.skippedNotice', { count: String(skippedCount), type: isEmail ? t('messaging.emailAddress') : t('messaging.phoneNumber') })}</span></div>
            <Button type="button" variant="link" onClick={onShowSkipped} className="inline-flex min-h-11 shrink-0 items-center self-end p-0 text-xs font-semibold sm:self-auto">{t('messaging.viewSkipped')}</Button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {dispatchProgress && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-2.5 rounded-xl border border-primary/30 bg-primary/5 p-3 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-primary">
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 animate-spin" />{t('messaging.dispatchProgress', { current: String(dispatchProgress.current), total: String(dispatchProgress.total) })}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono">{Math.round((dispatchProgress.current / dispatchProgress.total) * 100)}%</span>
                <Button type="button" variant="outline" size="icon" className="min-h-11 min-w-11" onClick={() => onPausedChange(!isPaused)} title={isPaused ? t('messaging.resume') : t('messaging.pause')} aria-label={isPaused ? t('messaging.resume') : t('messaging.pause')}>{isPaused ? <Play className="h-3 w-3 text-success" /> : <Pause className="h-3 w-3 text-warning" />}</Button>
                <Button type="button" variant="ghost" size="icon" className="min-h-11 min-w-11 text-destructive hover:bg-destructive/10" onClick={onCancel} title={t('messaging.cancelDispatch')} aria-label={t('messaging.cancelDispatch')}><XCircle className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted"><motion.div className={`h-full rounded-full ${isPaused ? 'bg-warning' : 'bg-primary'}`} initial={{ width: 0 }} animate={{ width: `${(dispatchProgress.current / dispatchProgress.total) * 100}%` }} transition={{ duration: 0.2 }} /></div>
          </motion.div>
        )}
      </AnimatePresence>
      {isBulk && !opening && (
        <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 p-2 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-muted-foreground"><Zap className="h-3.5 w-3.5 text-primary" />{t('messaging.dispatchSpeed')}:</span>
          <SegmentedPillFilter
            options={[
              { value: 'safe', label: t('messaging.speed.safe') },
              { value: 'normal', label: t('messaging.speed.normal') },
              { value: 'express', label: t('messaging.speed.express') },
            ]}
            value={dispatchSpeed}
            onChange={(value) => onDispatchSpeedChange(value as DispatchSpeed)}
            size="sm"
          />
        </div>
      )}
    </>
  );
}
