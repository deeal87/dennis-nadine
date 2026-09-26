/**
 * Turns a photo from the device into a compact JPEG data URL, so it can be
 * stored in IndexedDB (and included in backups) without an image server.
 */
export async function fileToDataUrl(file: File, maxSize = 1280, quality = 0.82): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Bitte eine Bilddatei auswählen.');
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('Dieses Bildformat kann der Browser nicht lesen.');
  });
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Bild konnte nicht verarbeitet werden.');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', quality);
}

export function isDataImage(value?: string): boolean {
  return !!value && /^data:image\/(jpeg|png|webp|gif);base64,/.test(value);
}
