import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings, Trash2, Globe, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// Mock configurations
const mockConfigurations = [
    {
        id: 1,
        name: "Config_PP_Standard",
        machine: "Arburg",
        material: "PP",
        createdAt: "2024-01-15",
        description: "Configurazione standard per PP con parametri bilanciati"
    },
    {
        id: 2,
        name: "Config_ABS_Alta_Qualità",
        machine: "Engel",
        material: "ABS",
        createdAt: "2024-01-14",
        description: "Parametri ottimizzati per massima qualità superficiale"
    },
    {
        id: 3,
        name: "Config_PE_Veloce",
        machine: "Haitian",
        material: "PE",
        createdAt: "2024-01-13",
        description: "Configurazione per cicli rapidi"
    },
];
const machineOptions = [
    "Arburg",
    "Engel",
    "Haitian",
    "Fanuc",
    "Sumitomo",
    "Milacron",
    "Boy",
    "Wittmann Battenfeld"
];
export default function Impostazioni() {
    const { toast } = useToast();
    const [selectedMachine, setSelectedMachine] = useState("Arburg");
    const [configurations, setConfigurations] = useState(mockConfigurations);
    const handleDeleteConfig = (id) => {
        setConfigurations(prev => prev.filter(config => config.id !== id));
        toast({
            title: "Configurazione eliminata",
            description: "La configurazione è stata rimossa dal sistema",
        });
    };
    const handleSaveSettings = () => {
        toast({
            title: "Impostazioni salvate",
            description: "Le tue preferenze sono state aggiornate con successo",
        });
    };
    return (_jsxs("div", { className: "space-y-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-foreground mb-2", children: "Impostazioni" }), _jsx("p", { className: "text-muted-foreground", children: "Configura le preferenze del sistema e gestisci le configurazioni salvate" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Settings, { className: "w-5 h-5 mr-2 text-primary" }), "Impostazioni Sistema"] }), _jsx(CardDescription, { children: "Configurazioni generali dell'applicazione" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs(Label, { className: "flex items-center mb-2", children: [_jsx(Globe, { className: "w-4 h-4 mr-2" }), "Lingua"] }), _jsxs(Select, { value: "it", disabled: true, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: _jsx(SelectItem, { value: "it", children: "\uD83C\uDDEE\uD83C\uDDF9 Italiano" }) })] }), _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Lingua bloccata su Italiano per questa versione" })] }), _jsxs("div", { children: [_jsxs(Label, { className: "flex items-center mb-2", children: [_jsx(Wrench, { className: "w-4 h-4 mr-2" }), "Pressa Predefinita"] }), _jsxs(Select, { value: selectedMachine, onValueChange: setSelectedMachine, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: machineOptions.map((machine) => (_jsx(SelectItem, { value: machine, children: machine }, machine))) })] })] }), _jsx(Button, { onClick: handleSaveSettings, className: "w-full", children: "Salva Impostazioni" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Unit\u00E0 di Misura" }), _jsx(CardDescription, { children: "Unit\u00E0 utilizzate nel sistema" })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Volume:" }), _jsx(Badge, { variant: "outline", children: "cm\u00B3" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Pressione:" }), _jsx(Badge, { variant: "outline", children: "bar" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Temperatura:" }), _jsx(Badge, { variant: "outline", children: "\u00B0C" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Tempo:" }), _jsx(Badge, { variant: "outline", children: "s" })] })] }), _jsx("p", { className: "text-xs text-muted-foreground mt-4", children: "Il punto di commutazione \u00E8 sempre espresso in cm\u00B3" })] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { children: ["Configurazioni Salvate (", configurations.length, ")"] }), _jsx(CardDescription, { children: "Gestisci le tue configurazioni di stampaggio" })] }), _jsx(CardContent, { children: configurations.length === 0 ? (_jsxs("div", { className: "text-center py-8 text-muted-foreground", children: [_jsx(Settings, { className: "w-12 h-12 mx-auto mb-4 opacity-50" }), _jsx("p", { children: "Nessuna configurazione salvata" }), _jsx("p", { className: "text-sm", children: "Crea la prima configurazione nella sezione Parametri" })] })) : (_jsx("div", { className: "space-y-4", children: configurations.map((config) => (_jsxs("div", { className: "p-4 bg-muted/30 rounded-lg", children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium", children: config.name }), _jsx("p", { className: "text-sm text-muted-foreground", children: config.description })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleDeleteConfig(config.id), className: "text-destructive hover:text-destructive", children: _jsx(Trash2, { className: "w-4 h-4" }) })] }), _jsxs("div", { className: "flex items-center space-x-2 text-xs", children: [_jsx(Badge, { variant: "outline", children: config.machine }), _jsx(Badge, { variant: "secondary", children: config.material }), _jsx("span", { className: "text-muted-foreground", children: config.createdAt })] }), _jsxs("div", { className: "flex gap-2 mt-3", children: [_jsx(Button, { variant: "outline", size: "sm", className: "flex-1", children: "Carica" }), _jsx(Button, { variant: "outline", size: "sm", className: "flex-1", children: "Duplica" })] })] }, config.id))) })) })] })] })] }));
}
