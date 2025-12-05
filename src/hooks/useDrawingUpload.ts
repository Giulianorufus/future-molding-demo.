import { useState } from 'react';
import { addDrawing, type DrawingMeta } from '@/services/storage';
import { saveDrawingFile, getDrawingURL } from '@/services/db';
import { useDrawingStore } from '@/stores/drawingStore';
import { startCadPipeline } from '@/cad/cadPipeline';
import { analyzeServerFile } from '@/services/analysisService';
import { analyzeBlob } from '@/utils/simpleAnalysis';
import { sanitizeFileName } from '@/utils/sanitizeFileName';
import { useToast } from '@/components/ui/use-toast';

export function useDrawingUpload() {
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    // NOTE: parametriStore should react to drawing/press/material changes via subscription.
    // Avoid calling paramStore.ricalcola() from UI/hooks — orchestration lives in `parametriStore`.

    // applyAnalysisToModelStore removed: we mirror analysis into parametriStore instead

    async function handleUpload(file: File): Promise<string | null> {
        if (!file) return null;
        setIsUploading(true);
        try {
            // 1. Persist file
            const meta = addDrawing({ name: file.name, size: file.size, type: file.type });
            await saveDrawingFile(meta.id, file);

            // 2. Update unified model store
            try { useDrawingStore.getState().setResult({ previewUrl: URL.createObjectURL(file) }); } catch (_) {}
            // 3. Set viewer URL (try to get from DB or create object URL) into parametriStore
            try {
                const urlRec = await getDrawingURL(meta.id);
                if (urlRec) {
                    useDrawingStore.getState().setResult({ previewUrl: urlRec.url });
                } else {
                    const tmp = URL.createObjectURL(file);
                    useDrawingStore.getState().setResult({ previewUrl: tmp });
                }
            } catch (_) {
                const tmp = URL.createObjectURL(file);
                useDrawingStore.getState().setResult({ previewUrl: tmp });
            }

            // 4. Update drawingStore (for AI/viewers)
            try { useDrawingStore.getState().setResult({ previewUrl: URL.createObjectURL(file) }); } catch (_) { }

            // 5. Start CAD pipeline
            try {
                const pipelineResult = await startCadPipeline(file);
                const res = (pipelineResult as any).result ?? pipelineResult;
                if (pipelineResult?.success) {
                    // Use pipelineResult.result to populate drawingStore and trigger parametri calc
                    try {
                        const vol = res?.volumeCm3 ?? res?.volume ?? null;
                        useDrawingStore.getState().setResult({
                            volumeCm3: vol ?? null,
                            previewUrl: res?.viewerUrl ?? res?.url ?? null,
                            surfaceCm2: res?.areaApproxCm2 ?? null,
                            boundingBox: res?.bbox ?? null,
                        });

                        // Orchestration will react to drawingStore changes; do not call ricalcola() here.
                    } catch (_) {}
                } else {
                    // Pipeline failed or simple file: try server analysis or simple analysis
                    try {
                        // Server analysis fallback
                        const serverResult = await analyzeServerFile(file);
                        if (serverResult) {
                            const vol = serverResult.volume_cm3 ?? null;
                            useDrawingStore.getState().setResult({
                                volumeCm3: vol ?? 0,
                                surfaceCm2: serverResult.projectedArea_cm2 ?? null,
                                previewUrl: null,
                                boundingBox: null,
                            });
                            // Orchestration will react to drawingStore changes; do not call ricalcola() here.
                        }
                    } catch (err) {
                        console.warn("Server analysis failed, trying local fallback", err);
                        // Local fallback
                        const res = await analyzeBlob(file);
                        if (res) {
                            const vol = (res as any).volume_cm3 ?? null;
                            const th = (res as any).thickness_mm?.mean ?? null;
                            useDrawingStore.getState().setResult({
                                volumeCm3: vol ?? 0,
                                surfaceCm2: null,
                                previewUrl: null,
                                boundingBox: null,
                            });
                            // Orchestration will react to drawingStore changes; do not call ricalcola() here.
                        }
                    }
                }
            } catch (err) {
                console.error('Pipeline error:', err);
            }

            toast({ title: "Disegno caricato", description: `${file.name} pronto` });
            return meta.id;
        } catch (err) {
            console.error(err);
            toast({ title: "Errore caricamento", description: String(err), variant: "destructive" });
            return null;
        } finally {
            setIsUploading(false);
        }
    }

    return { handleUpload, isUploading };
}
