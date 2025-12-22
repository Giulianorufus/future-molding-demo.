import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { analyzeCADFile } from '@/lib/cadAnalysis';
import { warn as logWarn, error as logError } from '@/lib/log';
import { toast } from '@/hooks/use-toast';
export function CADUpload({ onAnalysisComplete, className }) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [currentFile, setCurrentFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [analysisResult, setAnalysisResult] = useState(null);
    const fileInputRef = useRef(null);
    const handleFileSelect = async (file) => {
        const validExtensions = ['.step', '.stp', '.iges', '.igs', '.stl'];
        const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (!validExtensions.includes(fileExt)) {
            toast({
                title: "Formato non supportato",
                description: "Carica un file STEP, IGES o STL",
                variant: "destructive"
            });
            return;
        }
        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            toast({
                title: "File troppo grande",
                description: "Il file deve essere inferiore a 50MB",
                variant: "destructive"
            });
            return;
        }
        setCurrentFile(file);
        setIsAnalyzing(true);
        setPreviewUrl('');
        setAnalysisResult(null);
        try {
            // Analyze the CAD file
            const analysis = await analyzeCADFile(file);
            // Generate 3D preview thumbnail if geometry is available
            if (fileExt === '.stl' && analysis.geometry) {
                try {
                    const { generatePreviewThumbnail } = await import('@/lib/cadAnalysis');
                    const thumbnail = generatePreviewThumbnail(analysis.geometry);
                    setPreviewUrl(thumbnail);
                }
                catch (previewError) {
                    logWarn('Preview generation failed:', previewError);
                    setPreviewUrl('/placeholder.svg');
                }
            }
            else {
                // For STEP/IGES files or when geometry is not available, show a generic 3D icon
                const canvas = document.createElement('canvas');
                canvas.width = 64;
                canvas.height = 64;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = '#f1f5f9';
                    ctx.fillRect(0, 0, 64, 64);
                    ctx.fillStyle = '#0057b7';
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('CAD', 32, 40);
                }
                setPreviewUrl(canvas.toDataURL('image/png'));
            }
            setAnalysisResult(analysis);
            onAnalysisComplete(analysis);
            toast({
                title: "✅ Analisi completata!",
                description: `File ${file.name} analizzato con successo`
            });
        }
        catch (error) {
            logError('CAD analysis error:', error);
            toast({
                title: "Errore nell'analisi",
                description: error.message || "Impossibile analizzare il file CAD",
                variant: "destructive"
            });
        }
        finally {
            setIsAnalyzing(false);
        }
    };
    const handleDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };
    const handleDragOver = (e) => {
        e.preventDefault();
    };
    const handleClick = () => {
        fileInputRef.current?.click();
    };
    const handleFileInputChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };
    return (_jsxs("div", { className: className, children: [_jsx("input", { ref: fileInputRef, type: "file", accept: ".step,.stp,.iges,.igs,.stl", onChange: handleFileInputChange, className: "hidden" }), !currentFile ? (_jsx(Card, { className: "border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors", children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center p-8 text-center cursor-pointer", onDrop: handleDrop, onDragOver: handleDragOver, onClick: handleClick, children: [_jsx(Upload, { className: "h-12 w-12 text-muted-foreground mb-4" }), _jsx("h3", { className: "text-lg font-semibold mb-2", children: "Carica disegno CAD" }), _jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "Trascina qui un file STEP, IGES o STL oppure clicca per selezionare" }), _jsx(Button, { variant: "outline", size: "sm", children: "Seleziona file" })] }) })) : (_jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "flex-shrink-0", children: previewUrl ? (_jsx("img", { src: previewUrl, alt: "Preview", className: "w-16 h-16 object-cover rounded border bg-muted" })) : (_jsx("div", { className: "w-16 h-16 bg-muted rounded border flex items-center justify-center", children: _jsx(FileText, { className: "h-8 w-8 text-muted-foreground" }) })) }), _jsxs("div", { className: "flex-grow min-w-0", children: [_jsx("h4", { className: "font-medium text-sm truncate", children: currentFile.name }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [(currentFile.size / (1024 * 1024)).toFixed(1), " MB"] }), _jsx("div", { className: "flex items-center gap-2 mt-2", children: isAnalyzing ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 animate-spin text-primary" }), _jsx("span", { className: "text-xs text-muted-foreground", children: "Analisi in corso..." })] })) : analysisResult ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "h-4 w-4 text-green-500" }), _jsxs("span", { className: "text-xs text-muted-foreground", children: ["Analizzato \u2022 Volume: ", analysisResult.volume, " cm\u00B3"] })] })) : (_jsxs(_Fragment, { children: [_jsx(AlertCircle, { className: "h-4 w-4 text-destructive" }), _jsx("span", { className: "text-xs text-destructive", children: "Errore nell'analisi" })] })) })] }), _jsx("div", { className: "flex-shrink-0", children: _jsx(Button, { variant: "outline", size: "sm", onClick: handleClick, disabled: isAnalyzing, children: "Cambia" }) })] }) }) }))] }));
}
