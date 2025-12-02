// Neutralized legacy STL loader during cleanup Block 1.
// Use canonical loaders in src/cad/loaders/stepLoader.ts or the cadPipeline analyze flow.
export async function loadStlAndAnalyze(_file: any): Promise<any> {
  throw new Error("stlLoader removed — use canonical pipeline (stepLoader.ts / analyzeCADFile)");
}

export default loadStlAndAnalyze;
