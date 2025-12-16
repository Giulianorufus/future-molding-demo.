import { BufferGeometry, Vector3, Box3, Object3D, Mesh } from "three";
import * as log from '@/lib/log';

export type SimpleAnalysis = {
  volume_cm3: number | null;
  bbox_mm: { x: number; y: number; z: number } | null;
  thickness_mm: { min: number; mean: number; max: number } | null;
  projectedArea_cm2?: number | null;
  meshes?: Array<{ positions: number[] | Float32Array; indices?: number[] | Uint32Array; normals?: number[] | Float32Array }> | null;
};

function computeVolume_mm3(geom: BufferGeometry): number {
  const pos = geom.getAttribute("position");
  const index = geom.getIndex();
  if (!pos) return 0;
  let vol = 0;
  const a = new Vector3(), b = new Vector3(), c = new Vector3();
  const getV = (i: number, v: Vector3) => v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      const i0 = index.getX(i), i1 = index.getX(i + 1), i2 = index.getX(i + 2);
      getV(i0, a); getV(i1, b); getV(i2, c);
      vol += a.dot(b.cross(c));
    }
  } else {
    for (let i = 0; i < pos.count; i += 3) {
      getV(i, a); getV(i + 1, b); getV(i + 2, c);
      vol += a.dot(b.cross(c));
    }
  }
  return Math.abs(vol) / 6; // mm^3
}

function computeAreas_mm2(geom: BufferGeometry): { surface: number; projectedXY: number } {
  const pos = geom.getAttribute("position");
  const index = geom.getIndex();
  if (!pos) return { surface: 0, projectedXY: 0 };
  const a = new Vector3(), b = new Vector3(), c = new Vector3();
  const ab = new Vector3(), ac = new Vector3(), n = new Vector3();
  let surface = 0;
  let projXY = 0;
  const tri = (i0: number, i1: number, i2: number) => {
    a.set(pos.getX(i0), pos.getY(i0), pos.getZ(i0));
    b.set(pos.getX(i1), pos.getY(i1), pos.getZ(i1));
    c.set(pos.getX(i2), pos.getY(i2), pos.getZ(i2));
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    n.crossVectors(ab, ac);
    const area = 0.5 * n.length();
    surface += area;
    if (area > 0) projXY += area * (Math.abs(n.z) / n.length());
  };
  if (index) {
    for (let i = 0; i < index.count; i += 3) tri(index.getX(i), index.getX(i + 1), index.getX(i + 2));
  } else {
    for (let i = 0; i < pos.count; i += 3) tri(i, i + 1, i + 2);
  }
  return { surface, projectedXY: projXY };
}

export async function analyzeSTL(arrayBuffer: ArrayBuffer): Promise<SimpleAnalysis> {
  const { STLLoader } = await import("three/examples/jsm/loaders/STLLoader.js");
  const loader = new STLLoader();
  const geom = loader.parse(arrayBuffer) as BufferGeometry;
  geom.computeBoundingBox();
  const bb = geom.boundingBox!;
  const bbox_mm = { x: bb.max.x - bb.min.x, y: bb.max.y - bb.min.y, z: bb.max.z - bb.min.z };
  const vol_mm3 = computeVolume_mm3(geom);
  const areas = computeAreas_mm2(geom);
  const volume_cm3 = vol_mm3 / 1000;
  const t_mean = areas.surface > 0 ? (4 * vol_mm3) / areas.surface : Math.min(bbox_mm.x, bbox_mm.y, bbox_mm.z) * 0.15;
  const thickness_mm = { min: Math.max(0.5, t_mean * 0.6), mean: Math.max(0.6, t_mean), max: Math.max(0.8, t_mean * 1.6) };
  return { volume_cm3, bbox_mm, thickness_mm, projectedArea_cm2: areas.projectedXY / 100 };
}

