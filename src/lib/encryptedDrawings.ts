import { deriveKey, encryptJson, decryptJson } from "./crypto";
import { useSecurityStore } from "../store/securityStore";

export async function saveEncryptedDrawings(data: unknown) {
  const pwd = useSecurityStore.getState().password;
  if (!pwd) throw new Error("Encryption password not set");
  const key = await deriveKey(pwd);
  const payload = await encryptJson(key, data);
  localStorage.setItem("fm_drawings", payload);
}

export async function loadEncryptedDrawings<T>(): Promise<T | null> {
  const payload = localStorage.getItem("fm_drawings");
  if (!payload) return null;
  const pwd = useSecurityStore.getState().password;
  if (!pwd) throw new Error("Encryption password not set");
  const key = await deriveKey(pwd);
  return decryptJson<T>(key, payload);
}

export default { saveEncryptedDrawings, loadEncryptedDrawings };
