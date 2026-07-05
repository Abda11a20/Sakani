// apps/frontend/src/lib/whatsapp.ts

/**
 * Formats a phone number for WhatsApp wa.me links.
 * Converts local Egyptian numbers (starts with 01 and is 11 digits) to 201xxxxxxxxx.
 * Strips all non-digit characters.
 */
export const getWhatsAppLink = (phone: string | null | undefined): string => {
  if (!phone) return "";
  
  // Strip all non-numeric characters
  let cleaned = phone.replace(/[^0-9]/g, "");

  // If it starts with 01 and is 11 digits (typical Egyptian mobile)
  if (cleaned.startsWith("01") && cleaned.length === 11) {
    cleaned = "20" + cleaned.substring(1);
  }

  return `https://wa.me/${cleaned}`;
};
