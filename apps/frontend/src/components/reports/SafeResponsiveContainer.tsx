import React, { useLayoutEffect, useRef, useState } from "react";
import { ResponsiveContainer, type ResponsiveContainerProps } from "recharts";

type SafeResponsiveContainerProps = Omit<ResponsiveContainerProps, "width" | "height"> & {
  width?: number | string;
  height?: number | string;
};

/**
 * Delays Recharts mounting until the container has real dimensions.
 * This avoids zero-width warnings while report tabs animate into view.
 */
export default function SafeResponsiveContainer({
  width = "100%",
  height,
  children,
  ...props
}: SafeResponsiveContainerProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    const update = () => {
      const rect = node.getBoundingClientRect();
      setSize({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const wrapperStyle: React.CSSProperties = {
    width,
    height,
    minWidth: 0,
    minHeight: typeof height === "number" ? height : 1,
  };

  return (
    <div ref={ref} style={wrapperStyle}>
      {size.width > 0 && size.height > 0 ? (
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={1}
          minHeight={1}
          initialDimension={{ width: size.width, height: size.height }}
          {...props}
        >
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
