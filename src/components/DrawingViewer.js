import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { warn as logWarn, error as logError } from '@/lib/log';
import { useDrawingStore } from "@/stores/drawingStore";
// analysisStore removed in new architecture; use no-op local analysis setter
import { computeVolume_cm3, computeArea_cm2, computeBBox_mm, estimateThickness_mm, countConnectedComponents } from "@/utils/geoAnalysis";
export default function DrawingViewer() {
    const containerRef = useRef(null);
    const url = useDrawingStore((s) => s.previewUrl || s.glbUrl);
    const setAnalysis = (_v) => { /* no-op: analysis handled in core */ };
    const [ext, setExt] = useState("");
    useEffect(() => {
        if (!file) {
            setExt("");
            setAnalysis({ note: undefined });
            return;
        }
        const e = file.name.toLowerCase().split(".").pop() || "";
        setExt(e);
        if (e === "step" || e === "stp" || e === "iges" || e === "igs") {
            setAnalysis({ note: "Per analisi automatica: converti STEP/IGES in STL o GLB." });
        }
        else {
            setAnalysis({ note: undefined });
        }
    }, [file, setAnalysis]);
    if (!file || !url) {
        return _jsx("div", { className: "border rounded-lg p-6 text-sm text-gray-600", children: "Nessun disegno caricato." });
    }
    if (["pdf"].includes(ext)) {
        return (_jsxs("div", { className: "border rounded-lg overflow-hidden", style: { height: 520 }, children: [_jsx("iframe", { title: "pdf", src: url, className: "w-full h-full" }), _jsx("div", { className: "px-3 py-2 text-xs text-gray-500", children: "Hotspot e analisi disponibili solo su STL/GLB." })] }));
    }
    if (!["stl", "glb", "gltf"].includes(ext)) {
        return (_jsxs("div", { className: "border rounded-lg p-4 text-sm text-red-600", children: ["Formato .", ext, " non supportato per analisi. Converti a STL/GLB."] }));
    }
    return _jsx(ThreeAndAnalyze, { url: url, ext: ext, containerRef: containerRef });
}
function ThreeAndAnalyze({ url, ext, containerRef }) {
    const setAnalysis = useAnalysisStore((s) => s.set);
    useEffect(() => {
        if (!containerRef.current) {
            logWarn("Container ref not ready");
            return;
        }
        let disposed = false;
        let renderer = null;
        let animationId = null;
        (async () => {
            try {
                const THREE = await import("three");
                const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
                const { STLLoader } = await import("three/examples/jsm/loaders/STLLoader.js");
                const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
                const el = containerRef.current;
                if (!el || disposed)
                    return;
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
                let root;
                const animate = () => {
                    if (disposed)
                        return;
                    animationId = requestAnimationFrame(animate);
                    controls.update();
                    renderer.render(scene, camera);
                };
                const addAndFit = (obj) => {
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
                const runAnalysis = (geom, mesh) => {
                    if (disposed)
                        return;
                    try {
                        const volume = computeVolume_cm3(geom);
                        const area = computeArea_cm2(geom);
                        const bbox = computeBBox_mm(geom);
                        const components = countConnectedComponents(geom);
                        let thickness = { min: NaN, mean: NaN, max: NaN };
                        if (mesh) {
                            try {
                                thickness = estimateThickness_mm(mesh, 300);
                            }
                            catch (e) {
                                logWarn("Thickness estimation failed:", e);
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
                    }
                    catch (e) {
                        logError("Analysis error:", e);
                        setAnalysis({ note: "Errore durante l'analisi geometrica" });
                    }
                };
                // Carica modello
                if (ext === "stl") {
                    const loader = new STLLoader();
                    loader.load(url, (geom) => {
                        if (disposed)
                            return;
                        const mat = new THREE.MeshStandardMaterial({ color: 0x9aa6b2, metalness: 0.1, roughness: 0.7 });
                        const mesh = new THREE.Mesh(geom, mat);
                        addAndFit(mesh);
                        runAnalysis(geom, mesh);
                    }, undefined, (err) => {
                        if (!disposed)
                            setAnalysis({ note: `Errore caricamento STL: ${err.message}` });
                    });
                }
                else if (ext === "glb" || ext === "gltf") {
                    const loader = new GLTFLoader();
                    loader.load(url, (gltf) => {
                        if (disposed)
                            return;
                        addAndFit(gltf.scene);
                        // Trova la prima mesh per analisi
                        let firstMesh = null;
                        gltf.scene.traverse((child) => {
                            if (!firstMesh && child.isMesh && child.geometry) {
                                firstMesh = child;
                            }
                        });
                        if (firstMesh) {
                            runAnalysis(firstMesh.geometry, firstMesh);
                        }
                        else {
                            setAnalysis({ note: "Nessuna geometria mesh trovata nel file GLB/GLTF" });
                        }
                    }, undefined, (err) => {
                        if (!disposed)
                            setAnalysis({ note: `Errore caricamento GLB/GLTF: ${err.message}` });
                    });
                }
                animate();
                const handleResize = () => {
                    if (disposed || !el)
                        return;
                    const w = el.clientWidth || 880;
                    const h = 520;
                    camera.aspect = w / h;
                    camera.updateProjectionMatrix();
                    renderer.setSize(w, h);
                };
                window.addEventListener("resize", handleResize);
            }
            catch (error) {
                logError("Three.js setup error:", error);
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
            window.removeEventListener("resize", () => { });
        };
    }, [url, ext, setAnalysis]);
    return (_jsxs("div", { className: "border rounded-lg overflow-hidden bg-gray-50", children: [_jsx("div", { ref: containerRef, style: { height: 520, width: "100%" } }), _jsx("div", { className: "px-3 py-2 text-xs text-gray-500", children: "Rotazione: click + trascina | Zoom: rotella mouse | Analisi automatica in corso..." })] }));
}
