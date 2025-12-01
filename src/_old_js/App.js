import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
// Import “compat”: funziona anche senza `export default`
import * as DashboardMod from "./pages/Dashboard";
import * as ParametriSafeMod from "./pages/Parametri";
import * as ParametriPageMod from "./pages/ParametriPage";
import * as DifettiMod from "./pages/Difetti";
import * as DisegniMod from "./pages/Disegni";
import * as ImpostazioniMod from "./pages/Impostazioni";
import * as RaccoltaDatiMod from "./pages/RaccoltaDati";
import * as AuditMod from "./pages/AuditTestPage";
import * as NotFoundMod from "./pages/NotFound";
function pickComponent(mod, prefer) {
    if (prefer && mod[prefer])
        return mod[prefer];
    if (mod.default)
        return mod.default;
    const first = Object.values(mod).find((x) => typeof x === "function");
    return first ?? (() => _jsx("div", { className: "p-4", children: "Componente non trovato" }));
}
const Dashboard = pickComponent(DashboardMod, "Dashboard");
const ParametriSafe = pickComponent(ParametriSafeMod, "Parametri"); // versione sicura
const ParametriPage = pickComponent(ParametriPageMod, "ParametriPage"); // versione completa
const Difetti = pickComponent(DifettiMod, "Difetti");
const Disegni = pickComponent(DisegniMod, "Disegni");
const Impostazioni = pickComponent(ImpostazioniMod, "Impostazioni");
const RaccoltaDati = pickComponent(RaccoltaDatiMod, "RaccoltaDati");
const AuditTestPage = pickComponent(AuditMod, "AuditTestPage");
const NotFound = pickComponent(NotFoundMod, "NotFound");
export default function App() {
    return (_jsx(Layout, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "/parametri", element: _jsx(ParametriSafe, {}) }), _jsx(Route, { path: "/parametri-page", element: _jsx(ParametriPage, {}) }), _jsx(Route, { path: "/difetti", element: _jsx(Difetti, {}) }), _jsx(Route, { path: "/disegni", element: _jsx(Disegni, {}) }), _jsx(Route, { path: "/raccolta-dati", element: _jsx(RaccoltaDati, {}) }), _jsx(Route, { path: "/impostazioni", element: _jsx(Impostazioni, {}) }), _jsx(Route, { path: "/audit", element: _jsx(AuditTestPage, {}) }), _jsx(Route, { path: "/404", element: _jsx(NotFound, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/404", replace: true }) })] }) }));
}
