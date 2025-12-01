import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./header.css"; // resta opzionale; il componente usa classi Tailwind di base
export default function AppHeader({ rightSlot, onLogoClick, centerLogoOnMobile = true, className = "", }) {
    return (_jsxs("header", { className: `app-header border-b text-slate-900 ${className}`, children: [_jsx("div", { className: "w-full bg-primary h-3" }), _jsx("div", { className: "w-full bg-secondary h-[6px]" }), _jsxs("div", { className: `
          container-page py-3
          flex items-center justify-between
        `, children: [_jsx("button", { type: "button", onClick: onLogoClick, className: `
            text-sm sm:text-base font-semibold tracking-wide
            text-gray-900 hover:opacity-80 transition
            ${centerLogoOnMobile ? "mx-auto sm:mx-0" : ""}
          `, "aria-label": "Torna alla Dashboard", children: "Future Molding" }), _jsx("div", { className: "ml-4 shrink-0 hidden sm:flex items-center", children: rightSlot })] })] }));
}
