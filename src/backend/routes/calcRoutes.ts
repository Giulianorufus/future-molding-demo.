import { Router } from "express";
import { authMiddleware } from "../auth";
import { z } from "zod";
import { adjustParametersLocal } from "../../lib/adjustParametersLocal";
import multer from 'multer';
import path from 'path';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();

// ===== VALIDAZIONE INPUT =====
const bodySchema = z.object({
  marca: z.string(),
  modello: z.string(),
  vite: z.number().nullable(),
  materiale: z.object({
    name: z.string(),
    meltMin: z.number().optional(),
    meltMax: z.number().optional(),
    moldMin: z.number().optional(),
    moldMax: z.number().optional()
  }).nullable()
});

// ===== FUNZIONI DI BASE INDUSTRIALI =====

// Portata volumetrica teorica (cm3/s)
function calcPortata(viteDiametro: number, velocitaVite: number) {
  // area vite (mm²) → cm²
  const area = (Math.PI * (viteDiametro ** 2) / 4) / 100;
  // portata cm³/s
  return area * velocitaVite;
}

// Cambio fase (cm³) in base al volume del pezzo
function calcCambioFase(volume: number) {
  return volume * 0.92; // 92% del volume totale come regola base
}

// Pressione massima in base al diametro vite
function calcPressioneMax(vite: number) {
  if (vite < 18) return 900;
  if (vite < 22) return 800;
  if (vite < 30) return 750;
  return 700;
}

// Pressione mantenimento = % della max
function calcPressioneMantenimento(pressioneMax: number) {
  return Math.round(pressioneMax * 0.62); // ~62%
}

// Profili di velocità
function calcProfiliVelocita(portata: number) {
  return {
    step1: portata * 0.60,
    step2: portata * 0.80,
    step3: portata * 1.00
  };
}

// Tempo raffreddamento
function calcRaffreddamento(spessoreMedio: number) {
  return Math.max(8, spessoreMedio * 1.8); // formula semplificata
}

// Clamp richiesto
function calcClamp(volume: number) {
  // formula approssimata: 400 bar di pressione specifica * area proiettata stimata
  const area = Math.cbrt(volume) ** 2; // stima area da volume
  return Math.round(area * 400 / 1000); // kN → ton
}