export async function analyzeSTEP(arrayBuffer: ArrayBuffer): Promise<SimpleAnalysis> {
  // Use high-level parser to obtain meshes and metadata, falls back to direct occt walk
  try {
    const { parseCAD } = await import('@/lib/cadParser');
    const file = new File([arrayBuffer], 'model.step');
    const geom = await parseCAD(file);
    return {
      volume_cm3: geom.volume_cm3,
      bbox_mm: null,
      thickness_mm: geom.thickness_mm ? { min: geom.thickness_mm, mean: geom.thickness_mm, max: geom.thickness_mm } : null,
      projectedArea_cm2: geom.area_cm2 ?? null,
      meshes: (geom as any).meshes ?? null,
    };
  } catch (e) {
    // fallback to occt direct mesh iteration (older behavior)
    log.warn('parseCAD failed for STEP; falling back to lower-level parse:', e);
    const { getOcct } = await import("@/lib/occtInit");
    const occt = await getOcct();
    const data = new Uint8Array(arrayBuffer);

    // tolerant reader selection (align with cadParser helpers)
    const pickOcctFn = (occtAny: any, names: string[]) => {
      for (const n of names) {
        const fn = occtAny?.[n];
        if (typeof fn === 'function') return fn.bind(occtAny);
      }
      return null;
    };
    const callOcctReader = async (fn: any, dataArg: Uint8Array, fileName: string) => {
      try { return await Promise.resolve(fn(dataArg, null)); } catch (e) { return await Promise.resolve(fn(dataArg, fileName || null)); }
    };
    const flattenTriplets = (arr: any) => {
      if (!arr) return arr; if (Array.isArray(arr) && arr.length > 0 && Array.isArray(arr[0])) return arr.flat(); return arr;
    };

    const fn = pickOcctFn(occt, ['ReadStepFile', 'readStepFile', 'ReadSTEPFile', 'readSTEPFile']);
    if (!fn) throw new Error('OCCT STEP reader not available');
    const res = await callOcctReader(fn, data, 'model.step');
    let vol_mm3 = 0;
    let area_mm2 = 0;
    const bbox = { min: { x: Infinity, y: Infinity, z: Infinity }, max: { x: -Infinity, y: -Infinity, z: -Infinity } };
    for (const m of (res.meshes ? res.meshes : (res.mesh ? [res.mesh] : [])) ?? []) {
      const pArr = m.positions ?? m.attributes?.position?.array ?? m.attributes?.position?.data;
      const p = flattenTriplets(pArr) as Float32Array | number[];
      const idxArr = m.indices ?? m.index?.array ?? m.attributes?.index?.array ?? m.attributes?.index?.data;
      const idxFlat = flattenTriplets(idxArr) as number[] | Uint32Array | undefined;
      const idx = idxFlat && idxFlat.length ? idxFlat : undefined;
      if (!p) continue;
      const pLen = (p as any).length || 0;
      const indexArr = idx ? Array.from(idx as any) : undefined;
      if (!indexArr) {
        for (let i = 0; i < pLen; i += 3) indexArr?.push(i / 3);
      }
      for (let i = 0; i < pLen; i += 3) {
        const x = p[i], y = p[i + 1], z = p[i + 2];
        if (x < bbox.min.x) bbox.min.x = x; if (y < bbox.min.y) bbox.min.y = y; if (z < bbox.min.z) bbox.min.z = z;
        if (x > bbox.max.x) bbox.max.x = x; if (y > bbox.max.y) bbox.max.y = y; if (z > bbox.max.z) bbox.max.z = z;
      }
      const a = new Vector3(), b = new Vector3(), c = new Vector3();
      if (indexArr) {
        for (let i = 0; i < indexArr.length; i += 3) {
          const ii0 = indexArr[i] * 3, ii1 = indexArr[i + 1] * 3, ii2 = indexArr[i + 2] * 3;
          a.set(p[ii0], p[ii0 + 1], p[ii0 + 2]);
          b.set(p[ii1], p[ii1 + 1], p[ii1 + 2]);
          c.set(p[ii2], p[ii2 + 1], p[ii2 + 2]);
          vol_mm3 += a.dot(b.cross(c));
          const ab = new Vector3().subVectors(b, a);
          const ac = new Vector3().subVectors(c, a);
          const n = new Vector3().crossVectors(ab, ac);
          area_mm2 += 0.5 * n.length();
        }
      }
    }
    vol_mm3 = Math.abs(vol_mm3) / 6;
    const bbox_mm = { x: bbox.max.x - bbox.min.x, y: bbox.max.y - bbox.min.y, z: bbox.max.z - bbox.min.z };
    const volume_cm3 = vol_mm3 / 1000;
    const t_mean = area_mm2 > 0 ? (4 * vol_mm3) / area_mm2 : Math.min(bbox_mm.x, bbox_mm.y, bbox_mm.z) * 0.15;
    const thickness_mm = { min: Math.max(0.5, t_mean * 0.6), mean: Math.max(0.6, t_mean), max: Math.max(0.8, t_mean * 1.6) };
    return { volume_cm3, bbox_mm, thickness_mm, meshes: null };
  }
}

