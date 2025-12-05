// Non-Zustand compatibility user store
// Architecture rule: only the four canonical Zustand stores are allowed.
// This module provides a lightweight, React-friendly hook backed by a
// module-scoped state and `useSyncExternalStore` so we don't introduce
// another Zustand store under `src/store`.

import { useSyncExternalStore } from "react";

export interface User {
  id: string;
  name: string;
  role: "operatore" | "tecnico" | "admin";
  token: string;
}

interface UserState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

let currentUser: User | null = null;
const subscribers = new Set<() => void>();

function notify() {
  for (const s of Array.from(subscribers)) s();
}

export function login(user: User) {
  currentUser = user;
  notify();
}

export function logout() {
  currentUser = null;
  notify();
}

function getSnapshot(): UserState {
  return {
    user: currentUser,
    login,
    logout,
  };
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

export function useUserStore<T = UserState>(selector?: (s: UserState) => T): T {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (typeof selector === 'function') return selector(snap) as T;
  return (snap as unknown) as T;
}

// compatibility: provide getState() like Zustand for legacy callers
(useUserStore as any).getState = () => getSnapshot();

export default useUserStore;
