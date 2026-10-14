/**
 * Shrinks a photo in the browser to a JPEG small enough to upload comfortably on mobile data.
 * Returns the base64 data (no data: prefix) or throws when it cannot be made small enough.
 */
export async function resizeToJpeg(file: File, maxSide = 1600, maxBase64 = 1_000_000): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("no canvas");
  context.fillStyle = "#fff"; // transparent PNGs become white, not black
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.85, 0.75, 0.62, 0.5, 0.4]) {
    const data = canvas.toDataURL("image/jpeg", quality).split(",")[1];
    if (data.length <= maxBase64) return data;
  }
  throw new Error("too large");
}
