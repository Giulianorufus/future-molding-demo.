import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Clock, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";
// Mock data
const recentCalculations = [
    { id: 1, drawing: "Coperchio_plastica.pdf", material: "PP", date: "2024-01-15 14:30", result: "OK" },
    { id: 2, drawing: "Supporto_motore.step", material: "ABS", date: "2024-01-15 11:45", result: "OK" },
    { id: 3, drawing: "Guarnizione.dwg", material: "PE", date: "2024-01-14 16:20", result: "SCARTO" },
];
const savedConfigurations = [
    { id: 1, name: "Config_PP_Standard", machine: "Arburg", createdAt: "2024-01-15" },
    { id: 2, name: "Config_ABS_Alta_Qualità", machine: "Engel", createdAt: "2024-01-14" },
    { id: 3, name: "Config_PE_Veloce", machine: "Haitian", createdAt: "2024-01-13" },
];
export default function Dashboard() {
    return (_jsxs("div", { className: "space-y-8", children: [_jsxs("div", { className: "text-center py-12", children: [_jsx("h1", { className: "text-4xl font-bold text-dark mb-4", children: "Benvenuto in Future Molding" }), _jsx("p", { className: "text-lg text-muted-foreground mb-8 max-w-2xl mx-auto", children: "Trasforma i tuoi disegni in parametri di stampaggio ottimizzati con semplicit\u00E0 e precisione" }), _jsx(Link, { to: "/disegni", children: _jsxs(Button, { className: "bg-primary text-white px-4 py-2 rounded-lg", children: [_jsx(FileText, { className: "w-5 h-5 mr-2" }), "Avvia Nuovo Progetto", _jsx(ArrowRight, { className: "w-5 h-5 ml-2" })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [_jsxs(Card, { className: "bg-secondary", children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Clock, { className: "w-5 h-5 mr-2 text-primary" }), "Ultimi Parametri Calcolati"] }), _jsx(CardDescription, { children: "I tuoi calcoli pi\u00F9 recenti" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "space-y-4", children: recentCalculations.map((calc) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-muted/30 rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-sm", children: calc.drawing }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [calc.material, " \u2022 ", calc.date] })] }), _jsx("div", { className: `${calc.result === "OK"
                                                        ? "bg-success text-white px-2 py-1 rounded-md text-sm"
                                                        : "bg-red-100 text-red-800 px-2 py-1 rounded-md text-sm"}`, children: calc.result })] }, calc.id))) }), _jsx(Link, { to: "/parametri", children: _jsx(Button, { variant: "outline", className: "w-full mt-4", children: "Vedi Tutti i Calcoli" }) })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Settings2, { className: "w-5 h-5 mr-2 text-primary" }), "Configurazioni Salvate"] }), _jsx(CardDescription, { children: "Le tue configurazioni pronte all'uso" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "space-y-4", children: savedConfigurations.map((config) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-muted/30 rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-sm", children: config.name }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [config.machine, " \u2022 ", config.createdAt] })] }), _jsx(Button, { variant: "ghost", size: "sm", children: "Carica" })] }, config.id))) }), _jsxs("div", { className: "flex gap-2 mt-4", children: [_jsx(Link, { to: "/impostazioni", children: _jsx(Button, { variant: "outline", className: "flex-1", children: "Gestisci Configurazioni" }) }), _jsx(Link, { to: "/audit-test", children: _jsx(Button, { variant: "outline", className: "flex-1", children: "Test Audit" }) })] })] })] })] })] }));
}
