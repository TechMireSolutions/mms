import * as React from "react";

import { cn } from "@/lib/utils";
import { CARD_STRIPE_BASE, CARD_STRIPE_INSET, type CardAccentColor, getCardStripeClass } from "@/lib/semanticTone";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accentColor?: CardAccentColor | string | false | null;
  interactive?: boolean;
}

export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div";
}

export type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

export type CardContentProps = React.HTMLAttributes<HTMLDivElement>;

export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;

const Card = ({
  ref,
  className,
  accentColor = "primary",
  interactive = false,
  ...props
}: CardProps & { ref?: React.Ref<HTMLDivElement> }) => {
  const hasStripe = accentColor && accentColor !== "none";
  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden group/card rounded-2xl border border-foreground/10 bg-card text-card-foreground shadow-xs transition-colors duration-150 ease-out",
        interactive && "cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-hidden active:scale-tap-micro hover:border-foreground/20",
        hasStripe && CARD_STRIPE_INSET,
        className,
      )}
      {...props}
    >
      {hasStripe && (
        <div
          aria-hidden="true"
          className={cn(CARD_STRIPE_BASE, "transition-colors duration-150 ease-out", getCardStripeClass(accentColor as string))}
        />
      )}
      {props.children}
    </div>
  );
};
Card.displayName = "Card";

const CardHeader = ({
  ref,
  className,
  ...props
}: CardHeaderProps & { ref?: React.Ref<HTMLDivElement> }) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
);
CardHeader.displayName = "CardHeader";

const CardTitle = ({
  ref,
  className,
  as: Component = "h3",
  ...props
}: CardTitleProps & { ref?: React.Ref<HTMLHeadingElement> }) => (
  <Component
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight text-card-foreground", className)}
    {...props}
  />
);
CardTitle.displayName = "CardTitle";

const CardDescription = ({
  ref,
  className,
  ...props
}: CardDescriptionProps & { ref?: React.Ref<HTMLParagraphElement> }) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
);
CardDescription.displayName = "CardDescription";

const CardContent = ({
  ref,
  className,
  ...props
}: CardContentProps & { ref?: React.Ref<HTMLDivElement> }) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
);
CardContent.displayName = "CardContent";

const CardFooter = ({
  ref,
  className,
  ...props
}: CardFooterProps & { ref?: React.Ref<HTMLDivElement> }) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
