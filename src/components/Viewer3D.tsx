import React from "react";
import ThreeViewer from "./ThreeViewer";
import { useDrawingStore } from "@/stores/drawingStore";

const Viewer3D: React.FC = () => {
  const viewerUrl = useDrawingStore((s) => s.viewerUrl);
  const isLoading = useDrawingStore((s) => s.isLoading);
  const error = useDrawingStore((s) => s.error);

  const pins: any[] = [];
  const selectedPin = null;
  const setSelectedPin = (_: any) => {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Caricamento modello 3D…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-red-500">
        {error}
      </div>
    );
  }

  if (!viewerUrl) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Carica un disegno STEP/IGES per visualizzare il modello 3D e i difetti.
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <ThreeViewer
        viewerUrl={viewerUrl}
        pins={pins}
        selectedPinId={selectedPin ?? null}
        onSelectPin={(id: string | null) => {
          setSelectedPin(id);
        }}
      />
    </div>
  );
};

export default Viewer3D;
