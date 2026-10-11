import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "accent";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";

    const variants = {
      default:
        "bg-primary text-white shadow-glow hover:bg-primary-600 hover:shadow-lg",
      secondary:
        "bg-secondary dark:bg-gray-800 text-foreground dark:text-gray-200 hover:bg-card-hover dark:hover:bg-gray-750 border border-border dark:border-gray-700",
      outline:
        "border border-border dark:border-gray-700 bg-transparent text-foreground dark:text-gray-200 hover:bg-secondary dark:hover:bg-gray-800 hover:text-foreground dark:hover:text-white",
      ghost:
        "hover:bg-secondary/60 dark:hover:bg-gray-800/80 text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white",
      destructive:
        "bg-destructive text-white hover:bg-rose-600 shadow-sm",
      accent:
        "bg-accent text-background dark:text-white font-semibold hover:bg-cyan-400 shadow-sm",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 py-2 text-sm",
      lg: "h-11 px-6 text-base",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
