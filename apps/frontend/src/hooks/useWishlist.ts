// apps/frontend/src/hooks/useWishlist.ts
import { useState, useEffect, useCallback } from "react";

const WISHLIST_KEY = "sakani_wishlist";
const WISHLIST_EVENT = "sakani_wishlist_update";

export const useWishlist = () => {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  // Get current wishlist from localStorage
  const getWishlistFromStorage = (): string[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(WISHLIST_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Sync state with storage
  const syncWishlist = useCallback(() => {
    setWishlistIds(getWishlistFromStorage());
  }, []);

  useEffect(() => {
    // Initial sync
    syncWishlist();

    // Listen to custom wishlist updates in other components
    window.addEventListener(WISHLIST_EVENT, syncWishlist);
    window.addEventListener("storage", syncWishlist); // sync across tabs

    return () => {
      window.removeEventListener(WISHLIST_EVENT, syncWishlist);
      window.removeEventListener("storage", syncWishlist);
    };
  }, [syncWishlist]);

  const addToWishlist = useCallback((id: string) => {
    if (typeof window === "undefined") return;
    try {
      const current = getWishlistFromStorage();
      if (!current.includes(id)) {
        const next = [...current, id];
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
        setWishlistIds(next);
        window.dispatchEvent(new Event(WISHLIST_EVENT));
      }
    } catch (e) {
      console.error("Failed to add to wishlist", e);
    }
  }, []);

  const removeFromWishlist = useCallback((id: string) => {
    if (typeof window === "undefined") return;
    try {
      const current = getWishlistFromStorage();
      const next = current.filter((item) => item !== id);
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
      setWishlistIds(next);
      window.dispatchEvent(new Event(WISHLIST_EVENT));
    } catch (e) {
      console.error("Failed to remove from wishlist", e);
    }
  }, []);

  const isInWishlist = useCallback(
    (id: string): boolean => {
      return wishlistIds.includes(id);
    },
    [wishlistIds]
  );

  const toggleWishlist = useCallback(
    (id: string) => {
      if (isInWishlist(id)) {
        removeFromWishlist(id);
      } else {
        addToWishlist(id);
      }
    },
    [isInWishlist, addToWishlist, removeFromWishlist]
  );

  return {
    wishlistIds,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
  };
};
