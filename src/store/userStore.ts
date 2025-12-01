import { create } from "zustand";

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

export const useUserStore = create<UserState>((set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
