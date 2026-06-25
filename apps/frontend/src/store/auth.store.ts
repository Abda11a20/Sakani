// apps/frontend/src/store/auth.store.ts
import { create } from "zustand";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isHydrated: boolean;
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  clearAuth: () => void;
  hydrate: () => void;
}

const TOKEN_KEY = "sakani_token";
const USER_KEY = "sakani_user";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isHydrated: false,

  setUser: (user) => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
    set({ user });
  },

  setToken: (token) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    set({ token });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ user: null, token: null });
  },

  clearAuth: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem("sakani_refresh_token");
    }
    set({ user: null, token: null });
  },

  /**
   * يُستدعى مرة واحدة عند تحميل التطبيق لاستعادة الجلسة من localStorage
   */
  hydrate: () => {
    if (typeof window === "undefined") return;

    set({ isLoading: true });

    try {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);

      if (savedToken && savedUser) {
        const parsedUser: User = JSON.parse(savedUser) as User;
        set({ token: savedToken, user: parsedUser });
      }
    } catch {
      // في حال وجود بيانات تالفة — نمسحها
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      set({ isLoading: false, isHydrated: true });
    }
  },
}));
