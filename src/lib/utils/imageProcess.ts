/**
 * Image enhancement filter options
 */
export interface ImageFilterOptions {
  brightness: number; // -50 to 50 (default 0)
  contrast: number;   // -50 to 50 (default 0)
  grayscale: boolean;
  binarize: boolean;  // High-contrast adaptive thresholding for text edges
  threshold?: number; // 0 to 255 (default 128)
  rotation: number;   // 0, 90, 180, 270 degrees
}

export const DEFAULT_FILTERS: ImageFilterOptions = {
  brightness: 0,
  contrast: 0,
  grayscale: false,
  binarize: false,
  threshold: 128,
  rotation: 0,
};

/**
 * Loads an image from a URL or Blob into an HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image: ' + e));
    img.src = src;
  });
}

/**
 * Applies rotation, brightness, contrast, grayscale, and binarization filters onto a canvas
 */
export async function processImageToCanvas(
  imageSrc: string,
  filters: ImageFilterOptions,
  cropRect?: { x: number; y: number; width: number; height: number }
): Promise<HTMLCanvasElement> {
  const img = await loadImage(imageSrc);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // Determine source dimensions based on crop
  const sx = cropRect ? cropRect.x : 0;
  const sy = cropRect ? cropRect.y : 0;
  const sw = cropRect ? cropRect.width : img.naturalWidth;
  const sh = cropRect ? cropRect.height : img.naturalHeight;

  // Rotation: 90, 180, 270
  const rot = (filters.rotation % 360 + 360) % 360;
  const isRotated90 = rot === 90 || rot === 270;

  canvas.width = isRotated90 ? sh : sw;
  canvas.height = isRotated90 ? sw : sh;

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rot * Math.PI) / 180);

  // Draw cropped image centered
  ctx.drawImage(img, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
  ctx.restore();

  // If pixel manipulation is requested (brightness, contrast, grayscale, binarize)
  if (filters.brightness !== 0 || filters.contrast !== 0 || filters.grayscale || filters.binarize) {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;

    // Contrast factor calculation
    // contrast in [-50, 50], map to factor
    const contrastFactor = (259 * (filters.contrast + 128)) / (128 * (259 - filters.contrast));
    const brightnessOffset = filters.brightness * 1.5;

    for (let i = 0; i < d.length; i += 4) {
      let r = d[i];
      let g = d[i + 1];
      let b = d[i + 2];

      // Apply brightness & contrast
      if (filters.brightness !== 0 || filters.contrast !== 0) {
        r = contrastFactor * (r - 128) + 128 + brightnessOffset;
        g = contrastFactor * (g - 128) + 128 + brightnessOffset;
        b = contrastFactor * (b - 128) + 128 + brightnessOffset;
      }

      // Grayscale calculation (ITU-R BT.601)
      let gray = 0.299 * r + 0.587 * g + 0.114 * b;

      if (filters.binarize) {
        // High contrast thresholding (binary black & white)
        const thresh = filters.threshold ?? 128;
        const binaryVal = gray >= thresh ? 255 : 0;
        d[i] = binaryVal;
        d[i + 1] = binaryVal;
        d[i + 2] = binaryVal;
      } else if (filters.grayscale) {
        gray = Math.max(0, Math.min(255, gray));
        d[i] = gray;
        d[i + 1] = gray;
        d[i + 2] = gray;
      } else {
        d[i] = Math.max(0, Math.min(255, r));
        d[i + 1] = Math.max(0, Math.min(255, g));
        d[i + 2] = Math.max(0, Math.min(255, b));
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  return canvas;
}
