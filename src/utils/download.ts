// src/utils/download.ts
export function downloadBytes(
  filename: string,
  bytes: Uint8Array,
  mime = 'application/octet-stream'
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const blob = new Blob([bytes as any], { type: mime });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a') as HTMLAnchorElement;
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';

  const body = document.body as HTMLBodyElement | null;
  if (!body) return;
  body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadText(
  filename: string,
  text: string,
  mime = 'text/plain; charset=utf-8'
): void {
  const bytes = new TextEncoder().encode(text);
  downloadBytes(filename, bytes, mime);
}

export function downloadBlob(
  filename: string,
  blobOrBuffer: Blob | string | Uint8Array
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  if (blobOrBuffer instanceof Blob) {
    const url = URL.createObjectURL(blobOrBuffer);
    const a = document.createElement('a') as HTMLAnchorElement;
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.style.display = 'none';
    const body = document.body as HTMLBodyElement | null;
    if (!body) return;
    body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    return;
  }

  if (blobOrBuffer instanceof Uint8Array) {
    downloadBytes(filename, blobOrBuffer, 'application/octet-stream');
    return;
  }

  downloadText(filename, String(blobOrBuffer));
}
