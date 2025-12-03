import React from "react";
import ThreeViewer from "./ThreeViewer";
import useDrawingStore from "@/store/drawingStore";
import { useDefectsStore } from "@/store/defectsStore";

const Viewer3D: React.FC = () => {
  const glbUrl = useDrawingStore((s) => s.glbUrl);
  const isLoading = useDrawingStore((s) => s.isLoading);
  const error = useDrawingStore((s) => s.error);

  const pins = useDefectsStore((s) => s.pins);
  const selectedPin = useDefectsStore((s) => s.selectedPin);
  const setSelectedPin = useDefectsStore((s) => s.setSelectedPin);

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

  if (!glbUrl) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Carica un disegno STEP/IGES per visualizzare il modello 3D e i difetti.
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <ThreeViewer
        glbUrl={glbUrl}
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
