// Browser-compatible CAD analysis system for STEP, IGES, STL files
import * as THREE from 'three';
import { parseCAD } from './cadParser';
import * as log from '@/lib/log';
import { recordParseMetric } from '@/services/metrics';

export interface AnalysisResult {
  volume: number;           // cm³
  thickness_min: number;    // mm (estimate)
  thickness_max: number;    // mm (estimate)
  thin_zones: boolean;
  long_runner: boolean;
  surface_area: number;     // cm²
  injection_points: number; // placeholder
  projectedArea_cm2: number;
  cavities: number;
  thickness_map?: number[];
  features?: string[];
  warnings?: string[];
  meshes?: Array<{ positions: number[] | Float32Array; indices?: number[] | Uint32Array; normals?: number[] | Float32Array }>;
}

const MM3_TO_CM3 = 1 / 1000;
const MM2_TO_CM2 = 1 / 100;

export async function analyzeCADFile(file: File, onProgress?: (st: { progress?: number; status?: string; message?: string }) => void): Promise<AnalysisResult> {
  const ext = getFileExtension(file.name).toLowerCase();
  if ([".stl", ".step", ".stp", ".iges", ".igs"].includes(ext)) {
    // Usa il parser avanzato per tutti i formati supportati
    try {
      const t0 = performance.now();
      let fallbackUsed = false;
      const geom = await parseCAD(file, onProgress);
      const t1 = performance.now();
      try {
        recordParseMetric({ id: Math.random().toString(36).slice(2,9), fileName: file.name, fileSizeBytes: file.size, durationMs: Math.round(t1 - t0), timestamp: Date.now(), success: true, fallbackUsed });
      } catch (e) {}
      return {
        volume: geom.volume_cm3,
        thickness_min: (geom as any).thickness_mm ?? 0,
        thickness_max: (geom as any).thickness_mm ?? 0,
        thin_zones: ((geom as any).thickness_mm ?? 0) < 1.2,
        long_runner: false, // da implementare con feature avanzate
        surface_area: geom.area_cm2,
        injection_points: 0,
        projectedArea_cm2: geom.area_cm2, // semplificato
        cavities: 1,
        thickness_map: (geom as any).thickness_mm ? [(geom as any).thickness_mm] : [],
        features: geom.features,
        warnings: [],
        meshes: (geom as any).meshes ?? [],
      };
    } catch (err: any) {
      // Se il parser fallisce, log e fallback alla versione semplificata
      log.warn('parseCAD failed:', err);
      try {
        if (onProgress) {
          try { onProgress({ progress: 0, status: 'fallback', message: String(err?.message ?? err) }); } catch (e) {}
        }
      } catch (_) {}
      const simplified = await analyzeCADFile_Simplified(file);
      simplified.warnings = simplified.warnings || [];
      simplified.warnings.push(`Parsing avanzato fallito: ${err?.message ?? err}`);
      // convert simplified to AnalysisResult shape
      return {
        volume: simplified.volume,
        thickness_min: simplified.thickness_min,
        thickness_max: simplified.thickness_max,
        thin_zones: simplified.thin_zones,
        long_runner: simplified.long_runner,
        surface_area: simplified.surface_area,
        injection_points: simplified.injection_points,
        projectedArea_cm2: simplified.projectedArea_cm2 ?? 0,
        cavities: simplified.cavities ?? 1,
        thickness_map: simplified.thickness_min !== undefined ? [((simplified.thickness_min + (simplified.thickness_max ?? simplified.thickness_min)) / 2) || 0] : [],
        features: simplified.features ?? [],
        warnings: simplified.warnings ?? [],
        meshes: [],
      };
    }
  }

  throw new Error(`Formato ${ext} non supportato. Usa STL, STEP o IGES.`);
}


function getFileExtension(filename: string): string {
  return filename.substring(filename.lastIndexOf('.')).toLowerCase();
}

async function analyzeSTLFile(file: File): Promise<AnalysisResult & { geometry?: THREE.BufferGeometry }> {
  const arrayBuffer = await file.arrayBuffer();
  const geometry = parseSTL(arrayBuffer);
  
  if (!geometry) {
    throw new Error('File STL non valido o corrotto.');
  }
  
  const analysis = analyzeGeometry(geometry);
  return { ...analysis, geometry };
}

async function analyzeCADFile_Simplified(file: File): Promise<AnalysisResult> {
  // For STEP/IGES files, we create a simplified mesh based on file size and type
  // This is a fallback approach until full CAD parsing is available
  const fileSizeMB = file.size / (1024 * 1024);
  
  // Estimate parameters based on file characteristics
  const estimatedVolume = Math.max(5, Math.min(500, fileSizeMB * 20)); // cm³
  const estimatedThickness = fileSizeMB > 2 ? 2.5 : 1.8; // mm
  
  return {
    volume: round(estimatedVolume, 2),
    thickness_min: round(estimatedThickness * 0.8, 2),
    thickness_max: round(estimatedThickness * 1.5, 2),
    thin_zones: estimatedThickness < 1.2,
    long_runner: estimatedVolume < 20 && fileSizeMB > 1,
    surface_area: round(estimatedVolume * 8, 2), // rough estimate
    injection_points: 0,
    projectedArea_cm2: round(Math.sqrt(estimatedVolume) * 4, 2),
    cavities: 1
  };
}

