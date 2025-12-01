// Simple integrity helper: compute SHA-256 of a string in both browser and Node
export async function sha256Hex(input: string) {
  if (typeof window !== 'undefined' && (window.crypto || (globalThis as any).crypto)) {
    const enc = new TextEncoder();
    const data = enc.encode(input);
    const hash = await (window.crypto as any).subtle.digest('SHA-256', data);
    return bufferToHex(hash);
  }
  // Node fallback
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(input).digest('hex');
  } catch (_) {
    return '';
  }
}

function bufferToHex(buf: ArrayBufferLike) {
  const bytes = new Uint8Array(buf as any);
  let s = '';
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, '0');
  }
  return s;
}
