import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { reconnectSocket } from "@/lib/socket";

// Tokens live only in httpOnly cookies; this store (persisted to localStorage) never holds them.
interface AuthState {
  user: User | null;
  isHydrated: boolean;
  setUser: (user: User) => void;
  setAuth: (user: User) => void;
  clearAuth: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isHydrated: false,
      // Same account: merge, so payloads without the /auth/me-only fields (isAdmin, hasPassword, hasGoogle) don't drop them.
      setUser: (user) => set((s) => ({ user: s.user?._id === user._id ? { ...s.user, ...user } : user })),
      setAuth: (user) => {
        set({ user });
        // The socket authenticates from the cookie at handshake; reconnect so it picks up the new session.
        reconnectSocket();
      },
      clearAuth: () => {
        set({ user: null });
        reconnectSocket();
      },
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "auth-storage",
      // v0 also persisted accessToken/refreshToken; migrating rewrites storage without them.
      version: 1,
      migrate: (persisted) => ({ user: (persisted as { user?: User | null } | null)?.user ?? null }),
      partialize: (s) => ({ user: s.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
