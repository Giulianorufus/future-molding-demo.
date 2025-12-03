import { useState } from 'react';
import { addDrawing, type DrawingMeta } from '@/services/storage';
import { saveDrawingFile, getDrawingURL } from '@/services/db';
import { useParametriStore } from '@/store/parametriStore';
import { useCadStore } from '@/store/cadStore';
import { useDrawingStore } from '@/store/drawingStore';
import { startCadPipeline } from '@/cad/cadPipeline';
import { analyzeServerFile } from '@/services/analysisService';
import { analyzeBlob } from '@/utils/simpleAnalysis';
import { sanitizeFileName } from '@/utils/sanitizeFileName';
import { useToast } from '@/components/ui/use-toast';

export function useDrawingUpload() {
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const paramStore = useParametriStore();

    // applyAnalysisToModelStore removed: we mirror analysis into parametriStore instead

    async function handleUpload(file: File): Promise<string | null> {
        if (!file) return null;
        setIsUploading(true);
        try {
            // 1. Persist file
            const meta = addDrawing({ name: file.name, size: file.size, type: file.type });
            await saveDrawingFile(meta.id, file);

            // 2. Update unified model store
            try { void useDrawingStore.getState().setFile(file); } catch (_) {}
            // 3. Set viewer URL (try to get from DB or create object URL) into parametriStore
            try {
                const urlRec = await getDrawingURL(meta.id);
                if (urlRec) {
                    useParametriStore.getState().setViewerUrl(urlRec.url);
                } else {
                    const tmp = URL.createObjectURL(file);
                    useParametriStore.getState().setViewerUrl(tmp);
                }
            } catch (_) {
                const tmp = URL.createObjectURL(file);
                useParametriStore.getState().setViewerUrl(tmp);
            }

            // 4. Update drawingStore (for AI/viewers)
            try { void useDrawingStore.getState().setFile(file); } catch (_) { }

            // 5. Start CAD pipeline
            try {
                const pipelineResult = await startCadPipeline(file);
                if (pipelineResult?.success) {
                    const cadState = useCadStore.getState();
                    // Mirror pipeline results into parametriStore
                    try {
                        const geom = {
                            volumePezzo_cm3: cadState.volumeCm3 ?? 0,
                            volumeMaterozza_cm3: 0,
                            volumeTotale_cm3: cadState.volumeCm3 ?? 0,
                            areaProiettata_cm2: cadState.areaProjCm2 ?? null,
                            spessoreMedio_mm: cadState.thicknessAvgMm ?? 2,
                        };
                        paramStore.setGeometry(geom as any);
                        useParametriStore.getState().setViewerUrl(cadState.viewerUrl ?? null);
                    } catch (_) {}

                } else {
                    // Pipeline failed or simple file: try server analysis or simple analysis
                    try {
                        // Server analysis fallback
                        const serverResult = await analyzeServerFile(file);
                        if (serverResult) {
                            const geom = {
                                volumePezzo_cm3: serverResult.volume_cm3 ?? 0,
                                volumeMaterozza_cm3: 0,
                                volumeTotale_cm3: serverResult.volume_cm3 ?? 0,
                                areaProiettata_cm2: serverResult.projectedArea_cm2 ?? null,
                                spessoreMedio_mm: serverResult.thickness_mm ?? 2,
                            };
                            paramStore.setGeometry(geom as any);
                        }
                    } catch (err) {
                        console.warn("Server analysis failed, trying local fallback", err);
                        // Local fallback
                        const res = await analyzeBlob(file);
                        if (res) {
                            const vol = res.volume_cm3 ?? null;
                            const th = res.thickness_mm?.mean ?? null;
                            const geom = {
                                volumePezzo_cm3: vol ?? 0,
                                volumeMaterozza_cm3: 0,
                                volumeTotale_cm3: vol ?? 0,
                                areaProiettata_cm2: null,
                                spessoreMedio_mm: th ?? 2,
                            };
                            paramStore.setGeometry(geom as any);
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
