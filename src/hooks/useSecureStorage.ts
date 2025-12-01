import { useCallback } from "react";
import { deriveKey, encryptJson, decryptJson } from "@/lib/crypto";
import { useSecurityStore } from "@/store/securityStore";

const STORAGE_PREFIX = "fm:";

function storageKey(key: string) {
  return `${STORAGE_PREFIX}${key}`;
}

export function useSecureStorage() {
  const { password, keyReady } = useSecurityStore();

  const setItem = useCallback(
    async (key: string, data: unknown) => {
      const k = storageKey(key);
      if (keyReady && password) {
        try {
          const cryptoKey = await deriveKey(password);
          const cipher = await encryptJson(cryptoKey, data);
          localStorage.setItem(k, cipher);
        } catch (err) {
          console.error("encrypt setItem failed", err);
          // Fallback: store plain
          localStorage.setItem(k, JSON.stringify(data));
        }
      } else {
        // No password set: store plain (backwards compatibility)
        localStorage.setItem(k, JSON.stringify(data));
      }
    },
    [keyReady, password]
  );

  const getItem = useCallback(
    async <T = any>(key: string): Promise<T | null> => {
      const k = storageKey(key);
      const raw = localStorage.getItem(k);
      if (!raw) return null;
      if (keyReady && password) {
        try {
          const cryptoKey = await deriveKey(password);
          const dec = await decryptJson<T>(cryptoKey, raw);
          return dec;
        } catch (err) {
          // If decryption fails, try to parse as plain JSON
          try {
            return JSON.parse(raw) as T;
          } catch (e) {
            console.error("decrypt getItem failed", err, e);
            return null;
          }
        }
      }
      try {
        return JSON.parse(raw) as T;
      } catch (e) {
        console.error("parse getItem failed", e);
        return null;
      }
    },
    [keyReady, password]
  );

  // Convenience wrappers for drawings
  const setDrawings = useCallback(async (data: unknown) => setItem("drawings", data), [setItem]);
  const getDrawings = useCallback(async <T = any>() => getItem<T>("drawings"), [getItem]);

  return {
    setItem,
    getItem,
    setDrawings,
    getDrawings,
  };
}

export default useSecureStorage;
