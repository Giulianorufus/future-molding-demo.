import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
type DefectPin = { id: string; x?: number; y?: number; defect?: string; severity?: number }

export type ThreeViewerProps = {
  viewerUrl?: string | null;
  pins?: DefectPin[];
  selectedPinId?: string | null;
  selectedPin?: { x: number; y: number; z: number } | null;
  onSelectPin?: (id: string | null) => void;
};

export const ThreeViewer: React.FC<ThreeViewerProps> = ({ viewerUrl, pins, selectedPinId, selectedPin, onSelectPin }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<string>("Idle");
  const effectiveUrl = viewerUrl ?? null;

  useEffect(() => {
    if (!containerRef.current) return;
    if (!effectiveUrl) {
      console.warn("ThreeViewer: url mancante, niente da caricare.");
      setStatus("No viewer");
      return;
    }

    const width = containerRef.current.clientWidth || 400;
    const height = containerRef.current.clientHeight || 300;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 150);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0xf5f5f5, 1);
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(50, 50, 100);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    let stop = false;
    let controls: any = null;
    const animate = () => {
      if (stop) return;
      requestAnimationFrame(animate);
      controls?.update?.();
      renderer.render(scene, camera);
    };

    (async () => {
      try {
        setStatus("Importing loader");
        const [loaderMod, controlsMod]: any[] = await Promise.all([
          import("three/examples/jsm/loaders/GLTFLoader"),
          import("three/examples/jsm/controls/OrbitControls"),
        ]);
        const GLTFLoader = loaderMod.GLTFLoader ?? loaderMod.default;
        const OrbitControls = controlsMod.OrbitControls ?? controlsMod.default;
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.enablePan = true;
        controls.enableZoom = true;
        controls.enableRotate = true;
        const loader = new GLTFLoader();
        setStatus("Loading model");
        loader.load(
          effectiveUrl as string,
          (gltf: any) => {
            setStatus("Model loaded");
            const root = gltf?.scene;
            if (!root) {
              console.error("ThreeViewer: GLB senza scene.");
              setStatus("No scene in GLB");
              return;
            }

            // CAD exports can contain materials that are technically valid GLTF
            // but render black/invisible in the simple viewer. Use a neutral,
            // double-sided material so the actual geometry is always visible.
            root.traverse((obj: any) => {
              if (obj?.isMesh) {
                obj.visible = true;
                obj.frustumCulled = false;
                obj.material = new THREE.MeshStandardMaterial({
                  color: 0xb8c4d1,
                  roughness: 0.72,
                  metalness: 0.05,
                  side: THREE.DoubleSide,
                });
              }
            });

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

            // Fit the camera to the converted model and orbit around its center.
            const fittedSize = maxDim * scale;
            const distance = fittedSize / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
            camera.near = Math.max(0.01, distance / 100);
            camera.far = Math.max(1000, distance * 100);
            camera.position.set(distance * 0.75, distance * 0.55, distance * 1.15);
            camera.lookAt(0, 0, 0);
            camera.updateProjectionMatrix();
            controls?.target?.set(0, 0, 0);
            controls?.update?.();

            // If a selectedPin is provided, add a simple marker sphere to the scene
            if (selectedPin) {
              try {
                const marker = new THREE.Mesh(
                  new THREE.SphereGeometry(2, 16, 16),
                  new THREE.MeshBasicMaterial({ color: 0xffcc00 })
                );
                marker.position.set(selectedPin.x, selectedPin.y, selectedPin.z);
                scene.add(marker);
              } catch (e) {
                // defensive: don't break rendering on marker issues
                console.error('ThreeViewer: marker error', e);
              }
            }
            animate();
            setStatus("Ready");
          },
          (xhr) => {
            try {
              const pct = xhr.loaded && xhr.total ? Math.round((xhr.loaded / xhr.total) * 100) : null;
              if (pct !== null) setStatus(`Loading ${pct}%`);
            } catch (e) {}
          },
          (err) => {
            console.error("ThreeViewer: errore caricando GLB", err);
            setStatus("Error loading model");
          }
        );
      } catch (err) {
        console.error("ThreeViewer: errore import GLTFLoader", err);
        setStatus("Error importing loader");
      }
    })();

    return () => {
      stop = true;
      controls?.dispose?.();
      renderer.dispose();
      renderer.forceContextLoss?.();
      containerRef.current && (containerRef.current.innerHTML = "");
    };
  }, [effectiveUrl, selectedPin]);

  return (
    <div style={{ position: "relative", width: "100%", height: "320px", borderRadius: 8, overflow: "hidden" }}>
      <div ref={containerRef} style={{ width: "100%", height: "320px" }} />
      <div style={{ position: "absolute", left: 12, top: 12, padding: "6px 8px", background: "rgba(0,0,0,0.6)", color: "#fff", borderRadius: 6, fontSize: 12 }}>
        {status}
      </div>
    </div>
  );
};

export default ThreeViewer;
