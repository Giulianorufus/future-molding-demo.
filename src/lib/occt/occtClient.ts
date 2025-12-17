// OCCT client adapter: single access point for loading OCCT/WASM and reading STEP
type OcctModule = any;

let occtPromise: Promise<OcctModule> | null = null;

async function loadOcct(): Promise<OcctModule> {
  const mod: any = await import('occt-import-js');
  const factory = mod?.default ?? mod;
  if (typeof factory !== 'function') {
    throw new Error('OCCT import mismatch: expected factory function (default or module export).');
  }
  return await factory();
}

export async function getOCCT(): Promise<OcctModule> {
  if (!occtPromise) occtPromise = loadOcct();
  return occtPromise;
}

export async function readSTEP(input: ArrayBuffer | Uint8Array): Promise<any> {
  const occt = await getOCCT();
  const fn =
    occt?.readStepFile ??
    occt?.ReadStepFile ??
    occt?.ReadSTEPFile ??
    occt?.readSTEP ??
    occt?.readSTEPFile ??
    occt?.ReadSTEP;

  if (typeof fn !== 'function') {
    throw new Error('OCCT API mismatch: no STEP reader found (readStepFile/ReadStepFile/readSTEP/ReadSTEP).');
  }

  // Some OCCT readers accept (Uint8Array, opts) others (Uint8Array, fileName)
  const data = input instanceof Uint8Array ? input : new Uint8Array(input);
  try {
    return await Promise.resolve(fn.call(occt, data, null));
  } catch (e) {
    return await Promise.resolve(fn.call(occt, data, 'model.step'));
  }
}

export default { getOCCT, readSTEP };
