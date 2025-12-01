import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef } from "react";
import { useDrawingStore } from "@/store/drawingStore";
export default function FilePicker() {
    const inputRef = useRef(null);
    const setFile = useDrawingStore((s) => s.setFile);
    const clear = useDrawingStore((s) => s.clear);
    const file = useDrawingStore((s) => s.file);
    return (_jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx("input", { ref: inputRef, type: "file", accept: ".step,.stp,.iges,.igs,.stl,.glb,.gltf,.pdf", 
                // TRUCCO: azzera il valore prima dell'apertura, così anche lo stesso file scatena onChange
                onClick: (e) => {
                    const el = e.currentTarget;
                    el.value = "";
                }, onChange: (e) => {
                    const f = e.target.files?.[0] ?? null;
                    setFile(f); // accetta anche se è "lo stesso" file, perché l'input è stato azzerato
                } }), file ? (_jsxs(_Fragment, { children: [_jsxs("span", { className: "text-sm text-gray-600", children: ["Selezionato: ", _jsx("strong", { children: file.name })] }), _jsx("button", { type: "button", onClick: () => {
                            clear();
                            // opzionale: riapri subito il selettore
                            // inputRef.current?.click();
                        }, className: "text-sm px-3 py-1 rounded border border-gray-300 hover:bg-gray-50", children: "Rimuovi disegno" }), _jsx("button", { type: "button", onClick: () => inputRef.current?.click(), className: "text-sm px-3 py-1 rounded border border-gray-300 hover:bg-gray-50", children: "Cambia / Ricarica" })] })) : null] }));
}
