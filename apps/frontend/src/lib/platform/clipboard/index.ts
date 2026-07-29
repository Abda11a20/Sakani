/**
 * Sakani Platform Abstraction — Clipboard Service Placeholder
 */

export interface IClipboardService {
  copyToClipboard(text: string): Promise<boolean>;
}

export const clipboardService: IClipboardService = {
  copyToClipboard: async (text: string) => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  },
};
