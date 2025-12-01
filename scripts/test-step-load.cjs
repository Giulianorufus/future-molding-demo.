/*
  scripts/test-step-load.cjs
  Usage: node scripts/test-step-load.cjs "C:\path\to\file.stp"

  This script is CommonJS and tries to:
  - load occt-import-js dynamically (support both require/import)
  - parse STEP/IGES (defensive function names)
  - build Three BufferGeometry objects and merge them
  - export a GLB via GLTFExporter and write to tmp/

  It writes a GLB to ./tmp/<basename>.glb and prints metrics to stdout.
*/

(async () => {
  try {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    const input = process.argv[2];
    if (!input) {
      console.error('Usage: node scripts/test-step-load.cjs <path-to-step-file>');
      process.exit(2);
    }

    if (!fs.existsSync(input)) {
      console.error('Input file not found:', input);
      process.exit(3);
    }

    // load occt-import-js (try require then dynamic import)
    let occtModule;
    try {
      occtModule = require('occt-import-js');
      occtModule = occtModule.default ?? occtModule;
    } catch (e) {
      try {
        const m = await import('occt-import-js');
        occtModule = (m.default ?? m);
      } catch (ie) {
        console.warn('occt-import-js not available:', ie && ie.message ? ie.message : ie);
        occtModule = null;
      }
    }

    // read file
    const buf = fs.readFileSync(input);
    const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    const uint8 = new Uint8Array(arrayBuffer);

    // Helper to write any ArrayBuffer to a file
    function writeArrayBufferToFile(ab, outPath) {
      const b = Buffer.from(ab);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, b);
    }

    // Fallback: if occt not available, just copy the original file to tmp and exit
    const base = path.basename(input, path.extname(input));
    const tmpDir = path.resolve(process.cwd(), 'tmp');

    if (!occtModule) {
      const outCopy = path.join(tmpDir, `${base}.step`);
      fs.mkdirSync(tmpDir, { recursive: true });
      fs.copyFileSync(input, outCopy);
      console.log('OCCT not available — copied input to', outCopy);
      console.log(JSON.stringify({ format: 'step', volumeCm3: null, areaApproxCm2: null, bbox: null, viewerFile: outCopy }, null, 2));
      process.exit(0);
    }

    // factory() might be a function that initialises WASM/runtime
    let occtRuntime;
    try {
      if (typeof occtModule === 'function') occtRuntime = await occtModule();
      else if (occtModule && typeof occtModule.default === 'function') occtRuntime = await occtModule.default();
      else occtRuntime = occtModule;
    } catch (e) {
      console.warn('Error initialising occt:', e && e.message ? e.message : e);
      const outCopy = path.join(tmpDir, `${base}.step`);
      fs.mkdirSync(tmpDir, { recursive: true });
      fs.copyFileSync(input, outCopy);
      console.log('OCCT init failed — copied input to', outCopy);
      console.log(JSON.stringify({ format: 'step', volumeCm3: null, areaApproxCm2: null, bbox: null, viewerFile: outCopy }, null, 2));
      process.exit(0);
    }

    // probe for parse function
    const tryFns = ['readStepFile', 'ReadStepFile', 'readSTEP', 'ReadSTEP'];
    let parseFn = null;
    for (const n of tryFns) {
      if (typeof occtRuntime[n] === 'function') {
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
      result = parseFn(uint8);
    } catch (e) {
      console.error('occt parsing failed:', e && e.message ? e.message : e);
      process.exit(5);
    }

    // Collect meshes
    const meshes = Array.isArray(result?.meshes) && result.meshes.length ? result.meshes : Array.isArray(result) && result.length ? result : [];
    if (!meshes.length) {
      console.error('No meshes produced by OCCT result.');
      process.exit(6);
    }

    // Build BufferGeometries via three
    const THREE = require('three');

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

    // Merge geometries (BufferGeometryUtils)
    let merged = geometries[0];
    try {
      // Resolve actual file path then import as file:// URL so Node can load ESM from package subpath
      const { pathToFileURL } = require('url');
      const bufUtilsPath = require.resolve('three/examples/jsm/utils/BufferGeometryUtils');
      const bufUtilsMod = await import(pathToFileURL(bufUtilsPath).href);
      const BufferGeometryUtils = bufUtilsMod?.BufferGeometryUtils ?? bufUtilsMod?.default ?? bufUtilsMod;
      merged = BufferGeometryUtils.mergeBufferGeometries(geometries, true);
    } catch (e) {
      // keep first
    }

    // Compute bbox and simple metrics
    merged.computeBoundingBox();
    const bbox = merged.boundingBox;
    const size = new THREE.Vector3();
    if (bbox) bbox.getSize(size);

    // Try computeMeshVolume from project if available
    let volume = null;
    try {
      // Try to require local analyzer
      const { computeMeshVolume } = require('../src/cad/analyzers/meshVolume');
      volume = computeMeshVolume(merged);
    } catch (e) {
      try {
        // approximate
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
            v += a.dot(b.cross(c));
          }
          volume = Math.abs(v / 6) / 1000; // mm3 -> cm3 assumption
        }
      } catch (ee) {
        volume = null;
      }
    }

    const areaApprox = size.x * size.y;

    // Export GLB: GLTFExporter (dynamic import because examples are ESM)
    const { pathToFileURL } = require('url');
    const expPath = require.resolve('three/examples/jsm/exporters/GLTFExporter');
    const expMod = await import(pathToFileURL(expPath).href);
    const GLTFExporter = expMod?.GLTFExporter ?? expMod?.default ?? expMod;
    if (!GLTFExporter) {
      console.error('GLTFExporter not available');
      process.exit(8);
    }

    const exporter = new GLTFExporter();
    const glbArrayBuffer = await new Promise((resolve, reject) => {
      exporter.parse(
        merged,
        (res) => {
          if (res instanceof ArrayBuffer) resolve(res);
          else reject(new Error('GLTFExporter returned non-ArrayBuffer'));
        },
        (err) => reject(err),
        { binary: true }
      );
    });

    const outGlb = path.join(tmpDir, `${base}.glb`);
    writeArrayBufferToFile(glbArrayBuffer, outGlb);

    console.log('WROTE_GLTF:', outGlb);
    console.log(JSON.stringify({ format: 'step', volumeCm3: volume, areaApproxCm2: areaApprox, bbox: { x: size.x, y: size.y, z: size.z }, viewerFile: outGlb }, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err && err.stack ? err.stack : err);
    process.exit(99);
  }
})();
