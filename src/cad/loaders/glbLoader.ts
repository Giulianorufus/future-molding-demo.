// Minimal GLB loader: try to parse with GLTFLoader in-browser, otherwise fallback to object URL.
export async function loadGlbAndAnalyze(file: File) {
  // In non-browser environments (Node / Jest) fallback immediately
  if (typeof window === "undefined") {
    const url = URL.createObjectURL(file);
    return {
      format: "glb",
      volumeCm3: null,
      areaApproxCm2: null,
      thicknessAvgMm: null,
      bbox: { x: 0, y: 0, z: 0 },
      viewerUrl: url,
    } as any;
  }

  try {
    // Try dynamic import of GLTFLoader
    let GLTFLoader: any;
    try {
      const mod = await import("three/examples/jsm/loaders/GLTFLoader");
      GLTFLoader = (mod as any).GLTFLoader ?? (mod as any).default ?? mod;
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require("three/examples/jsm/loaders/GLTFLoader");
      GLTFLoader = (mod as any).GLTFLoader ?? (mod as any).default ?? mod;
    }

    if (!GLTFLoader) throw new Error("GLTFLoader non disponibile");

    const loader = new GLTFLoader();
    const arrayBuffer = await file.arrayBuffer();

    // Parse to validate/prepare the model for viewer (some viewers prefer an URL)
    await new Promise<void>((resolve, reject) => {
      // GLTFLoader.parse accepts ArrayBuffer and a path for relative resources
      loader.parse(arrayBuffer, "", () => resolve(), (err: any) => reject(err));
    });

    // Use object URL as stable viewer URL for ThreeViewer
    const url = URL.createObjectURL(file);

    return {
      format: "glb",
      volumeCm3: null,
      areaApproxCm2: null,
      thicknessAvgMm: null,
      bbox: { x: 0, y: 0, z: 0 },
      viewerUrl: url,
    } as any;
  } catch (err) {
    // On any error, provide a safe fallback (object URL) so the viewer mounts
    const url = URL.createObjectURL(file);
    return {
      format: "glb",
      volumeCm3: null,
      areaApproxCm2: null,
      thicknessAvgMm: null,
      bbox: { x: 0, y: 0, z: 0 },
      viewerUrl: url,
    } as any;
  }
}

export default loadGlbAndAnalyze;
