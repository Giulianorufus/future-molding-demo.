import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, Point, Circle, Image as FabricImage } from "fabric";
// central logger intentionally not used here to keep this lightweight; other modules use '@/lib/log'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Move, ZoomIn, Download, FlipHorizontal } from "lucide-react";
import { DefectsList } from "./DefectsList";
import { useDefectsStore, type DefectPin } from "@/store/defectsStore";

interface InteractiveCanvasProps {
  frontImage?: string;
  backImage?: string;
}

export const InteractiveCanvas = ({ frontImage, backImage }: InteractiveCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [currentFace, setCurrentFace] = useState<"front" | "back">("front");
  const [currentRotation, setCurrentRotation] = useState<0 | 90 | 180 | 270>(0);
  // Use centralized defects store instead of local state
  const pins = useDefectsStore((s) => s.pins);
  const selectedPin = useDefectsStore((s) => s.selectedPin);
  const addPinToStore = useDefectsStore((s) => s.addPin);
  const updatePinInStore = useDefectsStore((s) => s.updatePin);
  const removePinFromStore = useDefectsStore((s) => s.removePin);
  const setSelectedPin = useDefectsStore((s) => s.setSelectedPin);

  // Immagini placeholder
  const defaultFrontImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='200' y='150' text-anchor='middle' fill='%23666' font-size='16'%3EFRONTE%3C/text%3E%3C/svg%3E";
  const defaultBackImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ctext x='200' y='150' text-anchor='middle' fill='%23666' font-size='16'%3ERETRO%3C/text%3E%3C/svg%3E";

  const currentImage = currentFace === "front" 
    ? (frontImage || defaultFrontImage)
    : (backImage || defaultBackImage);

  // Inizializza il canvas
  useEffect(() => {
    if (!canvasRef.current) return;

      const canvas = new FabricCanvas(canvasRef.current as HTMLCanvasElement, {
        width: 600,
        height: 400,
        backgroundColor: "#ffffff",
      });

    // Abilita zoom e pan
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.5) zoom = 0.5;
  canvas.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Pan con drag
    let isDragging = false;
    let selection = false;

    canvas.on('mouse:down', (opt) => {
      const evt = opt.e;
      if (evt.altKey === true) {
        isDragging = true;
        selection = false;
        canvas.defaultCursor = 'grab';
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (isDragging) {
        const vpt = canvas.viewportTransform!;
        const clientX = 'clientX' in opt.e ? opt.e.clientX : 0;
        const clientY = 'clientY' in opt.e ? opt.e.clientY : 0;
        vpt[4] += clientX - (opt.e as any).lastClientX;
        vpt[5] += clientY - (opt.e as any).lastClientY;
        canvas.requestRenderAll();
      }
      const clientX = 'clientX' in opt.e ? opt.e.clientX : 0;
      const clientY = 'clientY' in opt.e ? opt.e.clientY : 0;
      (opt.e as any).lastClientX = clientX;
      (opt.e as any).lastClientY = clientY;
    });

    canvas.on('mouse:up', () => {
      canvas.setViewportTransform(canvas.viewportTransform!);
      isDragging = false;
      selection = true;
      canvas.defaultCursor = 'default';
    });

    // Click per aggiungere pin
    canvas.on('mouse:down', (opt) => {
      if (!opt.e.altKey && !isDragging) {
        const pointer = canvas.getPointer(opt.e);
        addPin(pointer.x, pointer.y);
      }
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carica immagine nel canvas
  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.clear();
    
    // Carica l'immagine corrente usando Fabric.js API
    // fabric.Image.fromURL uses a callback-style API
    // Use Fabric's callback-style image loader
    (FabricImage as any).fromURL(
      currentImage,
      (fabricImage: any) => {
        if (!fabricImage) return;
        fabricImage.set({
          left: 50,
          top: 50,
          scaleX: 0.8,
          scaleY: 0.8,
          selectable: false,
          evented: false,
          angle: currentRotation,
        });

        fabricCanvas.add(fabricImage);
        fabricCanvas.centerObject(fabricImage);

        // Aggiungi i pin per la faccia corrente
        renderPins();
        fabricCanvas.renderAll();
      },
      { crossOrigin: 'anonymous' }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricCanvas, currentImage, currentRotation]);

  // Funzione per aggiungere un pin
  const addPin = useCallback((canvasX: number, canvasY: number) => {
    if (!fabricCanvas) return;

    // Trova l'immagine nel canvas
  const imageObj = fabricCanvas.getObjects().find(obj => obj.type === 'image') as any as FabricImage | undefined;
  if (!imageObj) return;

  // Converti coordinate canvas in coordinate immagine normalizzate
  const imageLeft = (imageObj.left as number) || 0;
  const imageTop = (imageObj.top as number) || 0;
  const imageWidth = (imageObj.width || 1) * (imageObj.scaleX || 1);
  const imageHeight = (imageObj.height || 1) * (imageObj.scaleY || 1);

    // Coordinate relative all'immagine (0-1)
    const x = Math.max(0, Math.min(1, (canvasX - imageLeft) / imageWidth));
    const y = Math.max(0, Math.min(1, (canvasY - imageTop) / imageHeight));

    const newPinPayload: Omit<DefectPin, 'id'> = {
      face: currentFace,
      x,
      y,
      rotation_deg: currentRotation,
      defect: "Linee di flusso",
      severity: 3,
      notes: "",
    };

    addPinToStore(newPinPayload);
  }, [fabricCanvas, currentFace, currentRotation]);

  // Renderizza i pin sul canvas
  const renderPins = useCallback(() => {
    if (!fabricCanvas) return;

    // Rimuovi i pin esistenti
    const objects = fabricCanvas.getObjects();
    objects.forEach(obj => {
      if (obj.type === 'circle' && (obj as any).isPin) {
        fabricCanvas.remove(obj);
      }
    });

    // Trova l'immagine
    const imageObj = fabricCanvas.getObjects().find(obj => obj.type === 'image');
    if (!imageObj) return;

    const imageLeft = imageObj.left || 0;
    const imageTop = imageObj.top || 0;
    const imageWidth = (imageObj.width || 1) * (imageObj.scaleX || 1);
    const imageHeight = (imageObj.height || 1) * (imageObj.scaleY || 1);

    // Aggiungi pin per la faccia corrente
    pins
      .filter(pin => pin.face === currentFace)
      .forEach(pin => {
        const pinX = imageLeft + pin.x * imageWidth;
        const pinY = imageTop + pin.y * imageHeight;

        const circle = new Circle({
          left: pinX - 8,
          top: pinY - 8,
          radius: 8,
          fill: pin.severity <= 2 ? '#22c55e' : pin.severity <= 3 ? '#f59e0b' : '#ef4444',
          stroke: selectedPin === pin.id ? '#3b82f6' : '#ffffff',
          strokeWidth: 2,
          selectable: false,
          evented: false,
        });

        (circle as any).isPin = true;
        (circle as any).pinId = pin.id;
        
        fabricCanvas.add(circle);
      });

    fabricCanvas.renderAll();
  }, [fabricCanvas, pins, currentFace, selectedPin]);

  // Re-render pins quando cambiano
  useEffect(() => {
    renderPins();
  }, [renderPins]);

  // Funzioni di controllo
  const handleRotate = () => {
    const newRotation = ((currentRotation + 90) % 360) as 0 | 90 | 180 | 270;
    setCurrentRotation(newRotation);
  };

  const handleReset = () => {
    if (fabricCanvas) {
      fabricCanvas.setZoom(1);
      fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      setCurrentRotation(0);
    }
  };

  const handleFlipFace = () => {
    setCurrentFace(prev => prev === "front" ? "back" : "front");
  };

  const handleExportJSON = () => {
    const exportData = {
      front: pins.filter(p => p.face === "front"),
      back: pins.filter(p => p.face === "back"),
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `difetti_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUpdatePin = (pinId: string, updates: Partial<DefectPin>) => {
    updatePinInStore(pinId, updates);
  };

  const handleDeletePin = (pinId: string) => {
    removePinFromStore(pinId);
    if (selectedPin === pinId) {
      setSelectedPin(null);
    }
  };

  const currentFacePins = pins.filter(pin => pin.face === currentFace);

  return (
    <div className="space-y-4">
      {/* Controlli */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Canvas Interattivo</span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                Vista: {currentFace === "front" ? "Fronte" : "Retro"}
              </Badge>
              <Badge variant="outline">
                {currentFacePins.length} difetti
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={handleFlipFace}>
              <FlipHorizontal className="w-4 h-4 mr-2" />
              Vista: {currentFace === "front" ? "Fronte" : "Retro"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Ruota 90°
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <Move className="w-4 h-4 mr-2" />
              Reset vista
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              <Download className="w-4 h-4 mr-2" />
              Esporta difetti (JSON)
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Click sull'immagine per aggiungere un difetto. Alt+Drag per spostare, rotella per zoom.
          </p>
        </CardContent>
      </Card>

      {/* Canvas e Lista */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              <div className="border border-border rounded-lg overflow-hidden">
                <canvas ref={canvasRef} className="max-w-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista Difetti */}
        <div className="lg:col-span-1">
          <DefectsList
            pins={currentFacePins}
            selectedPin={selectedPin}
            onSelectPin={setSelectedPin}
            onUpdatePin={handleUpdatePin}
            onDeletePin={handleDeletePin}
          />
        </div>
      </div>
    </div>
  );
};
