/**
 * Sakani Platform Abstraction — Storage Service Interface
 * Web implementation wraps localStorage / cookies.
 * React Native implementation will wrap AsyncStorage / MMKV.
 */

export interface IStorageService {
  getItem<T>(key: string): T | null;
  setItem<T>(key: string, value: T): void;
  removeItem(key: string): void;
  clear(): void;
}

class WebStorageService implements IStorageService {
  getItem<T>(key: string): T | null {
    if (typeof window === "undefined") return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  setItem<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("StorageService Error:", e);
    }
  }

  removeItem(key: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error("StorageService Error:", e);
    }
  }

  clear(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.clear();
    } catch (e) {
      console.error("StorageService Error:", e);
    }
  }
}

export const storageService = new WebStorageService();
