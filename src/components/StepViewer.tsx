import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type MeshData = { positions: number[] | Float32Array; indices?: number[] | Uint32Array; normals?: number[] | Float32Array };

interface Props {
  meshes?: MeshData[] | null;
  className?: string;
  height?: number;
}

export default function StepViewer({ meshes, className, height = 420 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const [wireframe, setWireframe] = useState(false);

  useEffect(() => {
    const container = containerRef.current!;
    const w = container.clientWidth || 400;
    const h = height;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 5000);
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

    groupRef.current = new THREE.Group();
    scene.add(groupRef.current);

    let stopped = false;
    const animate = () => {
      if (stopped) return;
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const ww = container.clientWidth || 400;
      renderer.setSize(ww, height);
      camera.aspect = ww / height;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    return () => {
      stopped = true;
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [height]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const group = groupRef.current!;
    // clear
    group.clear();

    if (!meshes || meshes.length === 0) return;

    const mat = new THREE.MeshStandardMaterial({ color: 0x9aa6b2, metalness: 0.1, roughness: 0.7, wireframe });

    for (const m of meshes) {
      const geom = new THREE.BufferGeometry();
      const pos = m.positions instanceof Float32Array ? m.positions : new Float32Array(m.positions as any);
      geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      if (m.normals) {
        const n = m.normals instanceof Float32Array ? m.normals : new Float32Array(m.normals as any);
        geom.setAttribute('normal', new THREE.BufferAttribute(n, 3));
      } else {
        geom.computeVertexNormals();
      }
      if (m.indices) {
        const idx = m.indices instanceof Uint32Array ? m.indices : new Uint32Array(m.indices as any);
        geom.setIndex(Array.from(idx));
      }
      geom.computeBoundingBox();
      const mesh = new THREE.Mesh(geom, mat.clone());
      group.add(mesh);
    }

    // fit camera
    const box = new THREE.Box3().setFromObject(group);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const camera = cameraRef.current!;
    const controls = controlsRef.current!;
    const distance = maxDim * 1.8;
    camera.position.set(center.x, center.y, center.z + distance);
    camera.lookAt(center);
    controls.target.copy(center);

  }, [meshes, wireframe]);

  return (
    <div className={className}>
      <div className="relative">
        <div ref={containerRef} className="border rounded overflow-hidden" style={{ height }} />
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            className="bg-white/90 text-sm px-2 py-1 rounded shadow"
            onClick={() => setWireframe((s) => !s)}
          >
            {wireframe ? 'Solid' : 'Wire'}
          </button>
          <button
            className="bg-white/90 text-sm px-2 py-1 rounded shadow"
            onClick={() => {
              const camera = cameraRef.current!;
              const controls = controlsRef.current!;
              controls.reset();
              camera.position.set(0, 0, 300);
            }}
          >Reset</button>
        </div>
      </div>
    </div>
  );
}
