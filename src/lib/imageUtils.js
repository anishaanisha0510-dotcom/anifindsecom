/**
 * Image Utilities for Ani Finds
 * Converts and compresses uploaded images directly to compact Base64 Data URLs (WebP / JPEG)
 * for direct storage in Firebase Firestore.
 */

/**
 * Compresses an image file (JPEG, PNG, WebP, etc.) using client-side HTML Canvas
 * and converts it to a compact Base64 Data URL (image/webp or image/jpeg).
 *
 * Keeps image sizes between 30KB - 80KB so products easily fit within
 * Firestore's 1MB document limit even with multiple images.
 *
 * @param {File|Blob} file - The uploaded image file
 * @param {Object} [options]
 * @param {number} [options.maxWidth=900] - Max width in pixels
 * @param {number} [options.maxHeight=900] - Max height in pixels
 * @param {number} [options.quality=0.75] - Compression quality (0 to 1)
 * @returns {Promise<string>} Base64 Data URL
 */
export async function compressImageToBase64(
  file,
  { maxWidth = 900, maxHeight = 900, quality = 0.75 } = {}
) {
  if (!file) return "";

  // If already an SVG or animated GIF, read as plain data URL to preserve vector / frames
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        // Fallback to raw base64 if image decoding fails
        resolve(event.target.result);
      };
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio-preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(event.target.result);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Try exporting to WebP first (best compression), fallback to JPEG
        let dataUrl = canvas.toDataURL("image/webp", quality);
        if (!dataUrl.startsWith("data:image/webp")) {
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        resolve(dataUrl);
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Checks if a string is a Base64 Data URL
 * @param {string} str
 * @returns {boolean}
 */
export function isBase64Image(str) {
  return typeof str === "string" && str.startsWith("data:");
}
