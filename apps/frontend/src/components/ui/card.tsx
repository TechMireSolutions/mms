import * as React from "react"

import { cn } from "@/lib/utils"

import { CARD_STRIPE_COLORS } from "@/lib/semanticTone"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    accentColor?: "primary" | "success" | "warning" | "destructive" | "info" | "emerald" | "indigo" | "rose" | "amber" | "teal" | "purple" | "muted" | string
  }
>(({ className, accentColor, ...props }, ref) => {

  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden group/card rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm text-card-foreground shadow-sm hover:shadow-md transition-all duration-300",
        className
      )}
      {...props}
    >
      {accentColor && (
        <div className={cn("absolute start-0 top-0 bottom-0 w-1 transition-colors duration-300", CARD_STRIPE_COLORS[accentColor])} />
      )}
      {props.children}
    </div>
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props} />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props} />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props} />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
