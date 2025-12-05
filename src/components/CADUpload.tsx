
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { analyzeCADFile, generatePreviewThumbnail, AnalysisResult } from '@/lib/cadAnalysis';
import { mapError } from '@/lib/errors';
import ErrorModal from '@/components/ErrorModal';
import { storeAnalysisResult } from '@/services/storage';
import { useDrawingStore } from '@/stores/drawingStore';
import * as THREE from 'three';
import { toast } from '@/hooks/use-toast';
import * as log from '@/lib/log';
import { killOcct } from '@/lib/occtInit';

interface CADUploadProps {
  onAnalysisComplete: (analysis: AnalysisResult) => void;
  className?: string;
}

export function CADUpload({ onAnalysisComplete, className }: CADUploadProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalData, setErrorModalData] = useState<{title?:string;description?:string;action?:string}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
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
    setProgress(0);
    setProgressStatus('starting');

    try {
      // Analyze the CAD file (forward progress updates)
      const analysis = await analyzeCADFile(file, (st) => {
        if (typeof st.progress === 'number') setProgress(Math.round(st.progress));
        if (st.status) setProgressStatus(st.status);
      });
      
      // Generate 3D preview thumbnail if geometry or meshes are available
      try {
        let geometry: THREE.BufferGeometry | null = null;
        if ((analysis as any).geometry) {
          geometry = (analysis as any).geometry as THREE.BufferGeometry;
        } else if ((analysis as any).meshes && (analysis as any).meshes.length > 0) {
          const mesh = (analysis as any).meshes[0];
          const geom = new THREE.BufferGeometry();
          const positions = mesh.positions instanceof Float32Array ? mesh.positions : new Float32Array(mesh.positions);
          geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          if (mesh.normals) {
            const normals = mesh.normals instanceof Float32Array ? mesh.normals : new Float32Array(mesh.normals);
            geom.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
          }
          if (mesh.indices) {
            const idxArr = mesh.indices instanceof Uint32Array ? mesh.indices : new Uint32Array(mesh.indices);
            // Three.js BufferGeometry.setIndex accepts Array or BufferAttribute
            geom.setIndex(Array.from(idxArr));
          }
          geom.computeBoundingBox();
          geometry = geom;
        }

        if (geometry) {
          const thumbnail = generatePreviewThumbnail(geometry);
          setPreviewUrl(thumbnail);
          // use local variable for saving
          try {
            const saved = await storeAnalysisResult(file, analysis, thumbnail);
            if (saved && (saved as any).id) {
              toast({ title: 'Salvato localmente', description: `Disegno salvato con id ${(saved as any).id}` });
                try {
                  // set drawing store preview so viewers can load the uploaded file immediately
                  useDrawingStore.getState().setResult({ previewUrl: thumbnail });
                } catch (e) {
                  log.warn('Setting drawing store failed', e);
                }
            }
          } catch (e) {
            log.warn('Saving analysis result failed', e);
          }
        } else {
          throw new Error('No geometry available for preview');
        }
      } catch (previewError) {
        log.warn('Preview generation failed or no geometry:', previewError);
        // Fallback: simple 2D thumbnail
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
        const thumb = canvas.toDataURL('image/png');
        setPreviewUrl(thumb);
            try {
              const saved = await storeAnalysisResult(file, analysis, thumb);
              if (saved && (saved as any).id) {
                toast({ title: 'Salvato localmente', description: `Disegno salvato con id ${(saved as any).id}` });
                try {
                  useDrawingStore.getState().setResult({ previewUrl: thumb });
                } catch (e) {
                  log.warn('Setting drawing store failed', e);
                }
              }
            } catch (e) {
              log.warn('Saving analysis result failed', e);
            }
      }
      
      setAnalysisResult(analysis);
      onAnalysisComplete(analysis);
      
      toast({
        title: "✅ Analisi completata!",
        description: `File ${file.name} analizzato con successo`
      });
      
    } catch (error: any) {
      log.error('CAD analysis error:', error);
      const um = mapError(error);
      toast({
        title: um.title,
        description: um.description,
        variant: (um.variant === 'destructive' ? 'destructive' : um.variant === 'warning' ? 'warning' : 'default') as any
      });
      if (um.variant === 'destructive' || um.variant === 'warning') {
        setErrorModalData({ title: um.title, description: um.description, action: um.action });
        setErrorModalOpen(true);
      }
      // On severe errors try to free occt resources proactively
      try { killOcct(2000, 0).catch(() => {}); } catch (_) {}
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".step,.stp,.iges,.igs,.stl"
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      {!currentFile ? (
        <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
          <CardContent 
            className="flex flex-col items-center justify-center p-8 text-center cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={handleClick}
          >
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Carica disegno CAD</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Trascina qui un file STEP, IGES o STL oppure clicca per selezionare
            </p>
            <Button variant="outline" size="sm">
              Seleziona file
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Preview thumbnail */}
              <div className="flex-shrink-0">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-16 h-16 object-cover rounded border bg-muted"
                  />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* File info */}
              <div className="flex-grow min-w-0">
                <h4 className="font-medium text-sm truncate">{currentFile.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {(currentFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
                
                {/* Analysis status */}
                <div className="flex items-center gap-2 mt-2">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Analisi in corso...</span>
                        {progress > 0 ? (
                          <div className="w-40 mt-1">
                            <div className="h-2 bg-muted rounded overflow-hidden">
                              <div className="h-2 bg-primary" style={{ width: `${Math.min(100, progress)}%` }} />
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1">{progress}% • {progressStatus}</div>
                          </div>
                        ) : null}
                      </div>
                    </>
                  ) : analysisResult ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-muted-foreground">
                        Analizzato • Volume: {analysisResult.volume} cm³
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="text-xs text-destructive">
                        Errore nell'analisi
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex-shrink-0">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleClick}
                  disabled={isAnalyzing}
                >
                  Cambia
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    {/** Error modal shown for serious errors */}
    <ErrorModal
      open={errorModalOpen}
      title={errorModalData.title}
      description={errorModalData.description}
      action={errorModalData.action}
      onClose={() => setErrorModalOpen(false)}
    />
    </div>
  );
}