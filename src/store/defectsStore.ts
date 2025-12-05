// Defects store implemented without Zustand to comply with architecture rules
// (only the canonical stores in `src/stores` may use Zustand).
// This module exposes a React hook `useDefectsStore` that mirrors the
// previous API while using `useSyncExternalStore` internally.

import { useSyncExternalStore } from "react";

export type DefectPin = {
  id: string;
  face: "front" | "back";
  x: number; // 0..1 normalized
  y: number; // 0..1 normalized
  rotation_deg: 0 | 90 | 180 | 270;
  defect: string; // defect type label
  severity: number; // 1..5
  notes?: string;
};

type DefectsState = {
  pins: DefectPin[];
  selectedPin: string | null;
  addPin: (p: Omit<DefectPin, "id">) => void;
  removePin: (id: string) => void;
  updatePin: (id: string, updates: Partial<DefectPin>) => void;
  clearAll: () => void;
  setSelectedPin: (id: string | null) => void;
};

let pins: DefectPin[] = [];
let selectedPin: string | null = null;
const subs = new Set<() => void>();

const genId = () => Math.random().toString(36).slice(2, 10);

function notify() {
  for (const s of Array.from(subs)) s();
}

export function addPin(p: Omit<DefectPin, "id">) {
  const newPin: DefectPin = { ...p, id: genId() } as DefectPin;
  pins = [...pins, newPin];
  selectedPin = newPin.id;
  notify();
}

export function removePin(id: string) {
  pins = pins.filter((x) => x.id !== id);
  if (selectedPin === id) selectedPin = null;
  notify();
}

export function updatePin(id: string, updates: Partial<DefectPin>) {
  pins = pins.map((x) => (x.id === id ? { ...x, ...updates } : x));
  notify();
}

export function clearAll() {
  pins = [];
  selectedPin = null;
  notify();
}

export function setSelectedPin(id: string | null) {
  selectedPin = id;
  notify();
}

function getSnapshot(): DefectsState {
  return {
    pins,
    selectedPin,
    addPin,
    removePin,
    updatePin,
    clearAll,
    setSelectedPin,
  };
}

function subscribe(cb: () => void) {
  subs.add(cb);
  return () => subs.delete(cb);
}

export function useDefectsStore(): DefectsState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export default useDefectsStore;