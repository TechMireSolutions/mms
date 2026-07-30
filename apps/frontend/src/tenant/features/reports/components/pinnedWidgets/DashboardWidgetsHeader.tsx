import { LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';

interface DashboardWidgetsHeaderProps {
  gridMode: 'comfortable' | 'compact';
  onToggleGridMode: (mode: 'comfortable' | 'compact') => void;
}

export function DashboardWidgetsHeader({ gridMode, onToggleGridMode }: DashboardWidgetsHeaderProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <LayoutDashboard className="w-4 h-4 shrink-0 text-primary" />
        <h3 className="min-w-0 truncate text-xs font-black text-foreground uppercase tracking-widest leading-none">
          {t('reports.widgets.pinnedPanels')}
        </h3>
      </div>

      <div className="flex shrink-0 items-center gap-1 border border-border/60 bg-muted/20 p-1 rounded-xl shadow-inner backdrop-blur-xs relative select-none">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onToggleGridMode('comfortable')}
          className={`min-h-11 px-3 rounded-lg text-xs font-black uppercase tracking-wider relative z-10 shadow-none ${
            gridMode === 'comfortable' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {gridMode === 'comfortable' && (
            <motion.div
              layoutId="gridModeHighlight"
              className="absolute inset-0 bg-card rounded-lg shadow-xs border border-border/40 -z-10"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          {t('reports.widgets.comfortable')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onToggleGridMode('compact')}
          className={`min-h-11 px-3 rounded-lg text-xs font-black uppercase tracking-wider relative z-10 shadow-none ${
            gridMode === 'compact' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {gridMode === 'compact' && (
            <motion.div
              layoutId="gridModeHighlight"
              className="absolute inset-0 bg-card rounded-lg shadow-xs border border-border/40 -z-10"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          {t('reports.widgets.compact')}
        </Button>
      </div>
    </div>
  );
}
