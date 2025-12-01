import React, { useEffect, useRef, useState } from "react";
import { useDrawingStore } from "@/store/drawingStore";
import { useAnalysisStore } from "@/store/analysisStore";
import { computeVolume_cm3, computeArea_cm2, computeBBox_mm, estimateThickness_mm, countConnectedComponents } from "@/utils/geoAnalysis";
import * as log from '@/lib/log';

export default function DrawingViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const file = useDrawingStore((s) => s.file);
  const url = useDrawingStore((s) => s.objectUrl);
  const setAnalysis = useAnalysisStore((s) => s.set);
  const [ext, setExt] = useState<string>("");

  useEffect(() => {
    if (!file) { setExt(""); setAnalysis({ note: undefined }); return; }
    const e = file.name.toLowerCase().split(".").pop() || "";
    setExt(e);
    if (e === "step" || e === "stp" || e === "iges" || e === "igs") {
      setAnalysis({ note: "Per analisi automatica: converti STEP/IGES in STL o GLB." });
    } else {
      setAnalysis({ note: undefined });
    }
  }, [file, setAnalysis]);

  if (!file || !url) {
    return <div className="border rounded-lg p-6 text-sm text-gray-600">Nessun disegno caricato.</div>;
  }

  if (["pdf"].includes(ext)) {
    return (
      <div className="border rounded-lg overflow-hidden" style={{ height: 520 }}>
        <iframe title="pdf" src={url} className="w-full h-full" />
        <div className="px-3 py-2 text-xs text-gray-500">Hotspot e analisi disponibili solo su STL/GLB.</div>
      </div>
    );
  }

  if (!["stl", "glb", "gltf"].includes(ext)) {
    return (
      <div className="border rounded-lg p-4 text-sm text-red-600">
        Formato .{ext} non supportato per analisi. Converti a STL/GLB.
      </div>
    );
  }

  return <ThreeAndAnalyze url={url} ext={ext} containerRef={containerRef} />;
}

function ThreeAndAnalyze({ url, ext, containerRef }: { url: string; ext: string; containerRef: React.RefObject<HTMLDivElement>; }) {
  const setAnalysis = useAnalysisStore((s) => s.set);
  
  useEffect(() => {
    if (!containerRef.current) {
      log.warn("Container ref not ready");
      return;
    }
    
    let disposed = false;
    let renderer: any = null;
    let animationId: number | null = null;
    
    (async () => {
      try {
        const THREE = await import("three");
        const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
        const { STLLoader } = await import("three/examples/jsm/loaders/STLLoader.js");
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");

        const el = containerRef.current;
        if (!el || disposed) return;
        
        const width = el.clientWidth || 880;
        const height = 520;

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Clear previous content
        el.innerHTML = "";
        el.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf5f7fb);

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
        camera.position.set(0, 0, 300);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const dl = new THREE.DirectionalLight(0xffffff, 0.9);
        dl.position.set(1, 1, 1); 
        scene.add(dl);

        let root: any;

        const animate = () => {
          if (disposed) return;
          animationId = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };

        const addAndFit = (obj: any) => {
          root = obj; 
          scene.add(obj);
          const box = new THREE.Box3().setFromObject(obj);
          const size = new THREE.Vector3(); 
          box.getSize(size);
          const center = new THREE.Vector3(); 
          box.getCenter(center);
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const target = 180;
          const scale = target / maxDim;
          obj.scale.setScalar(scale);
          obj.position.sub(center.multiplyScalar(scale));
          camera.lookAt(0, 0, 0);
        };

        const runAnalysis = (geom: any, mesh?: any) => {
          if (disposed) return;
          try {
            const volume = computeVolume_cm3(geom);
            const area = computeArea_cm2(geom);
            const bbox = computeBBox_mm(geom);
            const components = countConnectedComponents(geom);
            let thickness = { min: NaN, mean: NaN, max: NaN };
            
            if (mesh) {
              try {
                thickness = estimateThickness_mm(mesh, 300);
              } catch (e) {
                log.warn("Thickness estimation failed:", e);
              }
            }

            setAnalysis({
              volume_cm3: Math.round(volume * 100) / 100,
              area_cm2: Math.round(area * 100) / 100,
              bbox_mm: {
                x: Math.round(bbox.x * 10) / 10,
                y: Math.round(bbox.y * 10) / 10,
                z: Math.round(bbox.z * 10) / 10,
              },
              thickness_mm: thickness,
              components,
              note: "Analisi automatica completata"
            });
          } catch (e) {
            log.error("Analysis error:", e);
            setAnalysis({ note: "Errore durante l'analisi geometrica" });
          }
        };

        // Carica modello
        if (ext === "stl") {
          const loader = new STLLoader();
          loader.load(url, (geom: any) => {
            if (disposed) return;
            const mat = new THREE.MeshStandardMaterial({ color: 0x9aa6b2, metalness: 0.1, roughness: 0.7 });
            const mesh = new THREE.Mesh(geom, mat);
            addAndFit(mesh);
            runAnalysis(geom, mesh);
          }, undefined, (err: any) => {
            if (!disposed) setAnalysis({ note: `Errore caricamento STL: ${err.message}` });
          });
        } else if (ext === "glb" || ext === "gltf") {
          const loader = new GLTFLoader();
          loader.load(url, (gltf: any) => {
            if (disposed) return;
            addAndFit(gltf.scene);
            
            // Trova la prima mesh per analisi
            let firstMesh: any = null;
            gltf.scene.traverse((child: any) => {
              if (!firstMesh && child.isMesh && child.geometry) {
                firstMesh = child;
              }
            });
            
            if (firstMesh) {
              runAnalysis(firstMesh.geometry, firstMesh);
            } else {
              setAnalysis({ note: "Nessuna geometria mesh trovata nel file GLB/GLTF" });
            }
          }, undefined, (err: any) => {
            if (!disposed) setAnalysis({ note: `Errore caricamento GLB/GLTF: ${err.message}` });
          });
        }

        animate();

        const handleResize = () => {
          if (disposed || !el) return;
          const w = el.clientWidth || 880;
          const h = 520;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        window.addEventListener("resize", handleResize);
        
      } catch (error) {
        log.error("Three.js setup error:", error);
        setAnalysis({ note: "Errore nell'inizializzazione 3D" });
      }
    })();

    return () => {
      disposed = true;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (renderer) {
        renderer.dispose();
      }
      window.removeEventListener("resize", () => {});
    };
  }, [url, ext, setAnalysis, containerRef]);

  return (
    <div className="border rounded-lg overflow-hidden bg-gray-50">
      <div ref={containerRef} style={{ height: 520, width: "100%" }} />
      <div className="px-3 py-2 text-xs text-gray-500">
        Rotazione: click + trascina | Zoom: rotella mouse | Analisi automatica in corso...
      </div>
    </div>
  );
}
