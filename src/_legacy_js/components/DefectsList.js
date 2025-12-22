import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Edit3, ChevronDown, ChevronRight } from "lucide-react";
const DEFECT_TYPES = [
    "Linee di flusso",
    "Jetting",
    "Striature argentate",
    "Incompletezza",
    "Imbarcamento centrale",
    "Adesione da sottovuoto",
    "Colature di materiale",
    "Formazione di filamenti nella materozza",
    "Piegature"
];
const SEVERITY_COLORS = {
    1: "bg-green-500",
    2: "bg-green-400",
    3: "bg-secondary",
    4: "bg-orange-500",
    5: "bg-red-500"
};
export const DefectsList = ({ pins, selectedPin, onSelectPin, onUpdatePin, onDeletePin }) => {
    const [editingPin, setEditingPin] = useState(null);
    const [expandedPins, setExpandedPins] = useState(new Set());
    const toggleExpanded = (pinId) => {
        const newExpanded = new Set(expandedPins);
        if (newExpanded.has(pinId)) {
            newExpanded.delete(pinId);
        }
        else {
            newExpanded.add(pinId);
        }
        setExpandedPins(newExpanded);
    };
    const handleEdit = (pinId) => {
        setEditingPin(pinId);
        onSelectPin(pinId);
        setExpandedPins(prev => new Set([...prev, pinId]));
    };
    const handleSave = () => {
        setEditingPin(null);
    };
    const handleUpdateDefect = (pinId, field, value) => {
        onUpdatePin(pinId, { [field]: value });
    };
    const getSeverityLabel = (severity) => {
        const labels = {
            1: "Molto basso",
            2: "Basso",
            3: "Medio",
            4: "Alto",
            5: "Critico"
        };
        return labels[severity];
    };
    if (pins.length === 0) {
        return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "Difetti Rilevati" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "text-muted-foreground mb-2", children: "Nessun difetto rilevato" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Clicca sull'immagine per aggiungere un difetto" })] }) })] }));
    }
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-lg", children: ["Difetti Rilevati (", pins.length, ")"] }) }), _jsx(CardContent, { className: "space-y-3", children: pins.map((pin, index) => {
                    const isExpanded = expandedPins.has(pin.id);
                    const isEditing = editingPin === pin.id;
                    const isSelected = selectedPin === pin.id;
                    return (_jsxs("div", { className: `border rounded-lg p-3 transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-border'}`, children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Button, { variant: "ghost", size: "sm", className: "h-auto p-0 hover:bg-transparent", onClick: () => toggleExpanded(pin.id), children: _jsxs("div", { className: "flex items-center space-x-2", children: [isExpanded ? (_jsx(ChevronDown, { className: "w-4 h-4" })) : (_jsx(ChevronRight, { className: "w-4 h-4" })), _jsxs("span", { className: "font-medium", children: ["Difetto #", index + 1] })] }) }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: `w-3 h-3 rounded-full ${SEVERITY_COLORS[pin.severity]}`, title: getSeverityLabel(pin.severity) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleEdit(pin.id), children: _jsx(Edit3, { className: "w-3 h-3" }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => onDeletePin(pin.id), className: "text-destructive hover:text-destructive", children: _jsx(Trash2, { className: "w-3 h-3" }) })] })] }), _jsxs("div", { className: "mt-2 text-sm text-muted-foreground", children: [_jsx("div", { className: "font-medium", children: pin.defect }), pin.notes && (_jsx("div", { className: "truncate mt-1", children: pin.notes }))] }), isExpanded && (_jsxs("div", { className: "mt-4 space-y-4 border-t pt-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Tipo difetto" }), isEditing ? (_jsxs(Select, { value: pin.defect, onValueChange: (value) => handleUpdateDefect(pin.id, 'defect', value), children: [_jsx(SelectTrigger, { className: "w-full", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: DEFECT_TYPES.map((type) => (_jsx(SelectItem, { value: type, children: type }, type))) })] })) : (_jsx("div", { className: "text-sm", children: pin.defect }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Gravit\u00E0" }), isEditing ? (_jsxs(Select, { value: pin.severity.toString(), onValueChange: (value) => handleUpdateDefect(pin.id, 'severity', parseInt(value)), children: [_jsx(SelectTrigger, { className: "w-full", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: [1, 2, 3, 4, 5].map((level) => (_jsx(SelectItem, { value: level.toString(), children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: `w-3 h-3 rounded-full ${SEVERITY_COLORS[level]}` }), _jsxs("span", { children: [level, " - ", getSeverityLabel(level)] })] }) }, level))) })] })) : (_jsxs("div", { className: "flex items-center space-x-2 text-sm", children: [_jsx("div", { className: `w-3 h-3 rounded-full ${SEVERITY_COLORS[pin.severity]}` }), _jsxs("span", { children: [pin.severity, " - ", getSeverityLabel(pin.severity)] })] }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Note" }), isEditing ? (_jsx(Textarea, { value: pin.notes, onChange: (e) => handleUpdateDefect(pin.id, 'notes', e.target.value), placeholder: "Aggiungi note sul difetto...", rows: 2 })) : (_jsx("div", { className: "text-sm text-muted-foreground", children: pin.notes || "Nessuna nota" }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Posizione" }), _jsxs("div", { className: "text-xs text-muted-foreground space-y-1", children: [_jsxs("div", { children: ["X: ", (pin.x * 100).toFixed(1), "%, Y: ", (pin.y * 100).toFixed(1), "%"] }), _jsxs("div", { children: ["Rotazione: ", pin.rotation_deg, "\u00B0"] })] })] }), isEditing && (_jsxs("div", { className: "flex space-x-2", children: [_jsx(Button, { size: "sm", onClick: handleSave, children: "Salva" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => setEditingPin(null), children: "Annulla" })] }))] }))] }, pin.id));
                }) })] }));
};
