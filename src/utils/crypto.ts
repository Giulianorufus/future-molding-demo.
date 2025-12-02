// Utility per validazione e cifratura temporanea dei file in ambiente browser.
const ALLOWED_EXT = ['pdf','dxf','dwg','step','stp','igs','iges','stl','gltf','obj'];
// Use Vite env (import.meta.env) in browser; fallback to 15MB if not set
const MAX_UPLOAD_BYTES = Number((typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_MAX_UPLOAD_BYTES || import.meta.env.REACT_APP_MAX_UPLOAD_BYTES)) || 15 * 1024 * 1024);

function extFromName(name: string) {
  return (name.split('.').pop() || '').toLowerCase();
}

export function validateFileBasic(file: File) {
  const ext = extFromName(file.name);
  if (!ALLOWED_EXT.includes(ext)) return { ok: false, reason: 'extension' };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, reason: 'size' };
  // MIME check best-effort
  if (file.type && file.type !== '' ) {
    // allow generic octet-stream for many CAD files
    const allowedMimes = ['application/pdf','application/octet-stream','model/stl','model/gltf+json','text/plain','application/x-step','application/vnd.dxf'];
    if (!allowedMimes.some(m => file.type.includes(m) || m.includes(file.type))) {
      // not fatal: allow but flag
      return { ok: true, warning: 'mimetype' };
    }
  }
  return { ok: true };
}

// Browser WebCrypto AES-GCM 256 wrapper. If not available, returns null to indicate fallback.
export async function generateAesKey() {
  try {
    const cryptoObj: any = (typeof window !== 'undefined' && (window.crypto || (globalThis as any).crypto)) ? (window.crypto as any) : (globalThis as any).crypto;
    if (!cryptoObj || !cryptoObj.subtle) return null;
    const key = await cryptoObj.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt','decrypt']);
    return key;
  } catch (e) {
    return null;
  }
}

function randomIv() {
  const iv = new Uint8Array(12);
  if (typeof window !== 'undefined' && (window.crypto || (globalThis as any).crypto)) {
    (window.crypto || (globalThis as any).crypto).getRandomValues(iv);
  } else {
    for (let i=0;i<12;i++) iv[i] = Math.floor(Math.random()*256);
  }
  return iv;
}

export async function encryptFileToBlob(file: File, key: CryptoKey | null) {
  if (!key) {
    // fallback: return original file as blob
    return { blob: file.slice(0, file.size, file.type), iv: null };
  }

  const cryptoObj: any = (typeof window !== 'undefined' && (window.crypto || (globalThis as any).crypto)) ? (window.crypto as any) : (globalThis as any).crypto;
  const iv = randomIv();
  const ab = await file.arrayBuffer();
  const encrypted = await cryptoObj.subtle.encrypt({ name: 'AES-GCM', iv }, key, ab);
  const blob = new Blob([new Uint8Array(encrypted)], { type: 'application/octet-stream' });
  return { blob, iv: bufferToBase64(iv) };
}

export async function decryptBlobToFile(blob: Blob, key: CryptoKey | null, ivBase64: string | null, filename = 'file.bin', origType = '') {
  if (!key || !ivBase64) {
    // fallback: return original blob
    return new File([blob], filename, { type: origType || blob.type });
  }
  const cryptoObj: any = (typeof window !== 'undefined' && (window.crypto || (globalThis as any).crypto)) ? (window.crypto as any) : (globalThis as any).crypto;
  const iv = base64ToBuffer(ivBase64);
  const ab = await blob.arrayBuffer();
  const decrypted = await cryptoObj.subtle.decrypt({ name: 'AES-GCM', iv }, key, ab);
  return new File([new Uint8Array(decrypted)], filename, { type: origType || 'application/octet-stream' });
}

function bufferToBase64(buf: BufferSource) {
  let bytes: Uint8Array;
  if (buf instanceof ArrayBuffer) {
    bytes = new Uint8Array(buf);
  } else {
    const view = buf as ArrayBufferView;
    bytes = new Uint8Array(view.buffer, view.byteOffset || 0, view.byteLength || view.buffer.byteLength);
  }
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export { MAX_UPLOAD_BYTES };
