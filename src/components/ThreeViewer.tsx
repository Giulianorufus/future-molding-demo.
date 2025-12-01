import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type ThreeViewerProps = {
  viewerUrl: string | null | undefined;
};

export const ThreeViewer: React.FC<ThreeViewerProps> = ({ viewerUrl }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<string>('Idle');

  useEffect(() => {
    if (!containerRef.current) return;
    if (!viewerUrl) {
      console.warn("ThreeViewer: viewerUrl mancante, niente da caricare.");
      setStatus('No viewer');
      return;
    }

    const width = containerRef.current.clientWidth || 400;
    const height = containerRef.current.clientHeight || 300;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 150);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(50, 50, 100);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    let stop = false;
    const animate = () => {
      if (stop) return;
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    // loader GLB dinamico
    (async () => {
      try {
        console.log('ThreeViewer: starting GLTFLoader import for', viewerUrl);
        setStatus('Importing loader');
        const mod: any = await import(
          "three/examples/jsm/loaders/GLTFLoader"
        );
        const GLTFLoader = mod.GLTFLoader ?? mod.default;
        const loader = new GLTFLoader();
        console.log('ThreeViewer: loading glb from', viewerUrl);
        setStatus('Loading model');
        loader.load(
          viewerUrl,
          (gltf: any) => {
            console.log('ThreeViewer: gltf loaded', { hasScene: !!gltf?.scene });
            setStatus('Model loaded');
            const root = gltf?.scene;
            if (!root) {
              console.error("ThreeViewer: GLB senza scene.");
              setStatus('No scene in GLB');
              return;
            }

            // centra e scala
            const box = new THREE.Box3().setFromObject(root);
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            box.getSize(size);
            box.getCenter(center);
            root.position.sub(center);

            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            const scale = 80 / maxDim;
            root.scale.setScalar(scale);

            scene.add(root);
            animate();
            console.log('ThreeViewer: scene added and animation started');
            setStatus('Ready');
          },
          (xhr) => {
            try {
              const pct = xhr.loaded && xhr.total ? Math.round((xhr.loaded / xhr.total) * 100) : null;
              console.log('ThreeViewer: load progress', { loaded: xhr.loaded, total: xhr.total, pct });
              if (pct !== null) setStatus(`Loading ${pct}%`);
            } catch (e) {}
          },
          (err) => {
            console.error("ThreeViewer: errore caricando GLB", err);
            setStatus('Error loading model');
          }
        );
      } catch (err) {
        console.error("ThreeViewer: errore import GLTFLoader", err);
        setStatus('Error importing loader');
      }
    })();

    return () => {
      stop = true;
      renderer.dispose();
      containerRef.current && (containerRef.current.innerHTML = "");
    };
  }, [viewerUrl]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '320px', borderRadius: 8, overflow: 'hidden' }}>
      <div
        ref={containerRef}
        style={{ width: "100%", height: "320px" }}
      />
      <div style={{ position: 'absolute', left: 12, top: 12, padding: '6px 8px', background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 6, fontSize: 12 }}>
        {status}
      </div>
    </div>
  );
};

export default ThreeViewer;
