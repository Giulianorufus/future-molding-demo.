import React, { useEffect, useMemo, useRef, useState } from "react";
import { getDrawingURL, revokeURL } from "@/services/db";
import { getDrawingAnalysis } from '@/services/storage';
import StepViewer from '@/components/StepViewer';
import ThreeViewer from '@/components/ThreeViewer';
import { useDrawingStore } from '@/stores/drawingStore';

type Props = { drawingId: string };

export default function DrawingPreview({ drawingId }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [type, setType] = useState<string>("");

  const modelViewerUrl = useDrawingStore((s) => s.viewerUrl ?? s.previewUrl ?? s.glbUrl);

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await getDrawingURL(drawingId);
      if (!alive) return;
      if (res) {
        setUrl(res.url);
        setType(res.type || "");
      } else {
        setUrl(null);
      }
    })();
    return () => { alive = false; if (url) revokeURL(url); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawingId]);

  const ext = useMemo(() => {
    if (!url) return "";
    try { const u = new URL(url); return (u.pathname.split(".").pop() || "").toLowerCase(); } catch { return ""; }
  }, [url]);

  if (!url) {
    if (modelViewerUrl) return <ThreeViewer viewerUrl={modelViewerUrl} />;
    return <div className="border rounded p-3 text-sm text-gray-600">Nessun file selezionato.</div>;
  }

  if (type.includes("pdf") || ext === "pdf") {
    return (
      <div className="border rounded overflow-hidden" style={{ height: 420 }}>
        <iframe title="pdf" src={url} className="w-full h-full" />
      </div>
    );
  }

  if (["stl", "glb", "gltf", "obj"].includes(ext)) {
    // use centralized ThreeViewer component
    // If a viewerUrl is set in the global model store, prefer it for preview
    if (modelViewerUrl) {
      return <ThreeViewer viewerUrl={modelViewerUrl} />;
    }
    return <ThreeViewer viewerUrl={url} />;
  }

  // Try to load analysis meshes (saved previously) and render with StepViewer
  return <AnalysisFallback drawingId={drawingId} />;
}

function AnalysisFallback({ drawingId }: { drawingId: string }) {
  const [analysis, setAnalysis] = React.useState<any | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const a = await getDrawingAnalysis(drawingId);
        if (!alive) return;
        setAnalysis(a);
      } catch (e) {
        if (!alive) return;
        setAnalysis(null);
      }
    })();
    return () => { alive = false; };
  }, [drawingId]);

  if (!analysis) return <div className="border rounded p-3 text-sm text-gray-600">Anteprima non disponibile.</div>;
  if (analysis.meshes && Array.isArray(analysis.meshes) && analysis.meshes.length > 0) {
    return <StepViewer meshes={analysis.meshes} />;
  }
  return <div className="border rounded p-3 text-sm text-gray-600">Nessuna geometria disponibile nell'analisi.</div>;

}

// ThreePreview removed; moved to `src/components/ThreeViewer.tsx`