function parseSTL(buffer: ArrayBuffer): THREE.BufferGeometry | null {
  try {
    // Check if it's binary or ASCII STL
    const view = new DataView(buffer);
    const headerBytes = new Uint8Array(buffer, 0, 5);
    const headerText = String.fromCharCode(...headerBytes);
    
    if (headerText.toLowerCase().startsWith('solid')) {
      // ASCII STL
      const text = new TextDecoder().decode(buffer);
      return parseSTLAscii(text);
    } else {
      // Binary STL
      return parseSTLBinary(buffer);
    }
  } catch (error) {
    log.error('STL parsing error:', error);
    return null;
  }
}

function parseSTLAscii(text: string): THREE.BufferGeometry | null {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const normals: number[] = [];
  
  const lines = text.split('\n');
  let currentNormal: number[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('facet normal')) {
      const parts = trimmed.split(/\s+/);
      currentNormal = [
        parseFloat(parts[2]) || 0,
        parseFloat(parts[3]) || 0, 
        parseFloat(parts[4]) || 0
      ];
    } else if (trimmed.startsWith('vertex')) {
      const parts = trimmed.split(/\s+/);
      vertices.push(
        parseFloat(parts[1]) || 0,
        parseFloat(parts[2]) || 0,
        parseFloat(parts[3]) || 0
      );
      normals.push(...currentNormal);
    }
  }
  
  if (vertices.length === 0) return null;
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.computeBoundingBox();
  
  return geometry;
}

function parseSTLBinary(buffer: ArrayBuffer): THREE.BufferGeometry | null {
  const view = new DataView(buffer);
  
  // Skip 80 byte header
  let offset = 80;
  
  // Read number of triangles
  const numTriangles = view.getUint32(offset, true);
  offset += 4;
  
  const vertices: number[] = [];
  const normals: number[] = [];
  
  for (let i = 0; i < numTriangles; i++) {
    // Read normal (3 floats)
    const nx = view.getFloat32(offset, true); offset += 4;
    const ny = view.getFloat32(offset, true); offset += 4;
    const nz = view.getFloat32(offset, true); offset += 4;
    
    // Read 3 vertices (3 floats each)
    for (let j = 0; j < 3; j++) {
      const x = view.getFloat32(offset, true); offset += 4;
      const y = view.getFloat32(offset, true); offset += 4;
      const z = view.getFloat32(offset, true); offset += 4;
      
      vertices.push(x, y, z);
      normals.push(nx, ny, nz);
    }
    
    // Skip attribute byte count (2 bytes)
    offset += 2;
  }
  
  if (vertices.length === 0) return null;
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.computeBoundingBox();
  
  return geometry;
}

