import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
const DEFECTS = [
    "Riempimento incompleto", "Bruciature", "Bave", "Segni di ritiro", "Imbarcamento",
    "Linea di giunzione", "Striature (umidità)", "Vuoti/Bolle", "Jetting", "Graffi in estrazione"
];
export function DefectPicker({ open, onOpenChange, onConfirm, x, y }) {
    const [defect, setDefect] = React.useState(undefined);
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Seleziona difetto" }) }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "text-sm text-muted-foreground", children: ["Posizione selezionata: x=", x.toFixed(2), ", y=", y.toFixed(2)] }), _jsxs(Select, { onValueChange: (v) => setDefect(v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "\u2014 Scegli difetto \u2014" }) }), _jsx(SelectContent, { children: DEFECTS.map(d => _jsx(SelectItem, { value: d, children: d }, d)) })] })] }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: () => defect && onConfirm(defect), disabled: !defect, children: "Conferma" }) })] }) }));
}
