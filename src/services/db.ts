// IndexedDB helper for storing drawing files (blobs)

const DB_NAME = "appdb";
const DB_VERSION = 1;
const STORE_DRAWINGS = "drawings";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_DRAWINGS)) {
        db.createObjectStore(STORE_DRAWINGS, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDrawingFile(id: string, file: Blob & { type?: string }) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_DRAWINGS, "readwrite");
    const store = tx.objectStore(STORE_DRAWINGS);
    const data = { id, blob: file, type: (file as any).type || "application/octet-stream" } as any;
    store.put(data);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function deleteDrawingFile(id: string) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_DRAWINGS, "readwrite");
    tx.objectStore(STORE_DRAWINGS).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function getDrawingURL(id: string): Promise<{ url: string; type: string } | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DRAWINGS, "readonly");
    const req = tx.objectStore(STORE_DRAWINGS).get(id);
    req.onsuccess = () => {
      const val = req.result as { blob: Blob; type: string } | undefined;
      if (!val) return resolve(null);
      const url = URL.createObjectURL(val.blob);
      resolve({ url, type: val.type });
    };
    req.onerror = () => reject(req.error);
  });
}

export function revokeURL(url: string) {
  URL.revokeObjectURL(url);
}

export async function getDrawingBlob(id: string): Promise<{ blob: Blob; type: string } | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DRAWINGS, "readonly");
    const req = tx.objectStore(STORE_DRAWINGS).get(id);
    req.onsuccess = () => {
      const val = req.result as { blob: Blob; type: string } | undefined;
      if (!val) return resolve(null);
      resolve({ blob: val.blob, type: val.type });
    };
    req.onerror = () => reject(req.error);
  });
}