// ===============================================================
//                   ROUTE PRINCIPALE DI CALCOLO
// ===============================================================
router.post("/auto", authMiddleware, async (req, res) => {
  try {
    const data = bodySchema.parse(req.body);

    const vite = data.vite ?? 25;
    const materiale = data.materiale ?? { name: 'Generic' } as any;

    // In futuro il volume arriva dal CAD:
    const volumePezzo = 20; // placeholder, cm³
    const spessore = 2.5;   // mm → placeholder
    const velocitaVite = 60; // mm/s → standard Arburg piccoli medi

    // ===== CALCOLI BASE =====
    const portata = calcPortata(vite, velocitaVite);
    const pressioneMax = calcPressioneMax(vite);
    const pressioneMant = calcPressioneMantenimento(pressioneMax);
    const cambioFase = calcCambioFase(volumePezzo);
    const profili = calcProfiliVelocita(portata);
    const raffreddamento = calcRaffreddamento(spessore);
    const clamp = calcClamp(volumePezzo);

    // ===== COSTRUIAMO OUTPUT BASE =====
    let output: any = {
      volumePezzo,
      spessore,
      viteDiametro: vite,
      materiale: materiale.name,

      melt: materiale.meltMin ? materiale.meltMin + 10 : 230,
      stampo: materiale.moldMin ? materiale.moldMin + 5 : 40,

      velocitaVite,
      portataCm3Sec: Number(portata.toFixed(1)),

      velocita: {
        step1: Number(profili.step1.toFixed(1)),
        step2: Number(profili.step2.toFixed(1)),
        step3: Number(profili.step3.toFixed(1))
      },

      pressioneMax,
      pressioneMantenimento: pressioneMant,

      cambioFaseCm3: Number(cambioFase.toFixed(1)),
      raffreddamento: Number(raffreddamento.toFixed(1)),

      clampTon: clamp,

      note: "Calcolo automatico completato (Motore locale Future Molding)."
    };

    // ===== APPLICHIAMO LE CORREZIONI DIFETTI SE CI SONO =====
    if (req.body.defects) {
      output = {
        ...output,
        ...adjustParametersLocal({
          injectionParams: output,
          defects: req.body.defects
        })
      };
    }

    return res.json(output);

  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Route: /api/calc/analyze
// Accetta multipart/form-data con campo `file` e restituisce analisi CAD (volume, area proiettata, spessori stimati, ecc.)
router.post('/analyze', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nessun file ricevuto (field "file").' });
    const originalName = req.file.originalname || 'upload.bin';
    const ext = path.extname(originalName).toLowerCase();
    const buffer: Buffer = req.file.buffer;

    // Fast path: STL (ascii o binario)
    if (ext === '.stl') {
      try {
        const analysis = analyzeSTLBuffer(buffer);
        return res.json({ format: 'stl', ...analysis });
      } catch (stlErr: any) {
        // fallthrough to fallback
        console.warn('STL parse failed:', stlErr && stlErr.message);
      }
    }

    // Try OCCT-based parsing for STEP/IGES if available
    if (['.step', '.stp', '.iges', '.igs'].includes(ext)) {
      try {
        // dynamic import to avoid startup penalty when not used
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const occt = await import('occt-import-js');
        if (occt && typeof (occt as any).importStep === 'function') {
          // Common API unknown across versions: attempt to call a plausible method
          const resGeom = await (occt as any).importStep(buffer);
          // Expect resGeom to contain approximate fields. If not, fallback
          if (resGeom && (resGeom.volume || resGeom.volume_cm3 || resGeom.area_cm2)) {
            return res.json({ format: 'step', volume: resGeom.volume || resGeom.volume_cm3, area: resGeom.area || resGeom.area_cm2, raw: resGeom });
          }
        }
      } catch (e) {
        console.warn('occt-import-js unavailable or failed:', e && e.message);
      }
    }

    // Fallback: estimi semplici basate su dimensione file e, per STL, parsing robusto già gestito
    const fileSizeMB = buffer.length / (1024 * 1024);
    const estimatedVolume = Math.max(5, Math.min(3000, fileSizeMB * 15));
    const estimatedThickness = fileSizeMB > 2 ? 2.5 : 1.8;
    return res.json({
      format: ext || 'unknown',
      volume: Number(estimatedVolume.toFixed(2)),
      thickness_min: Number((estimatedThickness * 0.8).toFixed(2)),
      thickness_max: Number((estimatedThickness * 1.5).toFixed(2)),
      surface_area: Number((estimatedVolume * 8).toFixed(2)),
      projectedArea_cm2: Number((Math.sqrt(estimatedVolume) * 4).toFixed(2)),
      warnings: ['Parsing avanzato non disponibile — risultato stimato da dimensione file']
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || String(err) });
  }
});

// Route: /api/calc/convert
// Accetta STEP/IGES e prova a convertire in GLB/GLTF usando occt-import-js se disponibile.
router.post('/convert', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nessun file ricevuto (field "file").' });
    const originalName = req.file.originalname || 'upload.step';
    const ext = path.extname(originalName).toLowerCase();
    const buffer: Buffer = req.file.buffer;

    if (!['.step', '.stp', '.iges', '.igs'].includes(ext)) {
      return res.status(400).json({ error: 'Formato non supportato per la conversione. Usa STEP/IGES.' });
    }

    try {
      // dynamic import
      const occt = await import('occt-import-js');
      // try common import method names
      const importFn = (occt as any).importStep || (occt as any).loadStep || (occt as any).parseStep;
      if (!importFn) throw new Error('occt-import-js non espone una funzione di import STEP conosciuta');

      const geom = await importFn(buffer);

      // try to export GLB/GLTF
      const exportGLB = (occt as any).exportGLB || (occt as any).toGLB || (occt as any).exportGltfBinary;
      if (typeof exportGLB === 'function') {
        const out = await exportGLB(geom);
        // out could be ArrayBuffer or Buffer-like
        const outBuf = Buffer.isBuffer(out) ? out : Buffer.from(out);
        res.setHeader('Content-Type', 'model/gltf-binary');
        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(originalName, ext)}.glb"`);
        return res.send(outBuf);
      }

      // fallback: export JSON/glTF if available
      const exportGltf = (occt as any).exportGltf || (occt as any).toGltf || (occt as any).exportGLTF;
      if (typeof exportGltf === 'function') {
        const gltf = await exportGltf(geom);
        return res.json({ gltf });
      }

      return res.status(501).json({ error: 'occt-import-js installato ma non supporta esportazione GLB/GLTF nella versione corrente.' });
    } catch (e: any) {
      console.warn('STEP conversion failed:', e && e.message);
      return res.status(502).json({ error: 'Conversione STEP non disponibile: ' + (e?.message || String(e)) });
    }

  } catch (err: any) {
    return res.status(500).json({ error: err?.message || String(err) });
  }
});

