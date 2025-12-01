import { create } from "zustand";

interface SecurityState {
  keyReady: boolean;
  password: string | null;
  setPassword: (pwd: string) => void;
}

export const useSecurityStore = create<SecurityState>((set) => ({
  keyReady: false,
  password: null,
  setPassword: (pwd) => set({ password: pwd, keyReady: true }),
}));
