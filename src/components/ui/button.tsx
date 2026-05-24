"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
      default:
        "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600",
      outline:
        "border border-blue-600 text-blue-600 bg-transparent hover:bg-blue-50 focus-visible:ring-blue-600 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], "px-3 py-1.5", className)}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