// --- Helper: parse STL from Buffer (ascii or binary) and return simplified analysis ---
function analyzeSTLBuffer(buffer: Buffer) {
  const textHeader = buffer.slice(0, 5).toString('utf8').toLowerCase();
  let positions: number[] | null = null;
  if (textHeader.startsWith('solid')) {
    // ASCII STL
    const text = buffer.toString('utf8');
    positions = parseSTLAsciiBuffer(text);
  } else {
    positions = parseSTLBinaryBuffer(buffer);
  }

  if (!positions || positions.length === 0) throw new Error('STL non valido o vuoto');

  // Bounding box
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i], y = positions[i+1], z = positions[i+2];
    if (x < minX) minX = x; if (y < minY) minY = y; if (z < minZ) minZ = z;
    if (x > maxX) maxX = x; if (y > maxY) maxY = y; if (z > maxZ) maxZ = z;
  }
  const sizeX = maxX - minX; const sizeY = maxY - minY; const sizeZ = maxZ - minZ;

  // Volume estimate (mm^3 -> cm^3)
  const volume_mm3 = sizeX * sizeY * sizeZ * 0.3; // heuristic used in client
  const volume_cm3 = Math.round((volume_mm3 / 1000) * 100) / 100;

  // surface area approx via triangle loop
  let surface_area_mm2 = 0;
  for (let i = 0; i < positions.length; i += 9) {
    const v1 = { x: positions[i], y: positions[i+1], z: positions[i+2] };
    const v2 = { x: positions[i+3], y: positions[i+4], z: positions[i+5] };
    const v3 = { x: positions[i+6], y: positions[i+7], z: positions[i+8] };
    const ax = v2.x - v1.x, ay = v2.y - v1.y, az = v2.z - v1.z;
    const bx = v3.x - v1.x, by = v3.y - v1.y, bz = v3.z - v1.z;
    const cx = ay * bz - az * by;
    const cy = az * bx - ax * bz;
    const cz = ax * by - ay * bx;
    const crossLen = Math.sqrt(cx*cx + cy*cy + cz*cz);
    surface_area_mm2 += crossLen * 0.5;
  }
  const surface_area_cm2 = Math.round((surface_area_mm2 / 100) * 100) / 100;

  const thickness_min = Math.max(0.5, Math.min(10, Math.min(sizeX, sizeY, sizeZ) * 0.1));
  const thickness_max = Math.max(thickness_min + 0.5, Math.max(sizeX, sizeY, sizeZ) * 0.3);

  const projectedArea_cm2 = Math.round((Math.max(sizeX * sizeY, sizeY * sizeZ, sizeX * sizeZ) / 100) * 100) / 100;

  const warnings: string[] = [];
  if (thickness_min < 1.2) warnings.push('Zone sottili rilevate (<1.2mm)');

  return {
    volume: volume_cm3,
    thickness_min: Math.round(thickness_min * 100) / 100,
    thickness_max: Math.round(thickness_max * 100) / 100,
    surface_area: surface_area_cm2,
    projectedArea_cm2,
    warnings
  };
}

function parseSTLAsciiBuffer(text: string): number[] {
  const vertices: number[] = [];
  const lines = text.split(/\r?\n/);
  let currentNormal = [0,0,0];
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('facet normal')) {
      const parts = line.split(/\s+/);
      currentNormal = [parseFloat(parts[2]) || 0, parseFloat(parts[3]) || 0, parseFloat(parts[4]) || 0];
    } else if (line.startsWith('vertex')) {
      const parts = line.split(/\s+/);
      vertices.push(parseFloat(parts[1]) || 0, parseFloat(parts[2]) || 0, parseFloat(parts[3]) || 0);
    }
  }
  return vertices;
}

function parseSTLBinaryBuffer(buffer: Buffer): number[] {
  const view = buffer;
  // Skip 80-byte header
  let offset = 80;
  if (buffer.length < 84) return [];
  const numTriangles = buffer.readUInt32LE(offset);
  offset += 4;
  const vertices: number[] = [];
  for (let i = 0; i < numTriangles; i++) {
    if (offset + 50 > buffer.length) break;
    // normal floats
    const nx = buffer.readFloatLE(offset); offset += 4;
    const ny = buffer.readFloatLE(offset); offset += 4;
    const nz = buffer.readFloatLE(offset); offset += 4;
    // three vertices
    for (let v = 0; v < 3; v++) {
      const x = buffer.readFloatLE(offset); offset += 4;
      const y = buffer.readFloatLE(offset); offset += 4;
      const z = buffer.readFloatLE(offset); offset += 4;
      vertices.push(x, y, z);
    }
    // attribute byte count
    offset += 2;
  }
  return vertices;
}

export default router;
