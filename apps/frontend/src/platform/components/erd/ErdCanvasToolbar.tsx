import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Download,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';

export interface ErdCanvasToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onCopySource: () => void;
  copied: boolean;
  onDownloadSvg: () => void;
  canDownload: boolean;
}

export function ErdCanvasToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  isFullscreen,
  onToggleFullscreen,
  onCopySource,
  copied,
  onDownloadSvg,
  canDownload,
}: ErdCanvasToolbarProps): React.JSX.Element {
  const { t } = useTranslation();
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div
      role="toolbar"
      aria-label={t('platform.erdDiagram')}
      className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3"
    >
      {/* Zoom controls */}
      <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onZoomOut}
          disabled={zoom <= 0.5}
          className="min-h-11 min-w-11 h-11 w-11 p-0 rounded-lg hover:bg-muted cursor-pointer"
          title={t('platform.erdZoomOut')}
          aria-label={t('platform.erdZoomOut')}
        >
          <ZoomOut className="w-4 h-4 text-foreground" aria-hidden />
        </Button>

        <button
          type="button"
          onClick={onResetZoom}
          className="min-h-11 px-2.5 text-xs font-mono font-bold text-foreground hover:bg-muted/80 rounded-lg transition-colors cursor-pointer"
          title={t('platform.erdResetZoom')}
          aria-label={t('platform.erdResetZoom')}
        >
          {zoomPercent}%
        </button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onZoomIn}
          disabled={zoom >= 2.0}
          className="min-h-11 min-w-11 h-11 w-11 p-0 rounded-lg hover:bg-muted cursor-pointer"
          title={t('platform.erdZoomIn')}
          aria-label={t('platform.erdZoomIn')}
        >
          <ZoomIn className="w-4 h-4 text-foreground" aria-hidden />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onResetZoom}
          className="min-h-11 min-w-11 h-11 w-11 p-0 rounded-lg hover:bg-muted cursor-pointer"
          title={t('platform.erdResetZoom')}
          aria-label={t('platform.erdResetZoom')}
        >
          <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
        </Button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCopySource}
          className="min-h-11 h-11 px-3 text-xs font-semibold gap-1.5 rounded-xl border-border/60 hover:bg-muted/80 cursor-pointer"
          title={copied ? t('platform.erdCopied') : t('platform.erdCopySource')}
          aria-label={copied ? t('platform.erdCopied') : t('platform.erdCopySource')}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-success" aria-hidden />
              <span>{t('platform.erdCopied')}</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
              <span>{t('platform.erdCopySource')}</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onDownloadSvg}
          disabled={!canDownload}
          className="min-h-11 h-11 px-3 text-xs font-semibold gap-1.5 rounded-xl border-border/60 hover:bg-muted/80 cursor-pointer"
          title={t('platform.erdDownloadSvg')}
          aria-label={t('platform.erdDownloadSvg')}
        >
          <Download className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
          <span>{t('platform.erdDownloadSvg')}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggleFullscreen}
          className="min-h-11 min-w-11 h-11 w-11 p-0 rounded-xl border-border/60 hover:bg-muted/80 cursor-pointer"
          title={isFullscreen ? t('platform.erdExitFullscreen') : t('platform.erdFullscreen')}
          aria-label={isFullscreen ? t('platform.erdExitFullscreen') : t('platform.erdFullscreen')}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 text-primary" aria-hidden />
          ) : (
            <Maximize2 className="w-4 h-4 text-foreground" aria-hidden />
          )}
        </Button>
      </div>
    </div>
  );
}
