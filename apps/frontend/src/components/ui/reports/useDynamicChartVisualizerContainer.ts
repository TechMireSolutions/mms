import { useEffect, useMemo, useState, type RefObject } from 'react';
import {
  computeAxisFontSize,
  computeLegendFontSize,
  computeTickGap,
} from '@/components/ui/reports/dynamicChartVisualizerPin';

export function useDynamicChartVisualizerContainer(chartRef: RefObject<HTMLDivElement | null>) {
  const [containerWidth, setContainerWidth] = useState(600);

  useEffect(() => {
    if (!chartRef.current) return;
    const observer = new ResizeObserver((resizeEntries) => {
      for (const resizeEntry of resizeEntries) {
        if (resizeEntry.contentRect.width > 0) {
          setContainerWidth(resizeEntry.contentRect.width);
        }
      }
    });
    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, [chartRef]);

  const axisFontSize = useMemo(() => computeAxisFontSize(containerWidth), [containerWidth]);
  const legendFontSize = useMemo(() => computeLegendFontSize(containerWidth), [containerWidth]);
  const tickGap = useMemo(() => computeTickGap(containerWidth), [containerWidth]);

  return { containerWidth, axisFontSize, legendFontSize, tickGap };
}
