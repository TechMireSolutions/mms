import React from 'react';
import { Building2, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { usePlatformPermissions } from '@/platform/hooks/usePlatformPermissions';
import { ModuleScaffold } from '@/components/common/ModuleScaffold';
import { Button } from '@/components/ui/button';
import PlatformWorkspaceList from '@/platform/components/PlatformWorkspaceList';
import { ROUTES } from '@/lib/config/routes';

export default function PlatformWorkspacesPage(): React.JSX.Element {
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
      onMouseEnter={() => {
        void import('@/platform/pages/onboarding/OnboardingWizard');
      }}
    >
      <Link to={ROUTES.onboarding}>
        <Plus className="w-4 h-4 me-1.5" aria-hidden />
        {t('auth.createMadrasa')}
        <ArrowRight className="w-4 h-4 ms-1 rtl:rotate-180" aria-hidden />
      </Link>
    </Button>
  ) : undefined;

  return (
    <ModuleScaffold
      seoTitle={`${t('platform.manageMadrasas')} | ${t('platform.consoleTitle')}`}
      seoDescription={subtitle}
      headerIcon={Building2}
      headerTitle={t('platform.manageMadrasas')}
      headerSubtitle={subtitle}
      headerActions={headerActions}
    >
      <PlatformWorkspaceList />
    </ModuleScaffold>
  );
}