function analyzeGeometry(geometry: THREE.BufferGeometry): AnalysisResult {
  const positions = geometry.attributes.position.array as Float32Array;
  const vertexCount = positions.length / 3;
  
  if (vertexCount === 0) {
    throw new Error('Geometria vuota.');
  }
  
  // Calculate bounding box
  const positionAttribute = geometry.attributes.position;
  const bbox = new THREE.Box3();
  if (positionAttribute instanceof THREE.BufferAttribute) {
    bbox.setFromBufferAttribute(positionAttribute);
  } else {
    // Handle InterleavedBufferAttribute by extracting positions
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);
      bbox.expandByPoint(new THREE.Vector3(x, y, z));
    }
  }
  const size = bbox.getSize(new THREE.Vector3());
  
  // Estimate volume and surface area
  const volume_mm3 = size.x * size.y * size.z * 0.3; // rough solid estimate
  const volume = volume_mm3 * MM3_TO_CM3;
  
  // Surface area estimation
  let surface_area_mm2 = 0;
  for (let i = 0; i < positions.length; i += 9) {
    const v1 = new THREE.Vector3(positions[i], positions[i+1], positions[i+2]);
    const v2 = new THREE.Vector3(positions[i+3], positions[i+4], positions[i+5]);
    const v3 = new THREE.Vector3(positions[i+6], positions[i+7], positions[i+8]);
    
    const a = v2.clone().sub(v1);
    const b = v3.clone().sub(v1);
    const cross = a.cross(b);
    surface_area_mm2 += cross.length() * 0.5;
  }
  
  const surface_area = surface_area_mm2 * MM2_TO_CM2;
  
  // Thickness estimation
  const minSide = Math.min(size.x, size.y, size.z);
  const maxSide = Math.max(size.x, size.y, size.z);
  const thickness_min = Math.max(0.5, minSide * 0.1);
  const thickness_max = Math.max(thickness_min + 0.5, maxSide * 0.3);
  
  // Projected area (approximate as largest face)
  const projectedArea_cm2 = Math.max(
    size.x * size.y,
    size.y * size.z, 
    size.x * size.z
  ) * MM2_TO_CM2;
  
  // Analysis flags
  const thin_zones = thickness_min < 1.2;
  const aspectRatio = maxSide / minSide;
  const long_runner = aspectRatio > 8 && thickness_min < 2.0;
  
  // Placeholder: mappatura spessori (qui solo array di valori stimati)
  // Improved thickness map: sample simple percentiles from bounding box-based estimate
  const thickness_map = [
    round(thickness_min, 2),
    round((thickness_min + thickness_max) / 2, 2),
    round(thickness_max, 2),
  ];
  // Detect disconnected components (naive triangle connectivity) to estimate cavities
  let cavities = 1;
  try {
    const triCount = positions.length / 9;
    const vertexToTris = new Map<string, number[]>();
    for (let ti = 0; ti < triCount; ti++) {
      const base = ti * 9;
      for (let vi = 0; vi < 3; vi++) {
        const vx = positions[base + vi*3];
        const vy = positions[base + vi*3 + 1];
        const vz = positions[base + vi*3 + 2];
        const key = `${vx.toFixed(5)}_${vy.toFixed(5)}_${vz.toFixed(5)}`;
        const arr = vertexToTris.get(key) || [];
        arr.push(ti);
        vertexToTris.set(key, arr);
      }
    }
    // build triangle adjacency
    const adj = Array.from({ length: triCount }, () => [] as number[]);
    for (const tris of vertexToTris.values()) {
      for (let i = 0; i < tris.length; i++) {
        for (let j = i+1; j < tris.length; j++) {
          const a = tris[i], b = tris[j];
          adj[a].push(b);
          adj[b].push(a);
        }
      }
    }
    // BFS to count components
    const seen = new Uint8Array(triCount);
    let comps = 0;
    const stack: number[] = [];
    for (let i = 0; i < triCount; i++) {
      if (seen[i]) continue;
      comps++;
      stack.push(i);
      seen[i] = 1;
      while (stack.length) {
        const cur = stack.pop()!;
        const neighbors = adj[cur];
        for (const nb of neighbors) {
          if (!seen[nb]) { seen[nb] = 1; stack.push(nb); }
        }
      }
    }
    cavities = Math.max(1, comps);
  } catch (e) {
    // fail silently, leave cavities = 1
  }
  // Placeholder: riconoscimento feature
  const features = ["foro (placeholder)", "nervatura (placeholder)"];
  // Warning avanzati
  const warnings = [];
  if (thin_zones) warnings.push("Zone sottili rilevate (<1.2mm)");
  if (long_runner) warnings.push("Rapporto d'aspetto elevato: possibile canale lungo");
  if (thickness_min < 0.5) warnings.push("Spessore minimo troppo basso!");

  return {
    volume: round(volume, 2),
    thickness_min: round(thickness_min, 2),
    thickness_max: round(thickness_max, 2),
    thin_zones,
    long_runner,
    surface_area: round(surface_area, 2),
    injection_points: 0,
    projectedArea_cm2: round(projectedArea_cm2, 2),
    cavities,
    thickness_map,
    features,
    warnings
  };
}

function round(x: number, d = 2): number {
  return Math.round(x * Math.pow(10, d)) / Math.pow(10, d);
}

// Generate 3D preview thumbnail
export function generatePreviewThumbnail(geometry: THREE.BufferGeometry): string {
  try {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Create mesh with nice material
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x0057b7, // Future Molding blue
      wireframe: false,
      shininess: 30
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    
    // Position camera to fit the object
    const bbox = new THREE.Box3().setFromObject(mesh);
    const center = bbox.getCenter(new THREE.Vector3());
    const size = bbox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Position camera at an angle for better visualization
    camera.position.set(
      center.x + maxDim * 1.2,
      center.y + maxDim * 0.8,
      center.z + maxDim * 1.5
    );
    camera.lookAt(center);
    
    // Create renderer
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    
    const renderer = new THREE.WebGLRenderer({ 
      canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    renderer.setSize(200, 200);
    renderer.setClearColor(0x000000, 0);
    
    // Render the scene
    renderer.render(scene, camera);
    
    const dataURL = canvas.toDataURL('image/png');
    
    // Cleanup
    renderer.dispose();
    material.dispose();
    geometry.dispose();
    
    return dataURL;
  } catch (error) {
    log.error('Error generating preview thumbnail:', error);
    // Return a simple colored rectangle as fallback
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0057b7';
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('3D', 100, 110);
    }
    return canvas.toDataURL('image/png');
  }
}
