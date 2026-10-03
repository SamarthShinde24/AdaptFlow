import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "success"
    | "destructive"
    | "warning"
    | "outline"
    | "info";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variants = {
    default: "bg-primary/20 text-primary-300 border-primary/30",
    secondary: "bg-secondary text-muted-foreground border-border",
    success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    destructive: "bg-destructive/20 text-rose-400 border-destructive/30",
    warning: "bg-warning/20 text-amber-300 border-warning/30",
    outline: "text-foreground border-border",
    info: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
