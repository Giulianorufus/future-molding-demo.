import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { getDrawingURL, revokeURL } from "@/services/db";
import { getDrawingAnalysis } from '@/services/storage';
import StepViewer from '@/components/StepViewer';

type Props = { drawingId: string };

export default function DrawingPreview({ drawingId }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [type, setType] = useState<string>("");

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

  if (!url) return <div className="border rounded p-3 text-sm text-gray-600">Nessun file selezionato.</div>;

  if (type.includes("pdf") || ext === "pdf") {
    return (
      <div className="border rounded overflow-hidden" style={{ height: 420 }}>
        <iframe title="pdf" src={url} className="w-full h-full" />
      </div>
    );
  }

  if (["stl", "glb", "gltf", "obj"].includes(ext)) {
    return <ThreePreview url={url} ext={ext} />;
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

function ThreePreview({ url, ext }: { url: string; ext: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const objectRef = useRef<THREE.Object3D | null>(null);

  useEffect(() => {
    const container = containerRef.current!;
    const width = container.clientWidth;
    const height = 420;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
    camera.position.set(0, 0, 300);
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(1, 1, 1);
    scene.add(ambient, dir);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
    controlsRef.current = controls;

    let stopped = false;
    const animate = () => {
      if (stopped) return;
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth;
      const h = 420;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    return () => {
      stopped = true;
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      container.innerHTML = "";
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    // Clear previous object
    if (objectRef.current) {
      scene.remove(objectRef.current);
      objectRef.current.traverse?.((n: any) => {
        if (n.isMesh) {
          n.geometry?.dispose?.();
          n.material?.dispose?.();
        }
      });
      objectRef.current = null;
    }
    const mat = new THREE.MeshStandardMaterial({ color: 0x9aa6b2, metalness: 0.1, roughness: 0.7 });

    const fitAndAdd = (obj: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(obj);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const target = 180;
      const scale = target / maxDim;
      obj.scale.setScalar(scale);
      obj.position.sub(center.multiplyScalar(scale));
      scene.add(obj);
      objectRef.current = obj;
    };

    if (ext === "stl") {
      new STLLoader().load(url, (geom) => {
        const mesh = new THREE.Mesh(geom, mat);
        fitAndAdd(mesh);
      });
      return;
    }
    if (ext === "obj") {
      new OBJLoader().load(url, (obj) => {
        fitAndAdd(obj);
      });
      return;
    }
    // glb/gltf
    new GLTFLoader().load(url, (gltf) => {
      fitAndAdd(gltf.scene);
    });
  }, [url, ext]);

  return <div ref={containerRef} className="border rounded overflow-hidden" style={{ height: 420 }} />;
}
