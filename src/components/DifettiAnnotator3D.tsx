import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

type Defect = {
  id: string;
  point: THREE.Vector3;
  defects: string[];
  note?: string;
};

const DEFECT_OPTIONS: { key: string; label: string }[] = [
  { key: "short_shot", label: "Incompletezza" },
  { key: "burn", label: "Bruciatura" },
  { key: "flash", label: "Bava" },
  { key: "sink", label: "Segno di ritiro" },
  { key: "warpage", label: "Imbarcamento" },
  { key: "weld_line", label: "Linea di saldatura" },
  { key: "splay", label: "Striature argentate" },
  { key: "voids", label: "Vuoti" },
  { key: "jetting", label: "Jetting" },
  { key: "ejection_scuff", label: "Rigature espulsione" },
];

export function DifettiAnnotator3D({ url }: { url?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const [items, setItems] = useState<Defect[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const ext = useMemo(() => {
    if (!url) return "";
    try { const u = new URL(url); return (u.pathname.split(".").pop() || "").toLowerCase(); } catch { return ""; }
  }, [url]);

  useEffect(() => {
    const container = containerRef.current!;
    const width = container.clientWidth;
    const height = 480;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
    camera.position.set(0, 0, 300);
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(1, 1, 1);
    scene.add(dir);

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
      const w = container.clientWidth; const h = 480;
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize); ro.observe(container);

    return () => { stopped = true; ro.disconnect(); controls.dispose(); renderer.dispose(); container.innerHTML = ""; };
  }, []);

  // Load model
  useEffect(() => {
    const scene = sceneRef.current; if (!scene) return;
    // clear previous
    if (modelRef.current) { scene.remove(modelRef.current); modelRef.current = null; }
    if (!url) {
      // placeholder box
      const box = new THREE.Mesh(new THREE.BoxGeometry(100, 60, 30), new THREE.MeshStandardMaterial({ color: 0x6b7280 }));
      scene.add(box); modelRef.current = box; return;
    }
    const fitAndAdd = (obj: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(obj);
      const size = new THREE.Vector3(); const center = new THREE.Vector3();
      box.getSize(size); box.getCenter(center);
      const maxDim = Math.max(size.x, size.y, size.z) || 1; const target = 180; const scale = target / maxDim;
      obj.scale.setScalar(scale); obj.position.sub(center.multiplyScalar(scale));
      scene.add(obj); modelRef.current = obj;
    };
    if (ext === "stl") { new STLLoader().load(url, (g) => fitAndAdd(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x9aa6b2 })))); return; }
    if (ext === "obj") { new OBJLoader().load(url, (o) => fitAndAdd(o)); return; }
    new GLTFLoader().load(url, (gltf) => fitAndAdd(gltf.scene));
  }, [url, ext]);

  // Picking
  useEffect(() => {
    const renderer = rendererRef.current; const scene = sceneRef.current; const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;
    const raycaster = new THREE.Raycaster();
    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const target = modelRef.current ? [modelRef.current] : scene.children;
      const hit = raycaster.intersectObjects(target, true)[0];
      if (hit) {
        const p = hit.point.clone();
        const id = Math.random().toString(36).slice(2, 9);
        setItems((prev) => [...prev, { id, point: p, defects: [] }]);
        setActiveId(id);
      }
    };
    renderer.domElement.addEventListener("click", onClick);
    return () => renderer.domElement.removeEventListener("click", onClick);
  }, []);

  const active = items.find((i) => i.id === activeId) || null;

  const toggleDefect = (key: string) => {
    if (!active) return;
    setItems((prev) => prev.map((i) => i.id !== active.id ? i : ({
      ...i,
      defects: i.defects.includes(key) ? i.defects.filter((d) => d !== key) : [...i.defects, key]
    })));
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (activeId === id) setActiveId(null);
  };

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        <div ref={containerRef} className="border rounded bg-white" style={{ height: 480 }} />
        <div className="mt-2 text-xs text-slate-600">Suggerimento: trascina per ruotare, rotellina per zoom, clic per aggiungere segnalazione.</div>
      </div>
      <div className="space-y-3">
        <div className="font-semibold">Segnalazioni ({items.length})</div>
        <div className="space-y-2 max-h-[460px] overflow-auto pr-1">
          {items.map((i) => (
            <div key={i.id} className={`border rounded p-2 ${activeId===i.id?"border-blue-500 bg-blue-50":""}`}>
              <div className="flex items-center justify-between">
                <div className="text-sm">Punto ({i.point.x.toFixed(0)},{i.point.y.toFixed(0)},{i.point.z.toFixed(0)})</div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setActiveId(i.id)}>Apri</Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(i.id)}>Rimuovi</Button>
                </div>
              </div>
              {activeId===i.id && (
                <div className="mt-2 space-y-1">
                  {DEFECT_OPTIONS.map((opt) => (
                    <label key={opt.key} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={i.defects.includes(opt.key)} onCheckedChange={() => toggleDefect(opt.key)} />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
          {items.length===0 && (
            <div className="text-sm text-slate-500">Clicca sul pezzo per aggiungere una segnalazione.</div>
          )}
        </div>
      </div>
    </div>
  );
}

