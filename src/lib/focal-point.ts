/* A cropped tile hides whatever the fixed aspect ratio cuts off - most often a
   face pushed to one edge of a group photo. Rather than always defaulting to
   dead centre, this looks at the image itself and guesses the busiest part
   (highest edge contrast, the same signal a face or a knot of people produces)
   so the crop starts somewhere reasonable before anyone drags it. */
export async function estimateFocalPoint(imageUrl: string): Promise<{ x: number; y: number }> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  const loaded = new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Could not load image for focal point analysis"));
  });
  image.src = imageUrl;
  await loaded;

  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return { x: 0.5, y: 0.5 };

  context.drawImage(image, 0, 0, size, size);
  const { data } = context.getImageData(0, 0, size, size);
  const luma = new Float32Array(size * size);
  for (let index = 0; index < size * size; index += 1) {
    const offset = index * 4;
    luma[index] = 0.299 * data[offset]! + 0.587 * data[offset + 1]! + 0.114 * data[offset + 2]!;
  }

  let weightSum = 0;
  let xSum = 0;
  let ySum = 0;
  for (let y = 1; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      const index = y * size + x;
      // Simple gradient magnitude: how sharply this pixel differs from its
      // neighbours. Busy detail (faces, edges, texture) scores high; flat
      // backgrounds and sky score near zero.
      const gx = luma[index + 1]! - luma[index - 1]!;
      const gy = luma[index + size]! - luma[index - size]!;
      const weight = Math.sqrt(gx * gx + gy * gy);
      weightSum += weight;
      xSum += weight * x;
      ySum += weight * y;
    }
  }

  if (weightSum === 0) return { x: 0.5, y: 0.5 };

  return {
    x: Math.min(0.9, Math.max(0.1, xSum / weightSum / size)),
    y: Math.min(0.9, Math.max(0.1, ySum / weightSum / size)),
  };
}
