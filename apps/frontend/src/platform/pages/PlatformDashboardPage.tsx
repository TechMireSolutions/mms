import React from 'react';
import { LayoutDashboard, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { usePlatformPermissions } from '@/platform/hooks/usePlatformPermissions';
import { ModuleScaffold } from '@/components/common/ModuleScaffold';
import { Button } from '@/components/ui/button';
import { PlatformDashboard } from '@/platform/components/PlatformDashboard';
import { ROUTES } from '@/lib/config/routes';

export default function PlatformDashboardPage(): React.JSX.Element {
  const { t } = useTranslation();
  const perms = usePlatformPermissions();
  const { platformUser, isSuperUser, canOnboard } = perms;

  const userName = platformUser?.name ?? '';
  const subtitle = isSuperUser
    ? t('platform.consoleSubtitle', { name: userName })
    : t('platform.adminConsoleSubtitle', { name: userName });

  const headerActions = canOnboard ? (
    <Button
      asChild
      className="min-h-11 rounded-xl font-bold px-5 shadow-xs shadow-primary/20 hover:shadow-md cursor-pointer"
    >
      <Link to={ROUTES.onboarding}>
        <PlusCircle className="w-4 h-4 me-1.5" aria-hidden />
        {t('auth.createMadrasa')}
      </Link>
    </Button>
  ) : undefined;

  return (
    <ModuleScaffold
      seoTitle={`${t('dashboard.title')} | ${t('platform.consoleTitle')}`}
      seoDescription={subtitle}
      headerIcon={LayoutDashboard}
      headerTitle={t('dashboard.title')}
      headerSubtitle={subtitle}
      headerActions={headerActions}
    >
      <PlatformDashboard />
    </ModuleScaffold>
  );
}
