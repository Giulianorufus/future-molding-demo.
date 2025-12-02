import React, { useEffect, useRef } from "react";
import { useModelStore } from "../store/modelStore";

// DEPRECATED — replaced by ThreeViewer.tsx
export default function DeprecatedViewer() {
  const viewerUrl = useModelStore((s) => s.viewerUrl);
  const file = useModelStore((s) => s.file);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const elRef = containerRef.current;

    let disposed = false;
    let renderer: any = null;
    let animationId: number | null = null;

    (async () => {
      try {
        const THREE = await import("three");
        const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
        const { STLLoader } = await import("three/examples/jsm/loaders/STLLoader.js");
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        const { OBJLoader } = await import("three/examples/jsm/loaders/OBJLoader.js");

        const el = elRef!;
        const width = el.clientWidth || 600;
        const height = el.clientHeight || 420;

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        el.innerHTML = "";
        el.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf5f7fb);

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
        camera.position.set(0, 0, 300);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        const dl = new THREE.DirectionalLight(0xffffff, 0.8);
        dl.position.set(1, 1, 1);
        scene.add(dl);

        let root: any = null;

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

        // load model from URL based on extension
        let url = viewerUrl || null;
        // Note: we keep track of decryptedUrl and revoke it on cleanup (not implemented here)
        const ext = (file?.name?.split('.').pop() || url?.split('.').pop() || '').toLowerCase();

        if (ext === "stl") {
          const loader = new STLLoader();
          loader.load(url, (geom: any) => {
            if (disposed) return;
            const mat = new THREE.MeshStandardMaterial({ color: 0x9aa6b2, metalness: 0.1, roughness: 0.7 });
            const mesh = new THREE.Mesh(geom, mat);
            addAndFit(mesh);
          }, undefined, (err: any) => {
            // ignore
          });
        } else if (ext === "glb" || ext === "gltf") {
          if (!url) {
            // nothing to load
            const div = document.createElement("div");
            div.style.padding = "12px";
            div.style.color = "#666";
            div.innerText = `Nessun viewerUrl disponibile per il modello.`;
            el.appendChild(div);
          } else {
            const loader = new GLTFLoader();
            loader.load(
              url,
              (gltf: any) => {
                if (disposed) return;
                if (!gltf || !gltf.scene) {
                  // invalid gltf content
                  console.error('[ModelViewer] GLTF caricato ma scene mancante', url, gltf);
                  const div = document.createElement("div");
                  div.style.padding = "12px";
                  div.style.color = "#666";
                  div.innerText = `Impossibile visualizzare il GLB (file corrotto o vuoto).`;
                  el.appendChild(div);
                  return;
                }
                addAndFit(gltf.scene);
              },
              undefined,
              (err: any) => {
                console.error('[ModelViewer] Errore caricamento GLB:', err, url);
                const div = document.createElement("div");
                div.style.padding = "12px";
                div.style.color = "#666";
                div.innerText = `Errore caricamento modello: ${String(err?.message ?? err)}`;
                el.appendChild(div);
              }
            );
          }
        } else if (ext === "obj") {
          const loader = new OBJLoader();
          loader.load(url, (obj: any) => {
            if (disposed) return;
            addAndFit(obj);
          });
        } else {
          // unsupported types (STEP/IGES): show simple placeholder text
          const div = document.createElement("div");
          div.style.padding = "12px";
          div.style.color = "#666";
          div.innerText = `Formato .${ext || "file"} - visualizzazione non supportata in-browser; convertire in STL/GLB`;
          el.appendChild(div);
        }

        animate();

        // (no decrypted-url cleanup required here)

        const handleResize = () => {
          if (disposed || !elRef) return;
          const el = elRef;
          const w = el.clientWidth || 600;
          const h = el.clientHeight || 420;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        window.addEventListener("resize", handleResize);

      } catch (error) {
        // silently fail and leave placeholder
      }
    })();

    return () => {
      disposed = true;
      if (animationId) cancelAnimationFrame(animationId);
      try {
        if (elRef) {
          // revoke any decrypted URL attached
          try {
            const r = (elRef as any)._revokeDecrypted;
            if (typeof r === 'function') r();
          } catch (_) {}
          elRef.innerHTML = "";
        }
      } catch (e) {}
    };
  }, [viewerUrl, file]);

        if (!viewerUrl && !file) {
    return (
      <div className="flex justify-center items-center h-full text-gray-500">
        Nessun modello caricato
      </div>
    );
  }

  return (
    <div className="flex flex-col items-stretch h-full">
      <div className="text-sm text-gray-700 mb-2">Modello: <strong>{file?.name ?? 'modello'}</strong></div>
      <div ref={containerRef} style={{ height: 420, width: '100%' }} />
    </div>
  );
}
