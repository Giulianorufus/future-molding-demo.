// Tipi base usati dal modulo CAD

export type CadFormat = "stl" | "glb" | "gltf" | "obj" | "step" | "iges";

export interface CadAnalysisResult {
  format: CadFormat;
  volumeCm3: number | null;
  areaApproxCm2: number | null;
  thicknessAvgMm: number | null;
  bbox: {
    x: number;
    y: number;
    z: number;
  };
  // id per il viewer: es. URL blob o path pubblico
  viewerUrl: string;
}
