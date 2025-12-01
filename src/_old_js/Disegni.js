import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// Sample mechanical drawings for realistic testing
const mockDrawings = [
    { id: 1, filename: "working-drawings-example.pdf", size: "2.8 MB", uploadDate: "2024-01-15", type: "PDF" },
    { id: 2, filename: "engineering-drawing-basics-nasa.pdf", size: "1.5 MB", uploadDate: "2024-01-15", type: "PDF" },
    { id: 3, filename: "Supporto_motore.step", size: "1.8 MB", uploadDate: "2024-01-14", type: "STEP" },
    { id: 4, filename: "Cuscinetto_radiale.dwg", size: "956 KB", uploadDate: "2024-01-13", type: "DWG" },
];
export default function Disegni() {
    const [drawings, setDrawings] = useState(() => {
        const saved = localStorage.getItem('future-molding-drawings');
        return saved ? JSON.parse(saved) : mockDrawings;
    });
    const { toast } = useToast();
    // Save to localStorage whenever drawings change
    const updateDrawings = (newDrawings) => {
        setDrawings(newDrawings);
        localStorage.setItem('future-molding-drawings', JSON.stringify(newDrawings));
    };
    const handleFileUpload = (event) => {
        const files = event.target.files;
        if (files) {
            Array.from(files).forEach((file) => {
                const newDrawing = {
                    id: Date.now() + Math.random(),
                    filename: file.name,
                    size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                    uploadDate: new Date().toISOString().split('T')[0],
                    type: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN'
                };
                updateDrawings([newDrawing, ...drawings]);
            });
            toast({
                title: "File caricati con successo",
                description: `${files.length} disegno${files.length > 1 ? 'i' : ''} aggiunt${files.length > 1 ? 'i' : 'o'} alla libreria`,
            });
        }
    };
    const handleDelete = (id) => {
        updateDrawings(drawings.filter(d => d.id !== id));
        toast({
            title: "Disegno eliminato",
            description: "Il file è stato rimosso dalla libreria",
        });
    };
    const handlePreview = (drawing) => {
        if (drawing.type === 'PDF') {
            // Open real PDF files for testing
            if (drawing.filename === 'working-drawings-example.pdf') {
                window.open('/sample-drawings/working-drawings-example.pdf', '_blank');
            }
            else if (drawing.filename === 'engineering-drawing-basics-nasa.pdf') {
                window.open('/sample-drawings/engineering-drawing-basics-nasa.pdf', '_blank');
            }
            else {
                toast({
                    title: "Anteprima disponibile",
                    description: `Apertura di ${drawing.filename}...`,
                });
            }
        }
        else {
            toast({
                title: "Anteprima non disponibile",
                description: "L'anteprima è disponibile solo per i file PDF",
                variant: "destructive"
            });
        }
    };
    return (_jsxs("div", { className: "space-y-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-foreground mb-2", children: "Gestione Disegni" }), _jsx("p", { className: "text-muted-foreground", children: "Carica e gestisci i tuoi disegni tecnici (PDF, DXF, DWG, STEP, IGES)" })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Upload, { className: "w-5 h-5 mr-2 text-primary" }), "Carica Nuovo Disegno"] }), _jsx(CardDescription, { children: "Formati supportati: PDF, DXF, DWG, STEP, STP, IGS, IGES" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "border-2 border-dashed border-border rounded-lg p-8 text-center", children: [_jsx("input", { type: "file", id: "file-upload", multiple: true, accept: ".pdf,.dxf,.dwg,.step,.stp,.igs,.iges", onChange: handleFileUpload, className: "hidden" }), _jsxs("label", { htmlFor: "file-upload", className: "cursor-pointer flex flex-col items-center space-y-2", children: [_jsx("div", { className: "w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center", children: _jsx(Upload, { className: "w-6 h-6 text-primary" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: "Clicca per caricare i file" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "o trascina qui i tuoi disegni" })] })] })] }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { children: ["Disegni Caricati (", drawings.length, ")"] }), _jsx(CardDescription, { children: "I tuoi disegni tecnici pronti per l'uso" })] }), _jsx(CardContent, { children: drawings.length === 0 ? (_jsxs("div", { className: "text-center py-8 text-muted-foreground", children: [_jsx(FileText, { className: "w-12 h-12 mx-auto mb-4 opacity-50" }), _jsx("p", { children: "Nessun disegno caricato" }), _jsx("p", { className: "text-sm", children: "Carica il primo disegno per iniziare" })] })) : (_jsx("div", { className: "space-y-4", children: drawings.map((drawing) => (_jsxs("div", { className: "flex items-center justify-between p-4 bg-muted/30 rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center", children: _jsx(FileText, { className: "w-5 h-5 text-primary" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: drawing.filename }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [drawing.type, " \u2022 ", drawing.size, " \u2022 ", drawing.uploadDate] })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => handlePreview(drawing), disabled: drawing.type !== 'PDF', children: _jsx(Eye, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleDelete(drawing.id), className: "text-destructive hover:text-destructive", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }, drawing.id))) })) })] })] }));
}
