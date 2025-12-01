import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
const base = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors";
const variants = {
    default: "bg-gray-900 text-white border-transparent",
    secondary: "bg-gray-100 text-gray-900 border-transparent",
    outline: "bg-transparent text-gray-900",
    success: "bg-green-600 text-white border-transparent",
    warning: "bg-amber-500 text-white border-transparent",
    destructive: "bg-red-600 text-white border-transparent",
};
export function Badge({ className, variant = "default", ...props }) {
    return _jsx("div", { className: cn(base, variants[variant], className), ...props });
}
