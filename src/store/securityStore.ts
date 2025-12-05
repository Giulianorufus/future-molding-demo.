// Lightweight security store without Zustand to comply with architecture rules
import { useSyncExternalStore } from "react";

interface SecurityState {
  keyReady: boolean;
  password: string | null;
  setPassword: (pwd: string) => void;
}

let keyReady = false;
let password: string | null = null;
const subs = new Set<() => void>();

function notify() {
  for (const s of Array.from(subs)) s();
}

export function setPassword(pwd: string) {
  password = pwd;
  keyReady = true;
  notify();
}

function getSnapshot(): SecurityState {
  return { keyReady, password, setPassword };
}

function subscribe(cb: () => void) {
  subs.add(cb);
  return () => subs.delete(cb);
}

export function useSecurityStore(): SecurityState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
// compatibility: provide getState() similar to Zustand for legacy synchronous access
(useSecurityStore as any).getState = () => getSnapshot();
export function getSecurityState(): SecurityState {
  return getSnapshot();
}

export default useSecurityStore;