async function analyzeGLTF(arrayBuffer: ArrayBuffer): Promise<SimpleAnalysis> {
  const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
  const loader = new GLTFLoader();
  const gltf: any = await new Promise((resolve, reject) => { loader.parse(arrayBuffer as any, "", resolve, reject); });
  const scene: Object3D = gltf.scene || gltf.scenes?.[0];
  const bbox = new Box3().setFromObject(scene);
  const bbox_mm = { x: bbox.max.x - bbox.min.x, y: bbox.max.y - bbox.min.y, z: bbox.max.z - bbox.min.z };
  let vol_mm3 = 0; let area_mm2 = 0;
  scene.traverse((obj) => {
    if ((obj as Mesh).isMesh) {
      const geom = (obj as Mesh).geometry as BufferGeometry;
      if (geom) { vol_mm3 += computeVolume_mm3(geom); area_mm2 += computeAreas_mm2(geom).surface; }
    }
  });
  const volume_cm3 = vol_mm3 / 1000;
  const t_mean = area_mm2 > 0 ? (4 * vol_mm3) / area_mm2 : Math.min(bbox_mm.x, bbox_mm.y, bbox_mm.z) * 0.15;
  const thickness_mm = { min: Math.max(0.5, t_mean * 0.6), mean: Math.max(0.6, t_mean), max: Math.max(0.8, t_mean * 1.6) };
  return { volume_cm3, bbox_mm, thickness_mm };
}

async function analyzeOBJ(text: string): Promise<SimpleAnalysis> {
  const { OBJLoader } = await import("three/examples/jsm/loaders/OBJLoader.js");
  const loader = new OBJLoader();
  const obj = loader.parse(text);
  const bbox = new Box3().setFromObject(obj);
  const bbox_mm = { x: bbox.max.x - bbox.min.x, y: bbox.max.y - bbox.min.y, z: bbox.max.z - bbox.min.z };
  let vol_mm3 = 0; let area_mm2 = 0;
  obj.traverse((o) => {
    if ((o as Mesh).isMesh) {
      const g = (o as Mesh).geometry as BufferGeometry;
      if (g) { vol_mm3 += computeVolume_mm3(g); area_mm2 += computeAreas_mm2(g).surface; }
    }
  });
  const volume_cm3 = vol_mm3 / 1000;
  const t_mean = area_mm2 > 0 ? (4 * vol_mm3) / area_mm2 : Math.min(bbox_mm.x, bbox_mm.y, bbox_mm.z) * 0.15;
  const thickness_mm = { min: Math.max(0.5, t_mean * 0.6), mean: Math.max(0.6, t_mean), max: Math.max(0.8, t_mean * 1.6) };
  return { volume_cm3, bbox_mm, thickness_mm };
}

// Try multiple parsers in sequence to maximize chance of extracting geometry
export async function tryAllParsers(file: Blob, hint?: { name?: string; type?: string }): Promise<SimpleAnalysis | null> {
  const buf = await file.arrayBuffer();
  // Try STL first (fast)
  try {
    const stl = await analyzeSTL(buf);
    if (stl && stl.volume_cm3 != null) return stl;
  } catch (e) {
    // ignore
  }
  // Try GLTF/GLB
  try {
    const gltf = await analyzeGLTF(buf);
    if (gltf && gltf.volume_cm3 != null) return gltf;
  } catch (e) {
    // ignore
  }
  // Try as text -> OBJ
  try {
    const text = new TextDecoder().decode(buf);
    if (text && text.length > 0) {
      try {
        const obj = await analyzeOBJ(text);
        if (obj && obj.volume_cm3 != null) return obj;
      } catch (e) {}
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export async function analyzeBlob(file: Blob, hint?: { name?: string; type?: string }): Promise<SimpleAnalysis | null> {
  const type = hint?.type || (file as any).type || "";
  const name = (hint?.name || (file as any).name || "").toLowerCase();
  const buf = await file.arrayBuffer();
  try {
    if (type.includes("model/stl") || name.endsWith(".stl")) return await analyzeSTL(buf);
    if (name.endsWith('.step') || name.endsWith('.stp') || type.includes('application/step')) return await analyzeSTEP(buf);
    if (type.includes("model/gltf") || type.includes("model/gltf-binary") || name.endsWith(".glb") || name.endsWith(".gltf")) return await analyzeGLTF(buf);
    if (type.includes("model/obj") || name.endsWith(".obj")) { const text = new TextDecoder().decode(buf); return await analyzeOBJ(text); }
  } catch {}
  return null;
}
