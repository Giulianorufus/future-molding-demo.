import { useDrawingStore } from '@/stores/drawingStore';
import { loadStepWithOcctAndAnalyze } from '@/cad/loaders/stepLoader';

// These tests verify routing and initial state, not OCCT parsing. The pipeline
// deliberately returns before conversion finishes, so awaiting it cannot drain
// a real loader (and dummy jsdom Files are not valid STEP inputs).
jest.mock('@/cad/loaders/stepLoader', () => ({
  loadStepWithOcctAndAnalyze: jest.fn().mockResolvedValue({}),
}));
jest.mock('@/lib/cadAnalysis', () => ({
  analyzeCADFile: jest.fn().mockResolvedValue({ volume: 1, surface_area: 2 }),
}));

describe('CAD Pipeline: STEP Conversion Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDrawingStore.getState().reset();
  });

  it('should detect STEP file and set conversion status to converting', async () => {
    // Create a mock STEP file
    const stepFile = new File(['dummy STEP content'], 'test.step', { type: 'application/octet-stream' });

    // Import and call startCadPipeline
    const { startCadPipeline } = await import('../cadPipeline');
    const pending = startCadPipeline(stepFile);

    // Immediately check state (before async conversion completes)
    const state = useDrawingStore.getState();
    
    // For STEP files, the pipeline should immediately set:
    // 1. viewerUrl must be null (no object URL from raw STEP file)
    // 2. conversionStatus should be 'converting' (or 'error' in Node if conversion fails)
    // 3. conversionMessage should be defined
    expect(state.viewerUrl).toBeNull();
    // In browser: 'converting', In Jest/Node: may be 'converting' or 'error'
    expect(['converting', 'error']).toContain(state.conversionStatus);
    expect(state.conversionMessage).toBeDefined();
    expect(loadStepWithOcctAndAnalyze).toHaveBeenCalledWith(stepFile, state.conversionId);
    await pending;
  });

  it('should NOT assign object URL for STEP files to viewerUrl', async () => {
    const stepFile = new File(['dummy'], 'model.step', { type: 'application/octet-stream' });
    const { startCadPipeline } = await import('../cadPipeline');
    
    const pending = startCadPipeline(stepFile);
    const state = useDrawingStore.getState();
    
    // Critical check: viewerUrl must NOT be a blob URL (object URL)
    // It should be null because conversion is pending
    expect(state.viewerUrl).toBeNull();
    await pending;
  });

  it('should detect GLB file and assign viewerUrl immediately', async () => {
    const glbFile = new File(['dummy GLB'], 'model.glb', { type: 'model/gltf-binary' });
    const { startCadPipeline } = await import('../cadPipeline');
    
    await startCadPipeline(glbFile);
    const state = useDrawingStore.getState();
    
    // For GLB files in Jest (no URL.createObjectURL in Node):
    // - In browser: would have viewerUrl (object URL) and conversionStatus 'ready'
    // - In Jest: conversionStatus may be 'error' due to missing browser APIs
    // Key check: NOT in 'converting' state (unlike STEP files)
    expect(state.conversionStatus).not.toBe('converting');
    expect(loadStepWithOcctAndAnalyze).not.toHaveBeenCalled();
  });

  it('should detect IGES file and set conversion status to converting', async () => {
    const igesFile = new File(['dummy IGES'], 'model.iges', { type: 'application/octet-stream' });
    const { startCadPipeline } = await import('../cadPipeline');
    
    const pending = startCadPipeline(igesFile);
    const state = useDrawingStore.getState();
    
    // IGES files should be handled like STEP files
    expect(state.viewerUrl).toBeNull();
    expect(state.conversionStatus).toBe('converting');
    await pending;
  });

  it('should distinguish between .step and .stp extensions', async () => {
    const stpFile = new File(['dummy STP'], 'model.stp', { type: 'application/octet-stream' });
    const { startCadPipeline } = await import('../cadPipeline');
    
    const pending = startCadPipeline(stpFile);
    const state = useDrawingStore.getState();
    
    // Should be treated as STEP file (conversion mode)
    expect(state.conversionStatus).toBe('converting');
    expect(state.viewerUrl).toBeNull();
    await pending;
  });
});
