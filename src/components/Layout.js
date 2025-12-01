import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Home, FileText, Settings, Wrench, AlertTriangle, Database } from "lucide-react";
import AppHeader from "./AppHeader";
import { Footer } from "./Footer"; // se il tuo Footer è default export, cambia in:  import Footer from "./Footer";
const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Disegni", href: "/disegni", icon: FileText },
    { name: "Parametri", href: "/parametri", icon: Wrench },
    { name: "Raccolta dati", href: "/raccolta-dati", icon: Database },
    { name: "Difetti", href: "/difetti", icon: AlertTriangle },
    { name: "Impostazioni", href: "/impostazioni", icon: Settings },
];
export function Layout() {
    const navigate = useNavigate();
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 text-slate-900", children: [_jsx(AppHeader, { onLogoClick: () => navigate("/") }), _jsx("nav", { className: "border-b bg-white", children: _jsx("div", { className: "container mx-auto px-4", children: _jsx("ul", { className: "flex flex-wrap gap-4 py-3", children: navigation.map(({ name, href, icon: Icon }) => (_jsx("li", { children: _jsxs(NavLink, { to: href, className: ({ isActive }) => `inline-flex items-center gap-2 px-3 py-1.5 rounded-md ${isActive ? "text-blue-700 font-semibold" : "text-slate-700 hover:text-blue-700"}`, children: [_jsx(Icon, { className: "h-4 w-4" }), _jsx("span", { children: name })] }) }, href))) }) }) }), _jsx("main", { className: "container mx-auto px-4 py-6", children: _jsx(Outlet, {}) }), _jsx(Footer, {})] }));
}
