// apps/frontend/src/features/auth/services/auth.service.ts
import { authRepository } from "../infrastructure/repositories/axios-auth.repository";
import { useAuthStore } from "../store/auth.store";

export const authService = {
  async login(identifier: string, password: string) {
    const res = await authRepository.login({ identifier, password });
    if (res.token && res.user) {
      const store = useAuthStore.getState();
      store.setToken(res.token);
      store.setUser(res.user.toJSON() as any);
    }
    return res;
  },

  async logout() {
    await authRepository.logout();
    useAuthStore.getState().logout();
  },
};
