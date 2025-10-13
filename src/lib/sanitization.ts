/**
 * Sanitizes color values to prevent CSS injection
 * Only allows valid hex color formats
 */
export const sanitizeColor = (color: string | null | undefined): string => {
  if (!color) return '#000000';
  
  // Only allow hex colors (3 or 6 digits)
  const hexPattern = /^#[0-9A-Fa-f]{6}$|^#[0-9A-Fa-f]{3}$/;
  
  if (hexPattern.test(color)) {
    return color;
  }
  
  // Return safe default if invalid
  return '#000000';
};

/**
 * Sanitizes text content to prevent XSS in structured data
 * Removes HTML tags and dangerous characters
 */
export const sanitizeText = (text: string | null | undefined): string => {
  if (!text) return '';
  
  return text
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script-like content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Escape quotes and backslashes for JSON safety
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    // Remove potential JavaScript event handlers
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove null bytes and other control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
};

/**
 * Sanitizes URLs to prevent JavaScript injection
 */
export const sanitizeUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  
  const urlString = String(url).trim();
  
  // Block javascript: and data: protocols
  if (/^(javascript|data|vbscript):/i.test(urlString)) {
    return '';
  }
  
  // Only allow http, https, and mailto
  if (!/^(https?:\/\/|mailto:)/i.test(urlString)) {
    return `https://${urlString}`;
  }
  
  return urlString;
};
