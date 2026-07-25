export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

export function validateImageFile(file: File): string | null {
  const type = file.type.trim().toLowerCase();
  if (!type || (!ALLOWED_IMAGE_TYPES.has(type) && !type.startsWith("image/"))) {
    return "Use a JPEG, PNG, WebP, GIF, or SVG image under 5MB.";
  }
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return "That image is larger than 5MB. Please choose a smaller file.";
  }
  if (file.size === 0) {
    return "That image file is empty. Please choose another file.";
  }
  return null;
}

export async function fileToBase64(file: File): Promise<string> {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
