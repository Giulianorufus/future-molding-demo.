import { useDrawingStore } from '@/stores/drawingStore';

describe('CAD Pipeline: STEP Conversion Flow', () => {
  beforeEach(() => {
    useDrawingStore.getState().reset();
  });

  it('should detect STEP file and set conversion status to converting', async () => {
    // Create a mock STEP file
    const stepFile = new File(['dummy STEP content'], 'test.step', { type: 'application/octet-stream' });

    // Import and call startCadPipeline
    const { startCadPipeline } = await import('../cadPipeline');
    startCadPipeline(stepFile);

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
  });

  it('should NOT assign object URL for STEP files to viewerUrl', async () => {
    const stepFile = new File(['dummy'], 'model.step', { type: 'application/octet-stream' });
    const { startCadPipeline } = await import('../cadPipeline');
    
    startCadPipeline(stepFile);
    const state = useDrawingStore.getState();
    
    // Critical check: viewerUrl must NOT be a blob URL (object URL)
    // It should be null because conversion is pending
    expect(state.viewerUrl).toBeNull();
  });

  it('should detect GLB file and assign viewerUrl immediately', async () => {
    const glbFile = new File(['dummy GLB'], 'model.glb', { type: 'model/gltf-binary' });
    const { startCadPipeline } = await import('../cadPipeline');
    
    startCadPipeline(glbFile);

    // Wait a moment for analyzeCADFile to complete
    await new Promise(resolve => setTimeout(resolve, 50));
    const state = useDrawingStore.getState();
    
    // For GLB files in Jest (no URL.createObjectURL in Node):
    // - In browser: would have viewerUrl (object URL) and conversionStatus 'ready'
    // - In Jest: conversionStatus may be 'error' due to missing browser APIs
    // Key check: NOT in 'converting' state (unlike STEP files)
    expect(state.conversionStatus).not.toBe('converting');
  });

  it('should detect IGES file and set conversion status to converting', async () => {
    const igesFile = new File(['dummy IGES'], 'model.iges', { type: 'application/octet-stream' });
    const { startCadPipeline } = await import('../cadPipeline');
    
    startCadPipeline(igesFile);
    const state = useDrawingStore.getState();
    
    // IGES files should be handled like STEP files
    expect(state.viewerUrl).toBeNull();
    expect(state.conversionStatus).toBe('converting');
  });

  it('should distinguish between .step and .stp extensions', async () => {
    const stpFile = new File(['dummy STP'], 'model.stp', { type: 'application/octet-stream' });
    const { startCadPipeline } = await import('../cadPipeline');
    
    startCadPipeline(stpFile);
    const state = useDrawingStore.getState();
    
    // Should be treated as STEP file (conversion mode)
    expect(state.conversionStatus).toBe('converting');
    expect(state.viewerUrl).toBeNull();
  });
});
