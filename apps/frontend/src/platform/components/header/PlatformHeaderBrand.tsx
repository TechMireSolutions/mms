import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/lib/config/routes';

export function PlatformHeaderBrand(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Link to={ROUTES.home} className="group flex min-h-11 min-w-11 items-center gap-3.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent border border-primary/25 shadow-sm group-hover:scale-105 group-hover:shadow group-hover:border-primary/45 transition-all duration-300">
        <span className="font-display text-lg font-black text-primary transition-transform group-hover:rotate-6">م</span>
      </div>
      <div className="flex flex-col text-start">
        <span className="text-sm font-black tracking-wider uppercase text-foreground leading-none">
          {t('entry.productName')}
        </span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-1">
          {t('platform.consoleTitle')}
        </span>
      </div>
    </Link>
  );
}
