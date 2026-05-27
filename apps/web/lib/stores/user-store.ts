import { create } from "zustand";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  plan?: string;
}

interface UserStore {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
