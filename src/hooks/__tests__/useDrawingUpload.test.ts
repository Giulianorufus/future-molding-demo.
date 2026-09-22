import { getUrlForDrawingStore, isImageFile } from '../useDrawingUpload';

describe('useDrawingUpload URL mapping', () => {
  it('should not send a raw STEP file directly to the GLTF viewer', () => {
    const file = new File(['dummy'], 'part.step', { type: 'application/step' });
    const url = 'blob://model-step';
    expect(isImageFile(file)).toBe(false);
    expect(getUrlForDrawingStore(file, url)).toEqual({ viewerUrl: null, previewUrl: null });
  });

  it('should treat GLB files as a model and set viewerUrl only', () => {
    const file = new File(['dummy'], 'part.glb', { type: 'model/gltf-binary' });
    const url = 'blob://model-glb';
    expect(isImageFile(file)).toBe(false);
    expect(getUrlForDrawingStore(file, url)).toEqual({ viewerUrl: url, previewUrl: null });
  });

  it('should treat PNG files as images and set previewUrl only', () => {
    const file = new File(['dummy'], 'preview.png', { type: 'image/png' });
    const url = 'blob://image-png';
    expect(isImageFile(file)).toBe(true);
    expect(getUrlForDrawingStore(file, url)).toEqual({ viewerUrl: null, previewUrl: url });
  });

  it('should treat JPG files as images and set previewUrl only', () => {
    const file = new File(['dummy'], 'preview.JPG', { type: 'image/jpeg' });
    const url = 'blob://image-jpg';
    expect(isImageFile(file)).toBe(true);
    expect(getUrlForDrawingStore(file, url)).toEqual({ viewerUrl: null, previewUrl: url });
  });
});
