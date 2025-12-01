#!/usr/bin/env node
/*
  scripts/test-step-load.mjs (ESM)
  Usage: node scripts/test-step-load.mjs "C:\path\to\file.stp"

  This ESM script mirrors the existing CJS runner but runs as native ESM so
  `three/examples/jsm/*` modules can be imported directly in Node.

  Behavior:
  - Try to import `occt-import-js`; if unavailable, fallback by copying the input file to `tmp/`.
  - If OCCT is available, parse STEP/IGES, build Three BufferGeometry, merge, compute simple metrics,
    export a binary GLB via GLTFExporter and write to `tmp/<basename>.glb`.
  - Print a JSON summary with `viewerFile`, `format`, `volumeCm3`, `areaApproxCm2`, and `bbox`.
*/

import { readFile, writeFile, copyFile, mkdir } from 'fs/promises';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

async function main() {
  try {
    console.log('SCRIPT_START');
    const input = process.argv[2];
    if (!input) {
      console.error('Usage: node scripts/test-step-load.mjs <path-to-step-file>');
      process.exit(2);
    }

    if (!fs.existsSync(input)) {
      console.error('Input file not found:', input);
      process.exit(3);
    }

    const buf = await readFile(input);
    console.log('READ_INPUT', input, 'bytes=', buf.length);
    const uint8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);

    function sanitizeName(n) {
      if (!n) return 'file';
      const parts = n.split('.');
      if (parts.length === 1) return n.replace(/[^a-zA-Z0-9._-]/g, '_');
      const ext = parts.pop();
      const baseName = parts.join('.');
      return `${baseName.replace(/[^a-zA-Z0-9._-]/g, '_')}.${ext}`;
    }

    const base = sanitizeName(path.basename(input, path.extname(input)));
    const tmpDir = path.resolve(process.cwd(), 'tmp');
    await mkdir(tmpDir, { recursive: true });

    // Try to import occt-import-js (WASM OCCT) — graceful fallback if missing
    let occtModule = null;
    try {
      const m = await import('occt-import-js');
      occtModule = m?.default ?? m;
      console.log('IMPORTED occt-import-js');
    } catch (e) {
      console.warn('occt-import-js not available:', e && e.message ? e.message : e);
      occtModule = null;
    }

    if (!occtModule) {
      // fallback: copy input to tmp and print JSON
      const outCopy = path.join(tmpDir, `${base}${path.extname(input)}`);
      await copyFile(input, outCopy);
      console.log('OCCT not available — copied input to', outCopy);
      console.log(JSON.stringify({ format: path.extname(input).replace('.', ''), volumeCm3: null, areaApproxCm2: null, bbox: null, viewerFile: outCopy }, null, 2));
      process.exit(0);
    }

    // Initialize OCCT runtime if the module exports a factory function
    let occtRuntime = null;
    try {
      if (typeof occtModule === 'function') occtRuntime = await occtModule();
      else if (occtModule && typeof occtModule.default === 'function') occtRuntime = await occtModule.default();
      else occtRuntime = occtModule;
      console.log('OCCT_INITIALISED');
    } catch (e) {
      console.warn('Error initialising occt:', e && e.message ? e.message : e);
      const outCopy = path.join(tmpDir, `${base}${path.extname(input)}`);
      await copyFile(input, outCopy);
      console.log('OCCT init failed — copied input to', outCopy);
      console.log(JSON.stringify({ format: path.extname(input).replace('.', ''), volumeCm3: null, areaApproxCm2: null, bbox: null, viewerFile: outCopy }, null, 2));
      process.exit(0);
    }

    // Probe for read function names
    const tryFns = ['readStepFile', 'ReadStepFile', 'readSTEP', 'ReadSTEP', 'readIgesFile', 'ReadIgesFile', 'readIGES', 'ReadIGES'];
    let parseFn = null;
    for (const n of tryFns) {
      if (occtRuntime && typeof occtRuntime[n] === 'function') {
        parseFn = occtRuntime[n];
        break;
      }
    }

    if (!parseFn) {
      console.error('No OCCT readStep-like function found on runtime. Available keys:', Object.keys(occtRuntime || {}));
      process.exit(4);
    }

    let result;
    try {
      // Many OCCT runtimes accept a Uint8Array or ArrayBuffer
      result = await parseFn(uint8);
      console.log('OCCT_PARSED');
    } catch (e) {
      console.error('OCCT parsing failed:', e && e.message ? e.message : e);
      process.exit(5);
    }

    // Normalize meshes array from result
    const meshes = Array.isArray(result?.meshes) && result.meshes.length ? result.meshes : (Array.isArray(result) ? result : []);
    if (!meshes.length) {
      console.error('No meshes produced by OCCT result.');
      process.exit(6);
    }
    console.log('MESH_COUNT', meshes.length);

    // Load three and examples utilities
    const THREE = await import('three');

    // Node polyfills used by GLTFExporter: FileReader is used in the exporter when
    // converting blobs to ArrayBuffer; provide a minimal shim so the exporter runs in Node.
    if (typeof globalThis.FileReader === 'undefined') {
      globalThis.FileReader = class {
        constructor() { this.result = null; this.onload = null; this.onerror = null; }
        readAsArrayBuffer(blob) {
          Promise.resolve()
            .then(() => {
              if (typeof blob.arrayBuffer === 'function') return blob.arrayBuffer();
              if (blob instanceof Uint8Array) return blob.buffer;
              throw new Error('Cannot convert blob to ArrayBuffer in FileReader polyfill');
            })
            .then((ab) => {
              this.result = ab;
              if (typeof this.onload === 'function') this.onload({ target: this });
            })
            .catch((err) => {
              if (typeof this.onerror === 'function') this.onerror(err);
            });
        }
      };
    }

    // Load BufferGeometryUtils and GLTFExporter using require.resolve -> file:// import so Node can load the package subpath
    const bufUtilsPath = require.resolve('three/examples/jsm/utils/BufferGeometryUtils.js');
    const bufUtilsMod = await import(pathToFileURL(bufUtilsPath).href);
    const BufferGeometryUtils = bufUtilsMod?.BufferGeometryUtils ?? bufUtilsMod?.default ?? bufUtilsMod;

    // Minimal GLB builder (avoid three's GLTFExporter browser reliance)
    function pad4(n) { return (4 - (n % 4)) % 4; }
    function createGlbFromGeometry(geometry) {
      // Ensure normals exist
      if (!geometry.getAttribute('normal')) geometry.computeVertexNormals();

      const posAttr = geometry.getAttribute('position');
      const normalAttr = geometry.getAttribute('normal');
      const idxAttr = geometry.getIndex();

      const positions = new Float32Array(posAttr.array);
      const normals = new Float32Array(normalAttr.array);
      let indices, indexComponentType;
      if (idxAttr) {
        const idxArray = idxAttr.array;
        const maxIndex = Math.max(...idxArray);
        if (maxIndex > 65535) {
          indices = new Uint32Array(idxArray);
          indexComponentType = 5125; // UNSIGNED_INT
        } else {
          indices = new Uint16Array(idxArray);
          indexComponentType = 5123; // UNSIGNED_SHORT
        }
      } else {
        // Build a simple index buffer from sequential triangles
        const vertCount = positions.length / 3;
        const triCount = Math.floor(vertCount / 3);
        indices = new Uint32Array(triCount * 3);
        for (let i = 0; i < triCount * 3; i++) indices[i] = i;
        indexComponentType = 5125;
      }

      // Build binary blob: indices, positions, normals
      const indexByteLength = indices.byteLength;
      const posByteLength = positions.byteLength;
      const normalByteLength = normals.byteLength;
      const binByteLength = indexByteLength + posByteLength + normalByteLength;

      const binBuffer = new ArrayBuffer(binByteLength);
      const binView = new Uint8Array(binBuffer);
      let offset = 0;
      binView.set(new Uint8Array(indices.buffer, indices.byteOffset, indexByteLength), offset); offset += indexByteLength;
      binView.set(new Uint8Array(positions.buffer, positions.byteOffset, posByteLength), offset); offset += posByteLength;
      binView.set(new Uint8Array(normals.buffer, normals.byteOffset, normalByteLength), offset); offset += normalByteLength;

      // Build glTF JSON
      const json = {
        asset: { version: '2.0', generator: 'test-step-load.mjs' },
        buffers: [{ byteLength: binByteLength }],
        bufferViews: [
          { buffer: 0, byteOffset: 0, byteLength: indexByteLength, target: 34963 },
          { buffer: 0, byteOffset: indexByteLength, byteLength: posByteLength, target: 34962 },
          { buffer: 0, byteOffset: indexByteLength + posByteLength, byteLength: normalByteLength, target: 34962 }
        ],
        accessors: [
          { bufferView: 0, byteOffset: 0, componentType: indexComponentType, count: indices.length, type: 'SCALAR' },
          { bufferView: 1, byteOffset: 0, componentType: 5126, count: positions.length / 3, type: 'VEC3', min: null, max: null },
          { bufferView: 2, byteOffset: 0, componentType: 5126, count: normals.length / 3, type: 'VEC3' }
        ],
        meshes: [
          { primitives: [ { attributes: { POSITION: 1, NORMAL: 2 }, indices: 0 } ] }
        ],
        nodes: [ { mesh: 0 } ],
        scenes: [ { nodes: [0] } ],
        scene: 0
      };

      // Fill min/max for position accessor
      const posFloats = positions;
      const min = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
      const max = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
      for (let i = 0; i < posFloats.length; i += 3) {
        for (let j = 0; j < 3; j++) {
          const v = posFloats[i + j];
          if (v < min[j]) min[j] = v;
          if (v > max[j]) max[j] = v;
        }
      }
      json.accessors[1].min = min;
      json.accessors[1].max = max;

      const jsonStr = JSON.stringify(json);
      const jsonBuf = Buffer.from(jsonStr, 'utf8');
      const jsonPad = pad4(jsonBuf.length);
      const binPad = pad4(binByteLength);

      const JSON_CHUNK_TYPE = 0x4E4F534A; // 'JSON'
      const BIN_CHUNK_TYPE = 0x004E4942; // 'BIN\0'

      const headerByteLength = 12;
      const jsonChunkLength = jsonBuf.length + jsonPad;
      const binChunkLength = binByteLength + binPad;
      const totalLength = headerByteLength + 8 + jsonChunkLength + 8 + binChunkLength;

      const glb = Buffer.alloc(totalLength);
      let p = 0;
      // header
      glb.write('glTF', p); p += 4;
      glb.writeUInt32LE(2, p); p += 4; // version
      glb.writeUInt32LE(totalLength, p); p += 4;
      // JSON chunk header
      glb.writeUInt32LE(jsonChunkLength, p); p += 4;
      glb.writeUInt32LE(JSON_CHUNK_TYPE, p); p += 4;
      jsonBuf.copy(glb, p); p += jsonBuf.length;
      if (jsonPad) { Buffer.alloc(jsonPad).copy(glb, p); p += jsonPad; }
      // BIN chunk header
      glb.writeUInt32LE(binChunkLength, p); p += 4;
      glb.writeUInt32LE(BIN_CHUNK_TYPE, p); p += 4;
      // copy bin data
      glb.set(binView, p); p += binByteLength;
      if (binPad) { Buffer.alloc(binPad).copy(glb, p); p += binPad; }

      return glb;
    }

    // Convert OCCT meshes to BufferGeometry
    const geometries = [];
    for (const m of meshes) {
      let positions = null;
      let indices = null;
      if (m?.attributes?.position) {
        positions = new Float32Array(m.attributes.position.array);
        if (m.index?.array) indices = new Uint32Array(m.index.array);
      } else if (m?.positions) {
        positions = new Float32Array(m.positions);
        if (m.indices) indices = new (m.positions.length > 65535 ? Uint32Array : Uint16Array)(m.indices);
      }
      if (!positions) continue;
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      if (indices) geom.setIndex(new THREE.BufferAttribute(indices, 1));
      geom.computeVertexNormals();
      geometries.push(geom);
    }

    if (!geometries.length) {
      console.error('After conversion no geometries available.');
      process.exit(7);
    }
    console.log('GEOMETRIES_CONVERTED', geometries.length);

    // Merge geometries
    let merged = geometries[0];
    try {
      merged = BufferGeometryUtils.mergeBufferGeometries(geometries, true);
    } catch (e) {
      // if merge fails, keep first geometry
    }

    // Compute bbox and size
    merged.computeBoundingBox();
    const bbox = merged.boundingBox;
    const size = new THREE.Vector3();
    if (bbox) bbox.getSize(size);

    // Try to compute volume with local analyzer if available
    let volume = null;
    try {
      const localPath = path.resolve(process.cwd(), 'src/cad/analyzers/meshVolume');
      // require via createRequire to load CommonJS if necessary
      const local = require(localPath);
      const computeMeshVolume = local.computeMeshVolume ?? local.default ?? local;
      if (typeof computeMeshVolume === 'function') volume = computeMeshVolume(merged);
    } catch (e) {
      try {
        // Approximate via signed tetrahedron sum
        const pos = merged.getAttribute('position');
        const idx = merged.getIndex();
        if (pos && idx) {
          let v = 0;
          const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
          for (let i = 0; i < idx.count; i += 3) {
            const ia = idx.getX(i), ib = idx.getX(i + 1), ic = idx.getX(i + 2);
            a.set(pos.getX(ia), pos.getY(ia), pos.getZ(ia));
            b.set(pos.getX(ib), pos.getY(ib), pos.getZ(ib));
            c.set(pos.getX(ic), pos.getY(ic), pos.getZ(ic));
            v += a.dot(b.clone().cross(c));
          }
          volume = Math.abs(v / 6) / 1000; // rough mm^3->cm^3 assumption
        }
      } catch (ee) {
        volume = null;
      }
    }

    const areaApprox = size.x * size.y;

    // Create GLB with a minimal glTF builder (avoids browser-only GLTFExporter)
    console.log('BUILDING_GLTF_BINARY');
    const glbBuffer = createGlbFromGeometry(merged);
    const outGlb = path.join(tmpDir, `${base}.glb`);
    await writeFile(outGlb, glbBuffer);
    console.log('WROTE_GLTF (manual builder):', outGlb);

    console.log('WROTE_GLTF:', outGlb);
    console.log(JSON.stringify({ format: path.extname(input).replace('.', ''), volumeCm3: volume, areaApproxCm2: areaApprox, bbox: { x: size.x, y: size.y, z: size.z }, viewerFile: outGlb }, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err && err.stack ? err.stack : err);
    process.exit(99);
  }
}

main();
