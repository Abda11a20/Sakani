/**
 * Sakani Platform Abstraction — Sharing Service Placeholder
 */

export interface ISharingService {
  share(data: { title?: string; text?: string; url?: string }): Promise<boolean>;
}

export const sharingService: ISharingService = {
  share: async (data) => {
    if (typeof window !== "undefined" && navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  },
};
