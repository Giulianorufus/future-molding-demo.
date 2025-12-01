import React, { useEffect, useRef } from "react";
import * as THREE from "three";
// Evitiamo import statico di `OrbitControls` per non importare ESM nelle suite Jest.
let _OrbitControls: any = null;
function getOrbitControls() {
  if (_OrbitControls) return _OrbitControls;
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("three/examples/jsm/controls/OrbitControls");
  _OrbitControls = mod?.OrbitControls ?? mod?.default ?? null;
  return _OrbitControls;
}

interface Viewer3DProps {
  modelUrl: string | null; // ObjectURL o path pubblico
  background?: string;
}

export default function Viewer3D({ modelUrl, background = "#091623" }: Viewer3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any | null>(null);
  const meshRef = useRef<THREE.Mesh | THREE.Group | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(background);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
    camera.position.set(0, 0, 200);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);

    const light1 = new THREE.DirectionalLight(0xffffff, 1);
    light1.position.set(100, 100, 100);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
    light2.position.set(-100, -50, -100);
    scene.add(light2);

    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);

    const Controls = getOrbitControls();
    if (Controls) {
      const controls = new Controls(camera, renderer.domElement);
      controlsRef.current = controls;
    } else {
      controlsRef.current = null;
    }

    const animate = () => {
      requestAnimationFrame(animate);
      if (controlsRef.current && typeof controlsRef.current.update === 'function') controlsRef.current.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      try {
        if (controlsRef.current && typeof controlsRef.current.dispose === 'function') controlsRef.current.dispose();
      } catch (_) {}
      try {
        if (rendererRef.current) {
          rendererRef.current.dispose();
          if (rendererRef.current.domElement && rendererRef.current.domElement.remove) {
            rendererRef.current.domElement.remove();
          }
        }
      } catch (_) {}
    };
  }, [background]);

  // Caricamento modello (solo STL/GLB tramite loader three standard)
  useEffect(() => {
    if (!modelUrl || !sceneRef.current) return;

    // Qui NON ricarico loader: uso GLTFLoader/STLLoader come nel modulo CAD se vuoi
    // Per semplicità, assumiamo GLTF loader. Puoi adattare a seconda dell'estensione.

    // Questo blocco lo puoi specializzare dopo.
    // Per ora, il Viewer3D può essere collegato al modulo CAD che ha già creato una mesh
    // e salvato in uno store (più pulito). Qui restiamo generici.

  }, [modelUrl]);

  return (
    <div
      ref={containerRef}
      className="w-full h-80 rounded-lg border border-yellow-500 overflow-hidden"
    />
  );
}
