import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "outline" | "success" | "warning" | "destructive";

const base = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors";
const variants: Record<Variant, string> = {
  default: "bg-gray-900 text-white border-transparent",
  secondary: "bg-gray-100 text-gray-900 border-transparent",
  outline: "bg-transparent text-gray-900",
  success: "bg-green-600 text-white border-transparent",
  warning: "bg-amber-500 text-white border-transparent",
  destructive: "bg-red-600 text-white border-transparent",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return <div className={cn(base, variants[variant], className)} {...props} />;
}
