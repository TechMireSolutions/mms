import type React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface StyleBtnProps {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}

export function StyleBtn({ active, onClick, children, title }: StyleBtnProps): React.JSX.Element {
  return (
    <Button
      type="button"
      title={title}
      onClick={onClick}
      variant="ghost"
      className={`min-h-11 min-w-11 flex items-center justify-center p-0 rounded text-xs transition-colors border shadow-none ${active ? "bg-primary text-primary-foreground border-primary hover:bg-primary/95" : "border-border hover:bg-muted text-foreground"}`}
    >
      {children}
    </Button>
  );
}

export interface StyleInputProps {
  label: string;
  value: string | number;
  onChange: (nextValue: string | number) => void;
  type?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function StyleInput({
  label,
  value,
  onChange,
  type = "text",
  min,
  max,
  step,
  className = "",
}: StyleInputProps): React.JSX.Element {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <span className="text-xs font-bold uppercase text-muted-foreground tracking-wide">{label}</span>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(type === "number" ? Number(event.target.value) : event.target.value)}
        min={min}
        max={max}
        step={step}
        className="w-full min-h-11 px-1.5 py-2 text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
      />
    </div>
  );
}
