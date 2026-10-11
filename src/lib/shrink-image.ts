"use client";

const MAX_EDGE = 2560;
const QUALITY = 0.85;

/**
 * Phone photos are often 5–15 MB. Before uploading, scale them so the long edge is at most
 * 2560px (still sharp on big screens) and re-save as JPEG. Small images and anything the
 * browser can't decode are uploaded untouched. PNGs with transparency stay PNG.
 */
export async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 1.5 * 1024 * 1024) {
    bitmap.close();
    return file;
  }

  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const keepPng = file.type === "image/png" && hasTransparency(ctx, width, height);
  const type = keepPng ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY));
  if (!blob || blob.size >= file.size) return file;
  const name = file.name.replace(/\.[^.]+$/, "") + (keepPng ? ".png" : ".jpg");
  return new File([blob], name, { type, lastModified: file.lastModified });
}

function hasTransparency(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Sample a grid of pixels rather than reading every one.
  const data = ctx.getImageData(0, 0, width, height).data;
  const step = Math.max(1, Math.floor((width * height) / 20000)) * 4;
  for (let i = 3; i < data.length; i += step) if (data[i] < 250) return true;
  return false;
}
