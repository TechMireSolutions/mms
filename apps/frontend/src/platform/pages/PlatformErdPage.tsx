import React from 'react';
import { Waypoints } from 'lucide-react';
import { motion } from 'framer-motion';
import { PlatformPageShell } from '@/platform/components/PlatformPageShell';
import { useTranslation } from '@/hooks/useTranslation';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErdExplorer } from '@/platform/components/erd/ErdExplorer';
import { containerVariantsConsole as containerVariants, itemVariants } from '@/platform/lib/animations';

export default function PlatformErdPage(): React.JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  return (
    <PlatformPageShell width="7xl">
      <motion.div
        variants={containerVariants}
        initial={reducedMotion ? false : 'hidden'}
        animate="show"
        className="space-y-6"
      >
        <motion.div variants={itemVariants}>
          <PageHeader
            icon={Waypoints}
            title={t('platform.erdTitle')}
            subtitle={t('platform.erdSubtitle')}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <ErdExplorer />
        </motion.div>
      </motion.div>
    </PlatformPageShell>
  );
}
