import React from 'react';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { WORK_SURFACE } from '@/components/ui/formStyles';

export interface CustomizeSectionCardProps {
  title: string;
  description: string;
  headerContent?: React.ReactNode;
  maxHeightClass?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Reusable surface card container for dashboard customization sections. */
export function CustomizeSectionCard({
  title,
  description,
  headerContent,
  maxHeightClass = 'max-h-preview-tall',
  children,
  footer,
}: CustomizeSectionCardProps): React.JSX.Element {
  return (
    <div className={`${WORK_SURFACE} p-6`}>
      <fieldset className="space-y-4 border-0 p-0 m-0">
        <SectionLabel as="legend" tone="primary" className="leading-none mb-1">
          {title}
        </SectionLabel>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>

        {headerContent && (
          <div className="text-xs border-b border-border/45 pb-3">
            {headerContent}
          </div>
        )}

        <div className={`space-y-2 ${maxHeightClass} overflow-y-auto pe-1`}>
          {children}
        </div>

        {footer}
      </fieldset>
    </div>
  );
}
