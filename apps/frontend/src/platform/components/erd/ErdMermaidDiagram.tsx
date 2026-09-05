import React, { useEffect, useId, useState } from 'react';
import { buildErdMermaid, type ErdDomain } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { ErrorState } from '@/components/ui/ErrorState';
import { WORK_SURFACE } from '@/components/ui/formStyles';
import { cn } from '@/lib/utils';

interface ErdMermaidDiagramProps {
  domain: ErdDomain;
}

type DiagramStatus = 'pending' | 'ready' | 'error';

function readThemeColor(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!value) return fallback;
  if (
    value.startsWith('#') ||
    value.startsWith('rgb') ||
    value.startsWith('hsl') ||
    value.startsWith('oklch')
  ) {
    return value;
  }
  return `hsl(${value})`;
}

export function ErdMermaidDiagram({ domain }: ErdMermaidDiagramProps): React.JSX.Element {
  const { t } = useTranslation();
  const renderId = useId().replace(/:/g, '');
  const source = buildErdMermaid(domain);
  const [svg, setSvg] = useState('');
  const [status, setStatus] = useState<DiagramStatus>('pending');
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('pending');
    setSvg('');

    void import('mermaid')
      .then(async ({ default: mermaid }) => {
        if (controller.signal.aborted) return;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'base',
          themeVariables: {
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            primaryColor: readThemeColor('--card', '#f8fafc'),
            primaryTextColor: readThemeColor('--foreground', '#0f172a'),
            primaryBorderColor: readThemeColor('--border', '#cbd5e1'),
            lineColor: readThemeColor('--primary', '#047857'),
            secondaryColor: readThemeColor('--muted', '#f1f5f9'),
            tertiaryColor: readThemeColor('--background', '#ffffff'),
          },
        });
        const { svg: nextSvg } = await mermaid.render(
          `erd-${renderId}-${domain.id}-${domain.tables.length}`,
          source,
        );
        if (controller.signal.aborted) return;
        setSvg(nextSvg);
        setStatus('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error');
      });

    return () => {
      controller.abort();
    };
  }, [domain.id, renderId, retryTick, source]);

  return (
    <figure
      className={cn(WORK_SURFACE, 'overflow-x-auto p-4')}
      aria-label={t('platform.erdDiagram')}
      aria-busy={status === 'pending'}
    >
      {status === 'error' ? (
        <ErrorState
          compact
          title={t('platform.erdLoadFailed')}
          description={t('platform.erdLoadFailedHint')}
          onRetry={() => setRetryTick((tick) => tick + 1)}
        />
      ) : null}
      {status === 'pending' ? (
        <p className="min-h-preview text-sm text-muted-foreground" aria-live="polite">
          {t('common.loading')}
        </p>
      ) : null}
      {status === 'ready' ? (
        <div
          className="min-h-preview [&_svg]:mx-auto [&_svg]:max-w-full [&_svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : null}
    </figure>
  );
}
